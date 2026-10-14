const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFilters, hasLink } = require('../utils/affiliateAnalytics');
const { requireRole } = require('../middleware/adminAuth');
const Product = require('../models/Product');
const Category = require('../models/Category');
const AffiliateClick = require('../models/AffiliateClick');
const { getDashboardProducts, getDashboardStats } = require('../controllers/affiliateAnalyticsController');

test('filters validate pagination, category, status and escape search regex', () => {
  const filters = parseFilters({ page: '2', limit: '25', status: 'with', search: 'Tool.*', category: '0123456789abcdef01234567' });
  assert.equal(filters.page, 2);
  assert.equal(filters.match.name.$regex, 'Tool\\.\\*');
  assert.equal(filters.match.category.toString(), '0123456789abcdef01234567');
  assert.deepEqual(filters.match.$expr, hasLink);
  assert.deepEqual(parseFilters({ status: 'without' }).match.$expr, { $not: [hasLink] });
  assert.deepEqual(parseFilters({ status: 'pending' }).match._id, { $exists: false });
  for (const query of [{ page: '0' }, { limit: '101' }, { page: '2.5' }, { category: 'bad' }, { search: {} }, { status: 'approved' }]) assert.throws(() => parseFilters(query));
});

test('affiliate roles reject unauthenticated and editor requests', () => {
  for (const [admin, expected] of [[undefined, 401], [{ role: 'editor' }, 403], [{ role: 'admin' }, 200], [{ role: 'superadmin' }, 200]]) {
    let code;
    requireRole('superadmin', 'admin')({ admin }, { status(value) { code = value; return this; }, json() {} }, () => { code = 200; });
    assert.equal(code, expected);
  }
});

test('products paginate before click lookup and exclude URLs and tracking metadata', async () => {
  const original = Product.aggregate;
  try {
    Product.aggregate = async (pipeline) => {
      const stages = pipeline[1].$facet.products;
      assert.equal(stages[1].$skip, 25);
      assert.equal(stages[2].$limit, 25);
      assert.equal(stages[3].$lookup.from, 'affiliateclicks');
      const projection = stages.at(-1).$project;
      assert.equal(projection['affiliate.url'], undefined);
      assert.equal(projection.affiliate, undefined);
      return [{ products: [{ name: 'Existing product', totalClicks: 7 }], metadata: [{ total: 30 }] }];
    };
    let body;
    await getDashboardProducts({ query: { page: '2' } }, { set() {}, json(value) { body = value; } });
    assert.equal(body.total, 30);
    assert.equal(body.products[0].totalClicks, 7);
  } finally { Product.aggregate = original; }
});

test('statistics use affiliate records and do not invent conversions or revenue', async () => {
  const originals = [Product.aggregate, AffiliateClick.aggregate, Category.find];
  try {
    let calls = 0;
    Product.aggregate = async () => ++calls === 1 ? [{ totalProducts: 3, productsWithLinks: 2 }] : [{ _id: 'category', name: 'Tools', products: 3, productsWithLinks: 2, clicks: 7 }];
    AffiliateClick.aggregate = async (pipeline) => {
      assert.deepEqual(pipeline[0].$facet.total, [{ $count: 'clicks' }]);
      return [{ total: [{ clicks: 7 }], byDate: [], byProduct: [], byNetwork: [] }];
    };
    Category.find = () => ({ select: () => ({ sort: () => ({ lean: async () => [] }) }) });
    let body;
    await getDashboardStats({}, { set() {}, json(value) { body = value; } });
    assert.equal(body.totalClicks, 7);
    assert.equal(body.productsWithoutLinks, 1);
    assert.equal(body.conversionTracking, false);
    assert.equal(body.categories[0].conversions, undefined);
    assert.equal(body.categories[0].revenue, undefined);
  } finally { [Product.aggregate, AffiliateClick.aggregate, Category.find] = originals; }
});
