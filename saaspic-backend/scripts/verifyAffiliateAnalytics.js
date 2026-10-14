// Read-only validation against existing records; never prints affiliate URLs or credentials.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const assert = require('node:assert/strict');
const Product = require('../models/Product');
const AffiliateClick = require('../models/AffiliateClick');
const { getDashboardProducts, getDashboardStats } = require('../controllers/affiliateAnalyticsController');
async function invoke(handler, query = {}) {
  let data;
  await handler({ query }, { set() {}, status(code) { throw new Error(`API returned ${code}`); }, json(value) { data = value; } });
  return data;
}
async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000 });
  const products = await Product.find().select('affiliate.url affiliate.enabled category').lean();
  const withLinks = products.filter((product) => Boolean(product.affiliate?.url?.trim()));
  const stats = await invoke(getDashboardStats);
  assert.equal(stats.totalProducts, products.length);
  assert.equal(stats.productsWithLinks, withLinks.length);
  assert.equal(stats.productsWithoutLinks, products.length - withLinks.length);
  assert.equal(stats.totalClicks, await AffiliateClick.countDocuments());
  assert.equal(stats.clicksByNetwork.reduce((sum, row) => sum + row.clicks, 0), stats.totalClicks);
  for (const [status, expected] of [['with', withLinks.length], ['without', products.length - withLinks.length], ['pending', 0]]) {
    const listing = await invoke(getDashboardProducts, { status });
    assert.equal(listing.total, expected);
    for (const product of listing.products) {
      assert.equal(product.totalClicks, await AffiliateClick.countDocuments({ product: product._id }));
      assert.equal(product.affiliate?.url, undefined);
    }
  }
  for (const category of stats.categoryOptions) {
    const expected = products.filter((product) => String(product.category) === String(category._id));
    const listing = await invoke(getDashboardProducts, { category: String(category._id) });
    assert.equal(listing.total, expected.length);
    const performance = stats.categories.find((row) => String(row._id) === String(category._id));
    if (performance) assert.equal(performance.clicks, await AffiliateClick.countDocuments({ product: { $in: expected.map((product) => product._id) } }));
  }
  assert.equal(stats.conversionTracking, false);
  assert(stats.categories.every((row) => row.conversions === undefined && row.revenue === undefined));
  console.log('PASS: live product coverage, missing links, category filters, click totals, network totals, and untracked conversions.');
}
run().catch(() => { console.error('Affiliate analytics verification failed; check database connectivity and dashboard aggregation.'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
