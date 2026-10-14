const mongoose = require('mongoose');

const hasLink = { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ['$affiliate.url', ''] } } } }, 0] };
function parseFilters(query) {
  const integer = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > max) throw new Error('Invalid pagination');
    return Number(value);
  };
  const page = integer(query.page, 1, 1000000);
  const limit = integer(query.limit, 25, 100);
  const status = query.status || 'all';
  if (!['all', 'with', 'without', 'pending'].includes(status)) throw new Error('Invalid affiliate filter');
  const match = {};
  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || query.search.length > 100) throw new Error('Invalid search');
    match.name = { $regex: query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  if (query.category) {
    if (typeof query.category !== 'string' || !/^[a-f\d]{24}$/i.test(query.category)) throw new Error('Invalid category');
    match.category = new mongoose.Types.ObjectId(query.category);
  }
  if (status === 'with') match.$expr = hasLink;
  if (status === 'without') match.$expr = { $not: [hasLink] };
  // Approval records do not exist in the current product schema.
  if (status === 'pending') match._id = { $exists: false };
  return { page, limit, match };
}
const clickLookup = {
  $lookup: {
    from: 'affiliateclicks', localField: '_id', foreignField: 'product',
    pipeline: [{ $count: 'total' }], as: 'clickCount',
  },
};
const clickTotal = { $ifNull: [{ $arrayElemAt: ['$clickCount.total', 0] }, 0] };
module.exports = { hasLink, parseFilters, clickLookup, clickTotal };
