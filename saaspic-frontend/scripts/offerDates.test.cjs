const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('next/dist/compiled/babel/core');
const bundle = require('next/dist/compiled/babel/bundle');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const componentModule = { exports: {} };
  const transformed = babel.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, configFile: false, babelrc: false, presets: [[bundle.presetReact().default, { runtime: 'automatic' }]], plugins: [bundle.pluginTransformModulesCommonjs().default] });
  const componentRequire = name => {
    if (name.endsWith('.css')) return {};
    if (name.startsWith('@/')) return load(path.join('src', name.slice(2)) + '.js');
    if (name.startsWith('.')) return load(path.join(path.dirname(file), name) + '.jsx');
    return require(name);
  };
  vm.runInNewContext(transformed.code, { require: componentRequire, module: componentModule, exports: componentModule.exports, process, console });
  cache.set(file, componentModule.exports);
  return componentModule.exports;
}
const { default: OfferTiming, DealOfferButton } = load('src/components/OfferTiming.jsx');
const Fields = load('src/components/OfferDatesFields.jsx').default;
const initialNow = Date.parse('2026-10-09T12:00:00Z');
const product = { _id: 'product-id', website: 'https://example.com', affiliate: { enabled: true } };
test('Active offer displays UTC dates and remaining time', () => {
  const html = renderToStaticMarkup(React.createElement(OfferTiming, { initialNow, deal: { isActive: true, startDate: '2026-10-09T11:00:00Z', endDate: '2026-10-09T13:00:00Z' } }));
  assert(html.includes('Active')); assert(html.includes('UTC')); assert(html.includes('1 hr 0 min remaining')); assert(html.includes('dateTime="2026-10-09T13:00:00Z"'));
});
test('Upcoming and expired offers cannot render an affiliate offer link', () => {
  for (const deal of [{ startDate: '2026-10-09T13:00:00Z' }, { endDate: '2026-10-09T12:00:00Z' }, { isActive: false }]) {
    const html = renderToStaticMarkup(React.createElement(DealOfferButton, { initialNow, deal, product, source: 'deal' }));
    assert(!html.includes('<a')); assert(html.includes('offer-unavailable'));
  }
});
test('Undated offers preserve affiliate source and sponsored link tracking', () => {
  const html = renderToStaticMarkup(React.createElement(DealOfferButton, { initialNow, deal: {}, product, source: 'deal' }));
  assert(html.includes('/affiliate/go/product-id?source=deal')); assert(html.includes('noopener noreferrer sponsored'));
});
test('Upcoming countdown and legacy no-expiry display', () => {
  const upcoming = renderToStaticMarkup(React.createElement(OfferTiming, { initialNow, deal: { startDate: '2026-10-09T13:00:00Z' } }));
  assert(upcoming.includes('Upcoming')); assert(upcoming.includes('Starts in 1 hr 0 min'));
  const undated = renderToStaticMarkup(React.createElement(OfferTiming, { initialNow, deal: {} }));
  assert(undated.includes('Active')); assert(!undated.includes('<time'));
});
test('Admin schedule fields are optional and explicitly labeled UTC', () => {
  const html = renderToStaticMarkup(React.createElement(Fields, { startDate: '', endDate: '', onChange() {} }));
  assert.equal((html.match(/type="datetime-local"/g) || []).length, 2);
  assert(html.includes('for="offer-start"')); assert(html.includes('for="offer-end"')); assert(html.includes('UTC')); assert(!html.includes('required'));
});
