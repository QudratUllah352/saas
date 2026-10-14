// Read-only review of real public records. Chrome must expose CDP on port 9222.
const fs = require('node:fs');
const path = require('node:path');
const widths = [320, 375, 768, 1024, 1440];
const baseline = process.argv.includes('--baseline');
const baseUrl = process.env.CATALOG_BASE_URL || 'http://localhost:3000';
const output = path.resolve('design-review/catalog-layout', baseline ? 'before' : 'after');
async function run() {
  fs.mkdirSync(output, { recursive: true });
  const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
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
  try {
    await call('Page.enable');
    const records = await Promise.all(['deals', 'reviews', 'comparisons', 'categories'].map(async endpoint => {
      const response = await fetch('http://localhost:5000/api/' + endpoint);
      if (!response.ok) throw new Error('API unavailable: ' + endpoint);
      const data = await response.json(); if (!Array.isArray(data)) throw new Error('Invalid API response'); return data;
    }));
    const [deals, reviews, comparisons, categories] = records;
    if (!deals.length || !reviews.length || !comparisons.length) throw new Error('Real detail records required');
    const routes = ['/', '/deals', ...categories.map(category => '/deals?category=' + category.slug), '/deals?sort=discount&search=apify', '/deals?search=no-matching-software-xyz', '/reviews', '/comparisons', ...deals.map(deal => '/deals/' + deal._id), ...reviews.map(review => '/reviews/' + review.slug), ...comparisons.map(comparison => '/comparisons/' + comparison.slug)];
    const report = [], stressChecks = [], layoutFailures = [];
    for (const route of routes) {
      await call('Page.navigate', { url: baseUrl + route });
      for (let attempt = 0; attempt < 120; attempt++) {
        const ready = await evaluate(`location.pathname + location.search === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector('main h1') && document.querySelectorAll('main').length === 1 && document.querySelector('main').checkVisibility()`);
        if (ready) break;
        if (attempt === 119) throw new Error('Page not ready: ' + route);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      await evaluate('document.fonts.ready.then(() => true)');
      const behavior = await evaluate(`({title:document.title, links:[...document.querySelectorAll('main a')].map(el=>[el.getAttribute('href'),el.getAttribute('rel'),el.getAttribute('target')]), controls:[...document.querySelectorAll('main input,main button,main select')].map(el=>[el.name,el.type,el.value]), content:document.querySelector('main').innerText})`);
      for (const width of widths) {
        await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
        await new Promise(resolve => setTimeout(resolve, 100));
        await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
        const measurements = await evaluate(`(() => {
          const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
          const tableWrappers=[...document.querySelectorAll('.comparison-table-wrapper')];
          const overflow=[...document.querySelectorAll('main *, .deals-info-section *')].filter(el=>{
            const r=el.getBoundingClientRect(); const style=getComputedStyle(el);
            if(!r.width || style.position==='fixed')return false;
            if(el.closest('.comparison-table-wrapper'))return false;
            if(el.closest('.deals-premium-glow,.deals-submit-decoration,.saaspin-hero-glow'))return false;
            return r.right>innerWidth+1 || r.left < -1;
          }).map(el=>({tag:el.tagName,class:el.className})).slice(0,12);
          const grids=[...document.querySelectorAll('.deals-grid,.reviews-grid,.comparisons-grid,.rating-breakdown-grid,.comparison-detail-products')].map(el=>({class:el.className,columns:getComputedStyle(el).gridTemplateColumns,rect:rect(el)}));
          const cards=[...document.querySelectorAll('.deals-grid>article,.reviews-grid>article,.comparisons-grid>article')].map(el=>({rect:rect(el),button:rect(el.querySelector('a[class$="button"]'))}));
          const tables=tableWrappers.map(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,tableWidth:el.querySelector('table').getBoundingClientRect().width,overflowX:getComputedStyle(el).overflowX,headers:[...el.querySelectorAll('th')].map(th=>rect(th).width)}));
          const nav=document.querySelector('.navbar-toggle');
          const header=document.querySelector('.navbar');
          return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow,grids,cards,tables,navbar:rect(document.querySelector('.navbar-container')),footer:rect(document.querySelector('.premium-footer .home-container')),mobileToggleVisible:!!nav&&getComputedStyle(nav).display!=='none',toggleInsideHeader:!nav||getComputedStyle(nav).display==='none'||rect(nav).bottom<=rect(header).bottom+1};
        })()`);
        if (route === '/deals' && width < 768) {
          await evaluate(`document.querySelector('.navbar-toggle').click()`);
          await evaluate('new Promise(resolve => setTimeout(resolve, 150))');
          if (!await evaluate(`document.querySelector('.navbar-toggle').getAttribute('aria-expanded') === 'true' && !!document.querySelector('.navbar-mobile')`)) throw new Error('Mobile menu failed');
          await evaluate(`document.querySelector('.navbar-toggle').click()`);
        }
        report.push({ route, viewport: width, ...measurements, ...(width === 1440 ? { behavior } : {}) });
        if (!baseline && route !== '/' && !measurements.toggleInsideHeader) layoutFailures.push({route, width, issue:'Mobile toggle wraps outside header'});
        for (const card of measurements.cards) {
          const peers = measurements.cards.filter(other => Math.abs(other.rect.y - card.rect.y) < 1);
          if (peers.some(other => Math.abs(other.rect.height - card.rect.height) > 1 || Math.abs(other.button.bottom - card.button.bottom) > 1)) layoutFailures.push({route, width, issue:'Card heights or CTA alignment differ within a row'});
        }
        if (!baseline && measurements.tables.length && width < 768) {
          await evaluate(`document.querySelector('.comparison-table-wrapper').focus()`);
          await call('Input.dispatchKeyEvent', {type:'keyDown', key:'ArrowRight', code:'ArrowRight', windowsVirtualKeyCode:39});
          await call('Input.dispatchKeyEvent', {type:'keyUp', key:'ArrowRight', code:'ArrowRight', windowsVirtualKeyCode:39});
          await new Promise(resolve=>setTimeout(resolve,150));
          if (!await evaluate(`document.querySelector('.comparison-table-wrapper').scrollLeft > 0 && document.documentElement.scrollWidth <= innerWidth`)) layoutFailures.push({route, width, issue:'Comparison table cannot scroll locally with the keyboard'});
          await evaluate(`document.querySelector('.comparison-table-wrapper').scrollLeft=0;document.activeElement.blur()`);
        }
        if (['/', '/deals', '/reviews', '/comparisons'].includes(route) || route === '/deals/' + deals[0]._id || route === '/reviews/' + reviews[0].slug || route === '/comparisons/' + comparisons[0].slug) {
          const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
          fs.writeFileSync(path.join(output, route.replaceAll('/', '_').slice(1) + '-' + width + '.png'), Buffer.from(shot.data, 'base64'));
        }
        if (!baseline && route !== '/') {
          const stress = await evaluate(`(() => {
            const nodes=[...document.querySelectorAll('main h1,main h2,main h3,main .premium-deal-category,main .premium-review-category,main .premium-comparison-product>span,main .premium-deal-product-info p,main .premium-review-content p,main .affiliate-cta-button>span:first-child,main .comparison-table td')].filter(el=>!el.childElementCount);
            const original=nodes.map(el=>el.textContent);
            nodes.forEach(el=>el.textContent='VeryLongSoftwareProductNameWithoutSpaces'.repeat(6));
            const overflow=[...document.querySelectorAll('main *')].filter(el=>{
              if(el.closest('.comparison-table-wrapper,.deals-premium-glow,.deals-submit-decoration'))return false;
              const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left < -1);
            }).slice(0,10).map(el=>({tag:el.tagName,class:el.className}));
            const result={scrollWidth:document.documentElement.scrollWidth,width:innerWidth,overflow};
            nodes.forEach((el,index)=>el.textContent=original[index]);
            return result;
          })()`);
          stressChecks.push({route,viewport:width,...stress});
        }
      }
      console.log('Reviewed ' + route);
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(output, 'stress-report.json'), JSON.stringify(stressChecks, null, 2));
    const failures = report.filter(row => row.scrollWidth > row.width + 1 || row.overflow.length);
    const behaviorChanges = [];
    const priorFile = path.resolve('design-review/catalog-layout/before/report.json');
    if (!baseline && fs.existsSync(priorFile)) {
      const before = JSON.parse(fs.readFileSync(priorFile));
      for (const row of report) {
        const prior = before.find(item => item.route === row.route && item.viewport === row.viewport);
        if (!prior) continue;
        if (row.behavior && prior.behavior) {
          const normalize = item => ({...item, content:item.content.replace(/\s+/g,'')});
          if (JSON.stringify(normalize(prior.behavior)) !== JSON.stringify(normalize(row.behavior))) behaviorChanges.push({route:row.route, viewport:row.viewport, issue:'content or navigation changed'});
        }
      }
    }
    const stressFailures=stressChecks.filter(row=>row.scrollWidth>row.width+1||row.overflow.length);
    const summary={checks:report.length,stressChecks:stressChecks.length,overflow:failures.map(row=>({route:row.route,width:row.viewport,scrollWidth:row.scrollWidth,elements:row.overflow})),layoutFailures,stressFailures,behaviorChanges};
    fs.writeFileSync(path.join(output, 'summary.json'),JSON.stringify(summary,null,2));
    console.log(JSON.stringify(summary,null,2));
    if (!baseline && (failures.length || behaviorChanges.length || layoutFailures.length || stressFailures.length)) process.exitCode=1;
  } finally { socket.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
