const Product = require('../models/Product');
const Category = require('../models/Category');
const AffiliateClick = require('../models/AffiliateClick');
const { hasLink, parseFilters, clickLookup, clickTotal } = require('../utils/affiliateAnalytics');

async function getDashboardProducts(req, res) {
  let filters;
  try { filters = parseFilters(req.query); } catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    const { page, limit, match } = filters;
    const [result] = await Product.aggregate([
      { $match: match },
      { $facet: {
        metadata: [{ $count: 'total' }],
        products: [
          { $sort: { name: 1, _id: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
          clickLookup,
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
          { $project: { name: 1, updatedAt: 1, 'affiliate.enabled': 1, 'affiliate.network': 1,
            'affiliate.commissionType': 1, 'affiliate.commissionValue': 1,
            hasAffiliateLink: hasLink, totalClicks: clickTotal,
            categoryName: { $ifNull: [{ $arrayElemAt: ['$categoryInfo.name', 0] }, 'Uncategorized'] },
            status: { $cond: [hasLink, { $cond: [{ $eq: ['$affiliate.enabled', true] }, 'enabled_unverified', 'inactive'] }, 'missing'] },
          } },
        ],
      } },
    ]);
    res.set('Cache-Control', 'no-store');
    return res.json({ products: result.products, total: result.metadata[0]?.total || 0, page, limit, approvalTracking: false });
  } catch (error) {
    console.error('Affiliate dashboard products:', error.message);
    return res.status(500).json({ message: 'Could not load affiliate products' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const [summary, categories, clicks, categoryOptions] = await Promise.all([
      Product.aggregate([{ $group: { _id: null, totalProducts: { $sum: 1 }, productsWithLinks: { $sum: { $cond: [hasLink, 1, 0] } } } }]),
      Product.aggregate([
        clickLookup,
        { $group: { _id: '$category', products: { $sum: 1 }, productsWithLinks: { $sum: { $cond: [hasLink, 1, 0] } }, clicks: { $sum: clickTotal } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $project: { products: 1, productsWithLinks: 1, clicks: 1, name: { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'] } } },
        { $sort: { clicks: -1, name: 1 } },
      ]),
      AffiliateClick.aggregate([
        { $facet: {
          total: [{ $count: 'clicks' }],
          byDate: [{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, clicks: { $sum: 1 } } }, { $sort: { _id: -1 } }, { $limit: 30 }, { $sort: { _id: 1 } }],
          byProduct: [
            { $group: { _id: '$product', clicks: { $sum: 1 } } }, { $sort: { clicks: -1, _id: 1 } }, { $limit: 10 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $project: { clicks: 1, name: { $ifNull: [{ $arrayElemAt: ['$product.name', 0] }, 'Deleted product'] } } },
          ],
          byNetwork: [
            { $group: { _id: '$product', clicks: { $sum: 1 } } },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $set: { network: { $trim: { input: { $ifNull: [{ $arrayElemAt: ['$product.affiliate.network', 0] }, ''] } } } } },
            { $group: { _id: { $cond: [{ $eq: ['$network', ''] }, 'Unknown / unassigned', '$network'] }, clicks: { $sum: '$clicks' } } }, { $sort: { clicks: -1, _id: 1 } },
          ],
        } },
      ]),
      Category.find().select('name').sort({ name: 1 }).lean(),
    ]);
    const totals = summary[0] || { totalProducts: 0, productsWithLinks: 0 };
    res.set('Cache-Control', 'no-store');
    return res.json({ ...totals, productsWithoutLinks: totals.totalProducts - totals.productsWithLinks,
      totalClicks: clicks[0].total[0]?.clicks || 0, categories, categoryOptions,
      clicksByDate: clicks[0].byDate, clicksByProduct: clicks[0].byProduct, clicksByNetwork: clicks[0].byNetwork,
      conversionTracking: false, approvalTracking: false,
    });
  } catch (error) {
    console.error('Affiliate dashboard statistics:', error.message);
    return res.status(500).json({ message: 'Could not load affiliate analytics' });
  }
}
module.exports = { getDashboardProducts, getDashboardStats };
