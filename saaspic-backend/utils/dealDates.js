function parseOfferDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error(`${field} must be an ISO timestamp with an explicit time zone.`);
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${field} is invalid.`);
  const calendarDate = new Date(value.slice(0, 10) + 'T00:00:00Z');
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error(`${field} is invalid.`);
  return date;
}
function validateOfferDates(startDate, endDate) {
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) throw new Error('Offer end date must be after the start date.');
}
function unexpiredDealFilter(now = new Date()) {
  return { isActive: true, $and: [{ $or: [{ endDate: null }, { endDate: { $gt: now } }] }] };
}
function activeDealFilter(now = new Date()) {
  const filter = unexpiredDealFilter(now);
  filter.$and.push({ $or: [{ startDate: null }, { startDate: { $lte: now } }] });
  return filter;
}
module.exports = { parseOfferDate, validateOfferDates, unexpiredDealFilter, activeDealFilter };
