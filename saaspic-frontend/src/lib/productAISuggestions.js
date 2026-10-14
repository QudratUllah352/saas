export const suggestionLabels = {
  name: 'Product name', slug: 'Slug', integrations: 'Integrations', strengths: 'Strengths', limitations: 'Limitations',
  description: 'Description', shortDescription: 'Short description', features: 'Main features', category: 'Category', targetAudience: 'Target audience',
};
export function suggestionFields(suggestions, categories) {
  const fields = {};
  for (const key of ['name', 'slug', 'description', 'shortDescription']) if (typeof suggestions[key] === 'string' && suggestions[key].trim()) fields[key] = suggestions[key].trim();
  for (const key of ['features', 'targetAudience', 'integrations', 'strengths', 'limitations']) if (Array.isArray(suggestions[key])) {
    const values = suggestions[key].filter(value => typeof value === 'string').map(value => value.trim()).filter(Boolean);
    if (values.length) fields[key] = values;
  }
  if (categories.some(category => category._id === suggestions.category)) fields.category = suggestions.category;
  return fields;
}
export function slugFromName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export function fieldsToReplace(current, fields) {
  return Object.keys(fields).filter(key => {
    const value = current[key];
    const present = Array.isArray(value) ? value.length > 0 : !!String(value || '').trim();
    const normalized = Array.isArray(fields[key]) && typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : value;
    return present && JSON.stringify(normalized) !== JSON.stringify(fields[key]);
  });
}
export function productArray(value) {
  return (Array.isArray(value) ? value : String(value || '').split(',')).map(item => String(item).trim()).filter(Boolean);
}
export function mergeProductSuggestions(current, fields, replace = false, identity) {
  if (identity && (current.name.trim() !== identity.name || current.website.trim() !== identity.website)) return current;
  const updated = { ...current };
  for (const key of Object.keys(suggestionLabels)) {
    if (fields[key] && (replace || !String(current[key] || '').trim())) updated[key] = fields[key];
  }
  return updated;
}
