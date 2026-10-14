const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('next/dist/compiled/babel/core');
const bundle = require('next/dist/compiled/babel/bundle');

function harness(file, replies, token = 'admin-token') {
  const states = [], effects = [], calls = [], routes = [];
  let cursor = 0;
  const hooks = {
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
    useEffect(effect) { if (!effects.length) effects.push(effect); },
  };
  const mod = { exports: {} };
  const code = babel.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, configFile: false, babelrc: false, presets: [[bundle.presetReact().default, { runtime: 'automatic' }]], plugins: [bundle.pluginTransformModulesCommonjs().default] }).code;
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'next/navigation') return { useRouter: () => ({ replace: url => routes.push(url), push: url => routes.push(url) }), useParams: () => ({ id: 'deal-id' }) };
      if (name === '@/lib/api') return { API_URL: 'http://test/api' };
      if (name === '@/lib/dealDates') return { toDateInput: value => value ? new Date(value).toISOString().slice(0, -1) : '', fromDateInput: value => value ? new Date(value + 'Z').toISOString() : null, dateValidation: (start, end) => start && end && end <= start ? 'Offer end date must be after the start date.' : '' };
      if (name === 'next/link') return { __esModule: true, default: () => null };
      if (name === '@/components/OfferDatesFields') {
        const fields = { exports: {} };
        const compiled = babel.transformSync(fs.readFileSync('src/components/OfferDatesFields.jsx', 'utf8'), { configFile: false, babelrc: false, presets: [[bundle.presetReact().default, { runtime: 'automatic' }]], plugins: [bundle.pluginTransformModulesCommonjs().default] }).code;
        vm.runInNewContext(compiled, { module: fields, exports: fields.exports, require: name => name.endsWith('.css') ? {} : require(name) });
        return fields.exports;
      }
      return require(name);
    },
    localStorage: { getItem: () => token, removeItem() {} },
    async fetch(url, options) { calls.push({ url, ...options }); const reply = replies.shift(); return { status: reply.status || 200, ok: (reply.status || 200) < 400, json: async () => reply.body }; },
    setTimeout: callback => callback(),
  });
  function render() { cursor = 0; return mod.exports.default(); }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    if (typeof node.type === 'function') return find(node.type(node.props), predicate);
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
    return null;
  }
  return { calls, routes, states, render, find, async load() { render(); effects[0](); await new Promise(resolve => setImmediate(resolve)); }, change(name, value) { const node = find(render(), node => node.props?.name === name); assert(node, name); node.props.onChange({ target: { name, value, type: name === 'isActive' ? 'checkbox' : 'text', checked: value } }); }, async submit() { await find(render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} }); } };
}

const newPage = 'src/app/admin/deals/new/page.js';
test('Add Deal loads existing products and submits every supported field to the existing API', async () => {
  for (const publish of [true, false]) {
    const h = harness(newPage, [{ body: [{ _id: 'product-id', name: 'Product' }] }, { status: 201, body: { _id: 'deal-id' } }]);
    await h.load();
    assert.equal(h.calls[0].url, 'http://test/api/products');
    const fields = { product: 'product-id', discount: '50% OFF', price: '10', oldPrice: '20', dealUrl: 'https://example.com/deal', dealType: 'annual', startDate: '2026-01-01T00:00', endDate: '2099-01-01T00:00', isActive: publish };
    for (const [name, value] of Object.entries(fields)) h.change(name, value);
    await h.submit();
    assert.equal(h.calls[1].url, 'http://test/api/deals'); assert.equal(h.calls[1].method, 'POST');
    assert.equal(h.calls[1].headers.Authorization, 'Bearer admin-token');
    assert.deepEqual(JSON.parse(h.calls[1].body), { ...fields, price: 10, oldPrice: 20, startDate: '2026-01-01T00:00:00.000Z', endDate: '2099-01-01T00:00:00.000Z' });
    assert(h.routes.includes('/admin/deals'));
  }
});
test('Creation handles empty products, authentication, invalid dates and backend errors', async () => {
  const empty = harness(newPage, [{ body: [] }]); await empty.load();
  assert.equal(empty.find(empty.render(), node => node.type === 'button').props.disabled, true);
  const unauth = harness(newPage, [], null); await unauth.load(); assert(unauth.routes.includes('/login')); assert.equal(unauth.calls.length, 0);
  const h = harness(newPage, [{ body: [{ _id: 'p', name: 'Product' }] }, { status: 400, body: { error: 'Product no longer exists' } }]); await h.load();
  h.change('product', 'p'); h.change('startDate', '2026-02-01T00:00'); h.change('endDate', '2026-01-01T00:00');
  await h.submit(); assert.equal(h.calls.length, 1); assert(h.states.includes('Offer end date must be after the start date.'));
  h.change('startDate', ''); h.change('endDate', ''); await h.submit(); assert(h.states.includes('Product no longer exists')); assert.equal(h.routes.length, 0);
});
test('Existing edit form still loads a deal and saves through PATCH', async () => {
  const h = harness('src/app/admin/deals/[id]/edit/page.js', [{ body: { product: { name: 'Product' }, discount: 'Offer', price: 0, oldPrice: 20, dealUrl: 'https://example.com', dealType: 'lifetime' } }, { body: { message: 'Updated' } }]);
  await h.load(); h.change('price', '5'); h.change('discount', 'Updated offer'); await h.submit();
  assert.equal(h.calls[0].url, 'http://test/api/deals/admin/deal-id');
  assert.equal(h.calls[1].url, 'http://test/api/deals/deal-id'); assert.equal(h.calls[1].method, 'PATCH');
  const payload = JSON.parse(h.calls[1].body); assert.equal(payload.price, 5); assert.equal(payload.discount, 'Updated offer');
  assert(h.routes.includes('/admin/deals'));
});
