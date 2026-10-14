import categories from './categories.json';
export { categories };
export function canonicalSlug(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return categories.find((category) => [category.name, category.slug, ...category.aliases].some((alias) => alias.toLowerCase() === normalized))?.slug || normalized;
}
