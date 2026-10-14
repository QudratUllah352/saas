const categories = require('../config/categories.json');
const normalize = (value) => String(value || '').trim().toLowerCase();
const resolveCategory = (value) => categories.find((category) =>
  [category.name, category.slug, ...category.aliases].some((alias) => normalize(alias) === normalize(value))
);
const canonicalSlug = (value) => resolveCategory(value)?.slug || normalize(value);
module.exports = { categories, resolveCategory, canonicalSlug };
