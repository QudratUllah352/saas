// Read-only browser review against the existing local frontend and real API.
const fs = require('node:fs');
const path = require('node:path');
const widths = [320, 375, 430, 768, 1024, 1440];
const output = path.resolve('design-review');
async function run() {
  fs.mkdirSync(output, { recursive: true });
  const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
  const tab = pages.find((page) => page.type === 'page');
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer); pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  };
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('Timed out: ' + method)); }, 30000);
      pending.set(requestId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  try {
    await call('Page.enable');
    const routes = ['/deals', '/reviews', '/comparisons', '/blogs', '/search', '/submit-deal', '/affiliate-disclosure'];
    const unavailable = [];
    for (const [endpoint, field] of [['deals', '_id'], ['reviews', 'slug'], ['comparisons', 'slug'], ['blogs', 'slug']]) {
      const response = await fetch('http://localhost:5000/api/' + endpoint);
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.[field]) routes.push('/' + endpoint + '/' + data[0][field]);
      else unavailable.push(endpoint + ' details: no real API records available');
    }
    const report = [];
    const navigationChecks = [];
    for (const route of routes) {
      await call('Page.navigate', { url: 'http://localhost:3000' + route });
      for (let retry = 0; retry < 100; retry++) {
        const ready = await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector('.public-page')`);
        if (ready) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (retry === 99) throw new Error('Page not ready: ' + route);
      }
      await evaluate('document.fonts.ready.then(() => true)');
      for (const width of widths) {
        await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
        await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
        const measurement = await evaluate(`({title:document.title, width:innerWidth, scrollWidth:document.documentElement.scrollWidth, h1:document.querySelector('h1')?.textContent.trim(), overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0 && (r.right>innerWidth+1 || r.left < -1) && getComputedStyle(el).position!=='fixed' && !el.closest('nextjs-portal')}).slice(0,12).map(el=>({tag:el.tagName,class:el.className}))})`);
        report.push({ route, viewport: width, ...measurement });
        if (route === '/deals' && width < 768) {
          const menu = await evaluate(`(() => { const button=document.querySelector('.navbar-toggle'); const bars=[...button.querySelectorAll('span')].map(span=>span.getBoundingClientRect().height); button.click(); return {bars}; })()`);
          await evaluate('new Promise(resolve => setTimeout(resolve, 250))');
          const opened = await evaluate(`!!document.querySelector('.navbar-mobile[role="dialog"]') && document.querySelector('.navbar-toggle').getAttribute('aria-expanded') === 'true'`);
          if (!opened || menu.bars.some((height) => height < 1)) throw new Error('Mobile navigation failed at ' + width);
          await evaluate(`document.querySelector('.navbar-toggle').click()`);
          navigationChecks.push({ width, mobileMenu: 'passed' });
        }
        if (width === 375 || width === 1440) {
          const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
          fs.writeFileSync(path.join(output, route.replaceAll('/', '_').slice(1) + '-' + width + '.png'), Buffer.from(screenshot.data, 'base64'));
        }
      }
      console.log('Reviewed ' + route + ' at all six widths.');
    }
    fs.writeFileSync(path.join(output, 'responsive-report.json'), JSON.stringify({ report, navigationChecks, unavailable }, null, 2));
    const failures = report.filter((item) => item.scrollWidth > item.width + 1);
    console.log(JSON.stringify({ checks: report.length, horizontalOverflow: failures, unavailable }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally { socket.close(); }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
