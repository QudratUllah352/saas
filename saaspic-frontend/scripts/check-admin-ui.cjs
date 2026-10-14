// Isolated component review using real category API data; no authentication bypass or writes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('next/dist/compiled/babel/core');
const bundle = require('next/dist/compiled/babel/bundle');
function loadComponent(file) {
  const source = fs.readFileSync(file, 'utf8');
  const result = babel.transformSync(source, {
    filename: file, configFile: false, babelrc: false,
    presets: [[bundle.presetReact().default, { runtime: 'automatic' }]],
    plugins: [bundle.pluginTransformModulesCommonjs().default],
  });
  const componentModule = { exports: {} };
  const componentRequire = (name) => {
    if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name === 'next/navigation') return { usePathname: () => '/admin/products', useRouter: () => ({}) };
    return require(name);
  };
  vm.runInNewContext(result.code, { require: componentRequire, module: componentModule, exports: componentModule.exports, console }, { filename: file });
  return componentModule.exports;
}
async function run() {
  const response = await fetch('http://localhost:5000/api/categories');
  assert(response.ok, 'Real category API must be available');
  const categories = await response.json();
  let confirmations = 0;
  for (const route of ['products', 'deals', 'reviews', 'comparisons', 'blogs', 'submissions']) {
    const source = fs.readFileSync(`src/app/admin/${route}/page.js`, 'utf8');
    const ast = babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { sourceType: 'module', plugins: ['jsx'] } });
    const candidates = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'FunctionDeclaration' && /^(handleDelete|deleteDeal|deleteBlog|rejectSubmission)$/.test(node.id?.name)) candidates.push(node);
      if (node.type === 'VariableDeclarator' && node.id?.name === 'handleDelete') candidates.push(node.init);
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(ast);
    assert.equal(candidates.length, 1, `Expected one confirmed destructive handler for ${route}`);
    const context = { window: { confirm: () => { confirmations++; return false; } }, fetch: () => { throw new Error('Canceled action must never call the API'); } };
    const handler = vm.runInNewContext('(' + source.slice(candidates[0].start, candidates[0].end) + ')', context);
    await handler(categories[0]);
  }
  assert.equal(confirmations, 6, 'All cancellation paths must show confirmation');
  const { default: Table, AdminStatus } = loadComponent('src/components/AdminRecordTable.jsx');
  const { default: Shell } = loadComponent('src/components/AdminShell.jsx');
  for (const status of ['Draft', 'Published', 'Pending', 'Approved', 'Rejected']) {
    const html = renderToStaticMarkup(React.createElement(AdminStatus, { status }));
    assert(html.includes(status.toLowerCase()) && html.includes(status));
  }
  const table = React.createElement(Table, { records: categories, label: 'Categories from the real API', columns: [{ label: 'Category', render: (item) => item.name }, { label: 'Slug', render: (item) => item.slug }] });
  const markup = renderToStaticMarkup(React.createElement(Shell, null, React.createElement('main', null, table)));
  assert.equal((markup.match(/<tr>/g) || []).length, categories.length + 1);
  assert(markup.includes('aria-current="page"'));
  assert(markup.includes('Products &amp; Categories'));
  assert(markup.includes('data-label="Category"'));
  const output = path.resolve('admin-design-review');
  fs.mkdirSync(output, { recursive: true });
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + fs.readFileSync('src/app/globals.css', 'utf8') + '\n' + fs.readFileSync('src/app/admin/admin-ui.css', 'utf8') + '</style></head><body>' + markup + '</body></html>';
  const file = path.join(output, 'components.html');
  fs.writeFileSync(file, html);
  const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket = new WebSocket(pages.find((item) => item.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map();
  socket.onmessage = (event) => { const message = JSON.parse(event.data); if (pending.has(message.id)) { pending.get(message.id)(message.result); pending.delete(message.id); } };
  const call = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })); });
  try {
    await call('Page.enable');
    await call('Page.navigate', { url: 'file:///' + file.replaceAll('\\', '/') });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const measurements = [];
    for (const width of [320, 375, 430, 768, 1024, 1440]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
      const result = await call('Runtime.evaluate', { expression: `({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,tableDisplay:getComputedStyle(document.querySelector('.admin-record-table')).display,sidebarVisibility:getComputedStyle(document.querySelector('.admin-sidebar')).visibility})`, returnByValue: true });
      const measurement = result.result.value;
      assert(measurement.scrollWidth <= measurement.width + 1, 'Overflow at ' + width);
      measurements.push(measurement);
      if (width === 375 || width === 1440) {
        const screenshot = await call('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(output, 'admin-components-' + width + '.png'), Buffer.from(screenshot.data, 'base64'));
      }
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(measurements, null, 2));
    console.log('Passed: six destructive-action cancellation paths (no API writes), table rows, status badges, sidebar labels, active navigation, mobile table labels, and six viewport overflow checks using real API categories.');
  } finally { socket.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
