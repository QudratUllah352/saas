const test = require('node:test');
const assert = require('node:assert/strict');
const Deal = require('../models/Deal');
const Product = require('../models/Product');
const { createDeal, updateDeal, toggleDealStatus, getDeals } = require('../controllers/dealController');

test('Admin creates, edits, publishes and unpublishes a deal through existing controllers', async () => {
  const originals = { product: Product.findById, create: Deal.create, byId: Deal.findById, find: Deal.find };
  let stored, response, status;
  const res = { status(code) { status = code; return this; }, json(body) { response = body; return this; } };
  const product = '000000000000000000000001';
  const fields = { product, discount: '50% OFF', price: 10, oldPrice: 20, dealUrl: 'https://example.com/deal', dealType: 'annual', startDate: null, endDate: null };
  Product.findById = async id => id === product ? { _id: product } : null;
  Deal.create = async fields => { stored = new Deal(fields); await stored.validate(); stored.save = async () => stored.validate(); return stored; };
  Deal.findById = () => { const result = Promise.resolve(stored); result.populate = async () => stored; return result; };
  Deal.find = filter => ({ populate: () => ({ sort: async () => stored.isActive === filter.isActive ? [stored] : [] }) });
  try {
    await createDeal({ body: { ...fields, product: 'missing' } }, res);
    assert.equal(status, 404);
    await createDeal({ body: { ...fields, isActive: 'false' } }, res);
    assert.equal(status, 400);
    await createDeal({ body: { ...fields, price: -1 } }, res);
    assert.equal(status, 400);
    await createDeal({ body: { ...fields, isActive: false } }, res);
    assert.equal(status, 201); assert.equal(response.isActive, false);
    assert.equal(response.product.toString(), product);
    for (const key of ['discount', 'price', 'oldPrice', 'dealUrl', 'dealType']) assert.equal(response[key], fields[key]);
    await getDeals({}, res); assert.equal(response.length, 0);
    await updateDeal({ params: { id: stored._id }, body: { discount: '60% OFF', price: 8, oldPrice: 20, dealType: 'monthly', dealUrl: 'https://example.com/updated', startDate: '2026-01-01T00:00:00Z', endDate: '2099-01-01T00:00:00Z' } }, res);
    assert.equal(status, 200); assert.equal(response.deal.price, 8); assert.equal(response.deal.discount, '60% OFF');
    assert.equal(response.deal.dealType, 'monthly'); assert.equal(response.deal.startDate.toISOString(), '2026-01-01T00:00:00.000Z');
    await toggleDealStatus({ params: { id: stored._id } }, res);
    assert.equal(status, 200); assert.equal(response.deal.isActive, true);
    await getDeals({}, res); assert.equal(response.length, 1);
    await toggleDealStatus({ params: { id: stored._id } }, res);
    assert.equal(response.deal.isActive, false);
    await createDeal({ body: fields }, res);
    assert.equal(status, 201); assert.equal(response.isActive, true, 'existing callers still publish by default');
  } finally {
    Product.findById = originals.product; Deal.create = originals.create; Deal.findById = originals.byId; Deal.find = originals.find;
  }
});
