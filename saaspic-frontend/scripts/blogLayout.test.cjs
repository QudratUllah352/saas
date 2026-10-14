const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('next/dist/compiled/babel/core');
const bundle = require('next/dist/compiled/babel/bundle');

function loadPage(file, responses) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const mod = { exports: {} };
    const code = babel.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, configFile: false, babelrc: false, presets: [[bundle.presetReact().default, { runtime: 'automatic' }]], plugins: [bundle.pluginTransformModulesCommonjs().default] }).code;
    vm.runInNewContext(code, {
      module: mod, exports: mod.exports, process, console,
      async fetch(url) { return { ok: true, json: async () => responses[url.replace('http://test/api', '')] || [] }; },
      require(name) {
        if (name.endsWith('.css')) return {};
        if (name === '@/lib/api') return { API_URL: 'http://test/api' };
        if (name === '@/lib/seo') return { pageMetadata: value => value, unavailableMetadata: value => value };
        if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
        if (name.endsWith('/Navbar') || name.endsWith('/Footer')) return { __esModule: true, default: () => null };
        if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name) + '.jsx');
        return require(name);
      },
    });
    cache.set(file, mod.exports); return mod.exports;
  }
  return load(file).default;
}
const blog = { _id: 'blog-id', slug: 'sample-guide', title: 'A complete SaaS guide', excerpt: 'Guide excerpt', introduction: 'First paragraph.\n\nSecond paragraph.', author: 'SaaSpin Team', publishedAt: '2026-10-09T00:00:00Z', readTime: 6, category: 'Software', tags: ['SaaS'], sections: [{ heading: 'Section heading', content: 'Authored content with <script>alert(1)</script> and https://example.com/long/path' }], conclusion: 'Original conclusion', relatedProducts: [] };

test('Blog listing displays an accessible empty state without fabricated articles', async () => {
  const Page = loadPage('src/app/blogs/page.js', { '/blogs': [] });
  const html = renderToStaticMarkup(await Page());
  assert.match(html, /role="status"/); assert.match(html, /No articles published yet/);
  assert.doesNotMatch(html, /premium-blog-card/);
});
test('A single article retains featured placement; additional articles keep their links', async () => {
  const Single = loadPage('src/app/blogs/page.js', { '/blogs': [blog] });
  const one = renderToStaticMarkup(await Single());
  assert.match(one, /premium-blog-featured/); assert.doesNotMatch(one, /blogs-latest-title/);
  const More = loadPage('src/app/blogs/page.js', { '/blogs': [blog, { ...blog, _id: 'second-id', slug: 'second-guide', title: 'Second guide' }] });
  const two = renderToStaticMarkup(await More());
  assert.match(two, /Latest Articles/); assert.match(two, /href="\/blogs\/second-guide"/); assert.match(two, /Second guide/);
});
test('Article text, section anchors, safe text rendering and affiliate tracking remain intact', async () => {
  const product = { _id: 'product-id', name: 'Example Software', website: 'https://example.com', description: 'Original product description', affiliate: { enabled: true } };
  const Page = loadPage('src/app/blogs/[slug]/page.js', { '/blogs/sample-guide': { ...blog, relatedProducts: [product] } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: blog.slug }) }));
  assert.match(html, /First paragraph\.\n\nSecond paragraph\./);
  assert.match(html, /Original conclusion/); assert.match(html, /id="section-0"/); assert.match(html, /href="#section-0"/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/); assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /http:\/\/test\/api\/affiliate\/go\/product-id\?source=blog/);
  assert.match(html, /rel="noopener noreferrer sponsored"/);
});
