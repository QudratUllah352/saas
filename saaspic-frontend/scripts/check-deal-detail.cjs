// Read-only browser QA using real API records. Requires local servers and Chrome CDP.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const widths = [1440, 1024, 768, 390, 320];
async function run() {
  const output = path.resolve('design-review/deal-detail');
  fs.mkdirSync(output, { recursive: true });
  const response = await fetch('http://localhost:5000/api/deals');
  assert(response.ok, 'Local API must be available');
  const deals = await response.json();
  assert(deals.length, 'Real deals required');
  const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Timeout: ' + method)); }, 30000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const report = [];
  try {
    await call('Page.enable'); await call('Runtime.enable');
    for (const record of deals) {
      const detailResponse = await fetch('http://localhost:5000/api/deals/' + record._id);
      const deal = await detailResponse.json();
      const route = '/deals/' + deal._id;
      await call('Page.navigate', { url: 'http://localhost:3000' + route });
      for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector('.deal-summary-card')`)) break;
        if (attempt === 119) throw new Error('Page not ready: ' + route);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      await evaluate('document.fonts.ready.then(() => true)');
      const normalize = text => text.replace(/\s+/g, ' ').trim();
      const content = normalize(await evaluate(`document.querySelector('main').innerText`));
      for (const text of [deal.product.name, deal.discount, deal.product.description, deal.product.pricingInfo,
        ...(deal.product.features || []), ...(deal.product.strengths || []), ...(deal.product.limitations || []),
        ...(deal.product.targetAudience || []), ...(deal.product.integrations || [])].filter(Boolean)) {
        assert(content.includes(normalize(text)), 'Missing dynamic content: ' + text);
      }
      const buttons = await evaluate(`Array.from(document.querySelectorAll('main .affiliate-cta-button'), el => ({href:el.getAttribute('href'),target:el.target,rel:el.rel}))`);
      if (buttons.length) {
        const expected = deal.product.affiliate?.enabled
          ? 'http://localhost:5000/api/affiliate/go/' + deal.product._id + '?source=deal'
          : deal.dealUrl || deal.product.website;
        assert.equal(buttons.length, 3, 'All three working offer buttons preserved');
        for (const button of buttons) {
          assert.equal(button.href, expected); assert.equal(button.target, '_blank'); assert(button.rel.includes('sponsored'));
        }
      }
      assert.equal(await evaluate(`document.querySelectorAll('.product-cons-card').length`), deal.product.limitations?.length ? 1 : 0);
      assert.equal(await evaluate(`document.querySelectorAll('.product-pros-card').length`), deal.product.strengths?.length ? 1 : 0);
      for (const width of widths) {
        await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
        await evaluate('scrollTo(0,0); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
        const measurements = await evaluate(`(() => {
          const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
          const overflow=[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left < -1);}).map(el=>el.className);
          const main=document.querySelector('.deal-detail-main'), sidebar=document.querySelector('.deal-summary-card');
          return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow,container:rect(document.querySelector('.deal-detail-container')),main:rect(main),sidebar:rect(sidebar),columns:getComputedStyle(document.querySelector('.deal-detail-layout')).gridTemplateColumns,sidebarPosition:getComputedStyle(sidebar).position};
        })()`);
        assert(measurements.scrollWidth <= width + 1 && !measurements.overflow.length, 'Overflow: ' + JSON.stringify(measurements));
        if (width > 900) assert(measurements.main.width > measurements.sidebar.width * 1.9, 'Desktop proportions');
        else assert.equal(measurements.sidebarPosition, 'static', 'Mobile sidebar must not stick');
        const stress = await evaluate(`(() => {
          const nodes=[...document.querySelectorAll('main h1, main h2, main h3, main .affiliate-cta-button > span:first-child')];
          const original=nodes.map(el=>el.textContent);
          nodes.forEach(el=>el.textContent='VeryLongSoftwareNameWithoutSpaces'.repeat(5));
          const result={width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
          nodes.forEach((el,i)=>el.textContent=original[i]);return result;
        })()`);
        assert(stress.scrollWidth <= width + 1, 'Long text overflow');
        await evaluate(`document.querySelector('.deal-faq-item summary').click()`);
        assert(await evaluate(`document.querySelector('.deal-faq-item').open`), 'FAQ opens');
        await evaluate(`document.querySelector('.deal-faq-item summary').click()`);
        await evaluate(`scrollTo(0,document.documentElement.scrollHeight); new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
        const footerClearance = await evaluate(`document.querySelector('.deal-summary-card').getBoundingClientRect().bottom <= document.querySelector('footer').getBoundingClientRect().top`);
        assert(footerClearance, 'Sticky sidebar overlaps footer');
        await evaluate('scrollTo(0,0)');
        if (record === deals[0]) {
          const shot = await call('Page.captureScreenshot', {format:'png',captureBeyondViewport:true});
          fs.writeFileSync(path.join(output, width + '.png'), Buffer.from(shot.data,'base64'));
        }
        report.push({ route, ...measurements, stress, footerClearance, buttons });
      }
      console.log('Verified ' + deal.product.name + ' at all five widths');
    }
    assert.equal(errors.length, 0, 'Browser errors: ' + errors.join(', '));
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report,null,2));
    console.log('Passed ' + report.length + ' responsive checks; dynamic content, FAQ, offer URLs, and footer clearance verified.');
  } finally { socket.close(); }
}
run().catch(error => { console.error(error); process.exitCode=1; });
