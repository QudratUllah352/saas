const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseOfferDate, validateOfferDates, activeDealFilter, unexpiredDealFilter } = require('../utils/dealDates');
const Deal = require('../models/Deal');
const now = new Date('2026-10-09T12:00:00Z');
const before = '2026-10-09T11:00:00Z';
const after = '2026-10-09T13:00:00Z';
const frontend = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(__dirname, '../../saaspic-frontend/src/lib/dealDates.js'), 'utf8')).toString('base64'));
test('Optional dates and explicit time zone parsing', () => {
  for (const value of [undefined, null, '']) assert.equal(parseOfferDate(value, 'Date'), null);
  assert.equal(parseOfferDate('2026-10-09T17:00:00+05:00', 'Date').toISOString(), now.toISOString());
  for (const value of ['2026-10-09', '2026-10-09T12:00', 'invalid', '2026-02-30T12:00:00Z', 10]) assert.throws(() => parseOfferDate(value, 'Date'));
});
test('End date must strictly follow start; either date may be omitted', () => {
  assert.doesNotThrow(() => validateOfferDates(null, after));
  assert.doesNotThrow(() => validateOfferDates(before, null));
  assert.doesNotThrow(() => validateOfferDates(before, after));
  assert.throws(() => validateOfferDates(after, before));
  assert.throws(() => validateOfferDates(before, before));
});
test('Mongoose validation enforces date order without connecting to MongoDB', async () => {
  const fields = { product: '000000000000000000000001', discount: 'Offer', price: 1, oldPrice: 2, dealUrl: 'https://example.com' };
  const undated = new Deal(fields);
  assert.equal(undated.startDate, null); assert.equal(undated.endDate, null);
  await undated.validate();
  await assert.rejects(new Deal({ ...fields, startDate: after, endDate: before }).validate(), /after the start/);
  await new Deal({ ...fields, startDate: before, endDate: null }).validate();
});
test('Statuses cover legacy records, boundaries, scheduling, and manual inactivity', async () => {
  const { getOfferStatus } = await frontend;
  assert.equal(getOfferStatus({}, +now), 'Active');
  assert.equal(getOfferStatus({ isActive: true, startDate: null, endDate: null }, +now), 'Active');
  assert.equal(getOfferStatus({ isActive: true, startDate: after }, +now), 'Upcoming');
  assert.equal(getOfferStatus({ startDate: now.toISOString(), endDate: after }, +now), 'Active');
  assert.equal(getOfferStatus({ endDate: now.toISOString() }, +now), 'Expired');
  assert.equal(getOfferStatus({ endDate: before }, +now), 'Expired');
  assert.equal(getOfferStatus({ isActive: false, startDate: after }, +now), 'Inactive');
  assert.equal(getOfferStatus({ isActive: false, endDate: after }, +now), 'Inactive');
});
test('UTC input round trip preserves existing milliseconds and optional dates', async () => {
  const { toDateInput, fromDateInput, dateValidation, remainingTime } = await frontend;
  const instant = '2026-10-09T12:34:56.789Z';
  assert.equal(fromDateInput(toDateInput(instant)), instant);
  assert.equal(fromDateInput(''), null); assert.equal(toDateInput(null), '');
  assert.equal(dateValidation('', ''), '');
  assert.match(dateValidation('2026-10-09T13:00', '2026-10-09T12:00'), /after/);
  assert.equal(remainingTime(after, +now), '1 hr 0 min');
});
function matches(record, filter) {
  return Object.entries(filter).every(([field, condition]) => {
    if (field === '$and') return condition.every(item => matches(record, item));
    if (field === '$or') return condition.some(item => matches(record, item));
    if (condition === null) return record[field] == null;
    if (typeof condition === 'object') return Object.entries(condition).every(([op, value]) => op === '$gt' ? new Date(record[field]) > value : new Date(record[field]) <= value);
    return record[field] === condition;
  });
}
test('Public/search filters preserve undated records, exclude expired, and retain upcoming', () => {
  const filter = unexpiredDealFilter(now);
  assert(matches({ isActive: true }, filter));
  assert(matches({ isActive: true, startDate: after }, filter));
  assert(!matches({ isActive: true, endDate: before }, filter));
  assert(!matches({ isActive: true, endDate: now }, filter));
  assert(!matches({ isActive: false }, filter));
  assert(!matches({ isActive: true, startDate: after }, activeDealFilter(now)));
  assert(matches({ isActive: true, startDate: before, endDate: after }, activeDealFilter(now)));
});
test('Partial update validates merged dates and rejects invalid input before save', async () => {
  const { updateDeal } = require('../controllers/dealController');
  const original = Deal.findById;
  let saves = 0;
  const document = { _id: 'id', startDate: new Date(before), endDate: new Date(after), save: async () => { saves++; } };
  Deal.findById = () => document;
  let code, result;
  const res = { status(value) { code = value; return this; }, json(value) { result = value; } };
  try {
    await updateDeal({ params: { id: 'id' }, body: { endDate: before } }, res);
    assert.equal(code, 400); assert.match(result.error, /after/); assert.equal(saves, 0);
    await updateDeal({ params: { id: 'id' }, body: { startDate: '2026-10-09T12:00' } }, res);
    assert.equal(code, 400); assert.equal(saves, 0);
  } finally { Deal.findById = original; }
});
