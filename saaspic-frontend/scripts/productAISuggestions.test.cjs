const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('next/dist/compiled/babel/core');
const helpers = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('src/lib/productAISuggestions.js', 'utf8')).toString('base64'));
const categories = [{ _id: 'category-id', name: 'Productivity' }];
const suggestions = { description: 'Suggested description', shortDescription: 'Suggested summary', category: 'category-id', features: ['Lists, boards', 'Tasks'], targetAudience: ['Teams'], integrations: ['Documented integration'], strengths: ['Documented strength'], limitations: ['Documented limitation'], pricingInfo: 'Unsupported' };
test('Maps suggestions only to fields supported by the existing product forms', async () => {
  const { suggestionFields } = await helpers;
  const fields = suggestionFields(suggestions, categories);
  assert.deepEqual(fields.features, ['Lists, boards', 'Tasks']);
  assert.equal(fields.category, 'category-id'); assert(!('pricingInfo' in fields));
  assert(!suggestionFields({ ...suggestions, category: 'unknown' }, categories).category);
});
test('Fill-empty action preserves every populated field and all unrelated values', async () => {
  const { suggestionFields, mergeProductSuggestions } = await helpers;
  const current = { name: 'Product', website: 'https://example.com', slug: 'manual-slug', description: 'Manual description', features: 'Manual feature', category: 'manual-category', shortDescription: '', targetAudience: '', pricingInfo: 'Existing pricing', logo: 'logo' };
  const merged = mergeProductSuggestions(current, suggestionFields(suggestions, categories));
  for (const key of ['name', 'website', 'slug', 'description', 'features', 'category', 'pricingInfo', 'logo']) assert.equal(merged[key], current[key]);
  assert.equal(merged.shortDescription, suggestions.shortDescription); assert.deepEqual(merged.targetAudience, ['Teams']);
  assert.equal(current.shortDescription, '', 'Input object must not be mutated');
});
test('Explicit replace action updates only suggested fields', async () => {
  const { suggestionFields, mergeProductSuggestions } = await helpers;
  const current = { name: 'Product', website: 'https://example.com', slug: 'manual', description: 'Manual description', integrations: 'Existing', pricingInfo: 'Existing' };
  const merged = mergeProductSuggestions(current, suggestionFields(suggestions, categories), true);
  assert.equal(merged.description, suggestions.description); assert.deepEqual(merged.integrations, suggestions.integrations);
  assert.equal(merged.slug, current.slug); assert.equal(merged.pricingInfo, current.pricingInfo);
});
test('A changed product identity cannot receive stale generation results', async () => {
  const { mergeProductSuggestions } = await helpers;
  const current = { name: 'Different product', website: 'https://example.com', description: '' };
  assert.equal(mergeProductSuggestions(current, { description: 'Stale' }, true, { name: 'Old product', website: current.website }), current);
});
function componentHandler(name, context) {
  const source = fs.readFileSync('src/components/AdminProductAssistant.jsx', 'utf8');
  const ast = babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { sourceType: 'module', plugins: ['jsx'] } });
  let handler;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) handler = node;
    for (const value of Object.values(node)) { if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value); }
  }
  visit(ast);
  return vm.runInNewContext('(' + source.slice(handler.start, handler.end) + ')', context);
}
async function runGeneration(mode, confirm = true, fail = false) {
  const h = await helpers;
  const original = { name: 'Product', website: 'https://example.com', slug: 'manual-slug', description: 'Manual', shortDescription: '', features: '', targetAudience: '', integrations: '', strengths: '', limitations: '', pricingInfo: 'Manual price', logo: 'manual-logo', affiliate: { enabled: true } };
  let updated = original, changes = 0, confirmations = 0, error = '', message = '';
  const requests = [];
  const handler = componentHandler('generate', {
    ...h, formData: original, categories, currentForm: { current: original }, API_URL: 'http://test/api', mode,
    localStorage: { getItem: () => 'test-token' }, router: { push() {} }, setError(value) { error = value; }, setMessage(value) { message = value; }, setLoading() {},
    setFormData(updater) { changes++; updated = updater(updated); },
    window: { confirm() { confirmations++; return confirm; } },
    fetch: async (url, options) => { requests.push({ url, options }); return { ok: !fail, status: fail ? 502 : 200, json: async () => fail ? { message: 'Generation failed' } : { suggestions } }; },
  });
  await handler();
  return { original, updated, changes, confirmations, requests, error, message };
}
test('Add automatically autofills actual state without confirmation or a product-save request', async () => {
  const result = await runGeneration('add');
  assert.equal(result.changes, 1); assert.equal(result.confirmations, 0);
  assert.equal(result.updated.description, suggestions.description); assert.equal(result.updated.slug, 'product');
  assert.deepEqual(result.updated.features, suggestions.features); assert.equal(result.updated.category, 'category-id');
  assert.equal(result.updated.website, result.original.website); assert.equal(result.updated.pricingInfo, result.original.pricingInfo);
  assert.deepEqual(result.updated.affiliate, result.original.affiliate);
  assert.equal(result.requests.length, 1); assert.equal(result.requests[0].url, 'http://test/api/products/ai/generate');
});
test('Edit confirms before overwriting and cancel keeps all existing values', async () => {
  const canceled = await runGeneration('edit', false);
  assert.equal(canceled.confirmations, 1); assert.equal(canceled.changes, 0); assert.equal(canceled.updated, canceled.original);
  const approved = await runGeneration('edit', true);
  assert.equal(approved.confirmations, 1); assert.equal(approved.changes, 1);
  assert.equal(approved.updated.description, suggestions.description); assert.equal(approved.updated.website, approved.original.website);
});
test('AI errors never change existing product values', async () => {
  const result = await runGeneration('edit', true, true);
  assert.equal(result.changes, 0); assert.equal(result.updated, result.original); assert.match(result.error, /failed/);
});
test('Array serialization preserves generated elements including internal commas', async () => {
  const { productArray } = await helpers;
  assert.deepEqual(productArray(suggestions.features), suggestions.features);
  assert.deepEqual(productArray(' Tasks, Teams '), ['Tasks', 'Teams']);
});
test('Both real form components display autofilled inputs, dropdown and editable arrays', async () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const bundle = require('next/dist/compiled/babel/bundle');
  const h = await helpers;
  for (const route of ['new', '[id]/edit']) {
    const file = `src/app/admin/products/${route}/page.js`;
    const source = fs.readFileSync(file, 'utf8');
    const filled = (await runGeneration(route === 'new' ? 'add' : 'edit')).updated;
    const componentModule = { exports: {} };
    const code = babel.transformSync(source, { configFile: false, babelrc: false, presets: [[bundle.presetReact().default, { runtime: 'automatic' }]], plugins: [bundle.pluginTransformModulesCommonjs().default] }).code;
    const componentRequire = name => {
      if (name === 'react') return { ...React, useEffect() {}, useState(value) { return [value && typeof value === 'object' && !Array.isArray(value) ? filled : Array.isArray(value) ? categories : typeof value === 'boolean' ? false : value, () => {}]; } };
      if (name === 'next/navigation') return { useRouter: () => ({}), useParams: () => ({ id: 'product-id' }) };
      if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
      if (name === '@/components/AdminProductAssistant') return { __esModule: true, default: () => null };
      if (name === '@/lib/productAISuggestions') return h;
      if (name === '@/lib/api') return { API_URL: 'http://test/api' };
      return require(name);
    };
    vm.runInNewContext(code, { require: componentRequire, module: componentModule, exports: componentModule.exports });
    const html = renderToStaticMarkup(React.createElement(componentModule.exports.default));
    assert(html.includes('value="Product"')); assert(html.includes('value="product"'));
    assert(html.includes('value="https://example.com"'));
    assert(html.includes('Suggested description')); assert(html.includes('Suggested summary'));
    assert(html.includes('Lists, boards, Tasks')); assert(html.includes('Teams'));
    assert(html.includes('Documented integration')); assert(html.includes('Documented strength')); assert(html.includes('Documented limitation'));
    assert.match(html, /option value="category-id" selected=""/);
    assert(!html.includes('readonly')); assert(!html.includes('readOnly'));
    const changed = { ...filled, description: 'Admin edited the generated description' };
    assert.equal(changed.description, 'Admin edited the generated description');
  }
});
test('Explicit Save on Add and Edit serializes the autofilled arrays through existing handlers', async () => {
  const h = await helpers;
  for (const route of ['new', '[id]/edit']) {
    const source = fs.readFileSync(`src/app/admin/products/${route}/page.js`, 'utf8');
    const ast = babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { sourceType: 'module', plugins: ['jsx'] } });
    let node;
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if (value.type === 'FunctionDeclaration' && value.id?.name === 'handleSubmit') node = value;
      for (const child of Object.values(value)) { if (Array.isArray(child)) child.forEach(visit); else if (child && typeof child === 'object') visit(child); }
    }
    visit(ast);
    const formData = { ...(await runGeneration(route === 'new' ? 'add' : 'edit')).updated, logo: '' };
    let payload, method;
    const handler = vm.runInNewContext('(' + source.slice(node.start, node.end) + ')', {
      formData, productId: 'product-id', textToArray: h.productArray, API: 'http://test/api', localStorage: { getItem: () => 'test-token' }, router: { push() {} },
      setError() {}, setMessage() {}, setLoading() {}, setSaving() {}, setFormData() {}, initialForm: {}, setTimeout() {}, console,
      fetch: async (url, options) => { payload = JSON.parse(options.body); method = options.method; return { ok: true, status: 200, json: async () => ({ message: 'Saved' }) }; },
    });
    await handler({ preventDefault() {} });
    assert(payload); assert.equal(method, route === 'new' ? 'POST' : 'PATCH');
    assert.deepEqual(payload.features, suggestions.features); assert.deepEqual(payload.targetAudience, suggestions.targetAudience);
    for (const key of ['integrations', 'strengths', 'limitations']) assert.deepEqual(payload[key], suggestions[key]);
    assert.equal(payload.category, 'category-id'); assert.equal(payload.description, suggestions.description);
    assert.equal(payload.website, formData.website);
  }
});
