const test = require('node:test');
const assert = require('node:assert/strict');
process.env.GEMINI_API_KEY ||= 'test-placeholder';
process.env.JWT_SECRET ||= 'test-placeholder';
const { createProductAssistant, cleanSuggestions, retrievedOfficialWebsite, validateProductInput } = require('../controllers/aiProductController');
const Product = require('../models/Product');
const Category = require('../models/Category');
const express = require('express');
const jwt = require('jsonwebtoken');
const productRoutes = require('../routes/productRoutes');
const category = { _id: '000000000000000000000001', name: 'Productivity', slug: 'productivity' };
const input = { name: 'Test product', website: 'https://example.com/' };
const content = { productMatched: true, description: 'A tool for organizing work.', shortDescription: 'Organize work.', features: ['Task lists'], targetAudience: ['Teams'], categorySlug: 'productivity' };
const responseFor = (contentValue = content) => ({ text: JSON.stringify(contentValue), candidates: [{ urlContextMetadata: { urlMetadata: [{ retrievedUrl: input.website, urlRetrievalStatus: 'URL_RETRIEVAL_STATUS_SUCCESS' }] } }] });
async function runHandler(handler, body = input) {
  let code = 200, value;
  const res = { status(number) { code = number; return this; }, json(data) { value = data; return this; } };
  await handler({ body }, res);
  return { code, value };
}
test('Validates product name and official HTTP(S) website', () => {
  assert.deepEqual(validateProductInput(input), input);
  for (const website of ['', 'invalid', 'javascript:alert(1)', 'https://user:password@example.com', 'http://localhost']) assert.throws(() => validateProductInput({ name: 'Product', website }));
  assert.throws(() => validateProductInput({ ...input, name: '' }));
});
test('Requires successful retrieval of the entered official website', () => {
  assert(retrievedOfficialWebsite(responseFor(), input.website));
  assert(!retrievedOfficialWebsite({ text: 'Ungrounded output' }, input.website));
  assert(!retrievedOfficialWebsite(responseFor(), 'https://other.example.com/'));
  assert(!retrievedOfficialWebsite(responseFor(), 'https://example.com/another-product'));
});
test('Only supported suggestion fields and existing category IDs are returned', () => {
  const suggestions = cleanSuggestions({ ...content, pricingInfo: '$49', affiliate: { url: 'private' }, seoTitle: 'Unsupported', slug: 'overwrite', features: ['Task lists', '50% discount', '$49 monthly', 'Task lists'] }, [category]);
  assert.deepEqual(Object.keys(suggestions).sort(), ['category', 'description', 'features', 'shortDescription', 'targetAudience']);
  assert.deepEqual(suggestions.features, ['Task lists']);
  assert.equal(suggestions.category, category._id);
  assert(!cleanSuggestions({ ...content, categorySlug: 'finance' }, [category]).category);
  assert.throws(() => cleanSuggestions({ ...content, productMatched: false }, [category]));
  const extended = cleanSuggestions({ ...content, integrations: ['Documented integration'], strengths: ['Documented capability'], limitations: ['Documented limitation'] }, [category]);
  assert.deepEqual(extended.integrations, ['Documented integration']);
  assert.deepEqual(extended.strengths, ['Documented capability']);
  assert.deepEqual(extended.limitations, ['Documented limitation']);
});
test('Generation uses existing Gemini URL Context and produces editable draft data', async () => {
  let calls = 0;
  const handler = createProductAssistant({ getCategories: async () => [category], generate: async (prompt, config) => {
    calls++; assert(prompt.includes('Do not invent pricing')); assert.deepEqual(config.tools, [{ urlContext: {} }]);
    return { response: responseFor() };
  } });
  const result = await runHandler(handler);
  assert.equal(result.code, 200); assert.equal(calls, 1); assert.equal(result.value.suggestions.category, category._id);
  assert.equal(result.value.source, input.website);
});
test('Invalid input prevents Gemini calls; retrieval and JSON failures stay visible', async () => {
  let calls = 0;
  const dependencies = { getCategories: async () => [category], generate: async () => { calls++; return { response: { text: '{}' } }; } };
  assert.equal((await runHandler(createProductAssistant(dependencies), { ...input, website: 'invalid' })).code, 400);
  assert.equal(calls, 0);
  assert.equal((await runHandler(createProductAssistant(dependencies))).code, 422);
  assert.equal((await runHandler(createProductAssistant({ ...dependencies, generate: async () => ({ response: { ...responseFor(), text: 'not JSON' } }) }))).code, 502);
  assert.equal((await runHandler(createProductAssistant({ ...dependencies, generate: async () => { throw Object.assign(new Error('quota'), { status: 429 }); } }))).code, 429);
});
test('Generated values pass the unchanged Product schema without any database writes', async () => {
  const suggestions = cleanSuggestions(content, [category]);
  const product = new Product({ ...input, slug: 'test-product', ...suggestions });
  await product.validate();
  assert.deepEqual(product.features.toObject(), ['Task lists']);
  assert.equal(String(product.category), category._id);
});
test('Existing product create/update handlers accept approved suggestions and retain unrelated fields', async () => {
  const { createProduct, updateProduct } = require('../controllers/productController');
  const originals = { findOne: Product.findOne, create: Product.create, findById: Product.findById, categoryFind: Category.findById };
  let record, saves = 0;
  const suggestions = cleanSuggestions(content, [category]);
  Category.findById = async () => category;
  Product.findOne = async () => null;
  Product.create = async data => { record = new Product(data); await record.validate(); record.populate = async () => record; return record; };
  Product.findById = () => record;
  let code, result;
  const res = { status(number) { code = number; return this; }, json(value) { result = value; } };
  try {
    await createProduct({ body: { ...input, slug: 'test-product', ...suggestions, integrations: ['Existing integration'], pricingInfo: 'Manual pricing' } }, res);
    assert.equal(code, 201); assert.equal(result.product.description, suggestions.description);
    record.save = async () => { await record.validate(); saves++; };
    await updateProduct({ params: { id: String(record._id) }, body: { ...suggestions, shortDescription: 'Edited suggestion' } }, res);
    assert.equal(code, 200); assert.equal(saves, 1); assert.equal(record.shortDescription, 'Edited suggestion');
    assert.equal(record.pricingInfo, 'Manual pricing'); assert.deepEqual(record.integrations.toObject(), ['Existing integration']);
    assert.equal(record.slug, 'test-product'); assert.equal(record.website, input.website);
  } finally { Product.findOne = originals.findOne; Product.create = originals.create; Product.findById = originals.findById; Category.findById = originals.categoryFind; }
});
test('AI and existing Product CRUD routes keep admin authentication', async () => {
  const app = express(); app.use(express.json()); app.use('/api/products', productRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/products`;
  try {
    for (const [route, method] of [['/ai/generate', 'POST'], ['', 'POST'], ['/product-id', 'PATCH'], ['/product-id', 'DELETE']]) {
      const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      assert.equal(response.status, 401);
    }
    const response = await fetch(base + '/ai/generate', { method: 'POST', headers: { Authorization: 'Bearer invalid' } });
    assert.equal(response.status, 401);
    const nonAdmin = jwt.sign({ role: 'user' }, process.env.JWT_SECRET);
    assert.equal((await fetch(base + '/ai/generate', { method: 'POST', headers: { Authorization: `Bearer ${nonAdmin}` } })).status, 403);
    const admin = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
    assert.equal((await fetch(base + '/ai/generate', { method: 'POST', headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
