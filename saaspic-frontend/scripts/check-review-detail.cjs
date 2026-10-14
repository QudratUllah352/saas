// Read-only review QA against local records, plus browser rendering of isolated fixtures.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const widths = [1440, 1024, 768, 390, 320];
const baseline = process.argv.includes('--baseline');
const output = path.resolve('design-review/review-detail', baseline ? 'before' : 'after');

// Server-render the real page component with in-memory API responses only.
async function renderFixture(review) {
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
    const transformed = babel.transformSync(fs.readFileSync(file, 'utf8'), {
      filename: file, configFile: false, babelrc: false,
      presets: [[bundle.presetReact().default, {runtime:'automatic'}]],
      plugins: [bundle.pluginTransformModulesCommonjs().default],
    });
    const componentRequire = name => {
      if (name.endsWith('.css')) return {};
      if (/components\/(Navbar|Footer)$/.test(name)) return {default:()=>null,__esModule:true};
      if (name === 'next/link') return {default:({children,...props})=>React.createElement('a',props,children),__esModule:true};
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base=name.startsWith('@/')?path.join('src',name.slice(2)):path.join(path.dirname(file),name);
        const resolved=[base,base+'.js',base+'.jsx'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
        assert(resolved,'Module not found: '+name); return load(resolved);
      }
      return require(name);
    };
    const mockFetch = async url => ({ok:true,status:200,json:async()=>String(url).endsWith('/reviews/'+review.slug)?review:[]});
    vm.runInNewContext(transformed.code, {require:componentRequire,module:componentModule,exports:componentModule.exports,process,console,fetch:mockFetch});
    cache.set(file,componentModule.exports);return componentModule.exports;
  }
  const page=load('src/app/reviews/[slug]/page.js').default;
  return renderToStaticMarkup(await page({params:Promise.resolve({slug:review.slug})}));
}
async function run() {
  fs.mkdirSync(output, { recursive: true });
  const records = await (await fetch('http://localhost:5000/api/reviews')).json();
  assert(records.length, 'Real reviews required');
  const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map(), errors = [], report = [];
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
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const measure = () => evaluate(`(() => {
    const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    const overflow=[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left < -1);}).map(el=>el.className);
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow,main:rect(document.querySelector('.review-article')),sidebar:rect(document.querySelector('.review-sidebar')),hero:rect(document.querySelector('.review-detail-hero')),tocPosition:getComputedStyle(document.querySelector('.review-on-page')).position};
  })()`);
  try {
    await call('Page.enable'); await call('Runtime.enable');
    for (const record of records) {
      const review = await (await fetch('http://localhost:5000/api/reviews/' + record.slug)).json();
      const route = '/reviews/' + review.slug;
      await call('Page.navigate', { url: 'http://localhost:3000' + route });
      for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(`location.pathname===${JSON.stringify(route)} && document.readyState==='complete' && !!document.querySelector('.review-final-verdict')`)) break;
        if (attempt === 119) throw new Error('Page not ready: ' + route);
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      await evaluate('document.fonts.ready.then(()=>true)');
      const content = normalize(await evaluate(`document.querySelector('main').innerText`));
      const data = [review.title, review.excerpt, review.introduction, review.quickVerdict, review.overview, review.verdict,
        review.biggestLimitation, ...(review.topPros || []), ...(review.pros || []), ...(review.cons || []),
        ...(review.targetAudience || []), ...(review.features || []).flatMap(x=>[x.title,x.description]),
        ...(review.pricingPlans || []).flatMap(x=>[x.name,x.price,x.description,...(x.features||[])])].filter(Boolean);
      data.forEach(text=>assert(content.includes(normalize(text)), 'Missing content: ' + text));
      const behavior = await evaluate(`({title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,links:[...document.querySelectorAll('main a')].filter(el=>!el.getAttribute('href').startsWith('#')).map(el=>({href:el.getAttribute('href'),rel:el.rel,target:el.target})),buttons:[...document.querySelectorAll('main button')].map(el=>el.textContent)})`);
      if (!baseline) {
        const expected = review.product?.affiliate?.enabled
          ? 'http://localhost:5000/api/affiliate/go/' + review.product._id + '?source=review'
          : review.deal?.dealUrl || review.product?.website;
        const links = await evaluate(`Array.from(document.querySelectorAll('main .affiliate-cta-button'),el=>({href:el.getAttribute('href'),target:el.target,rel:el.rel}))`);
        links.forEach(link=>{assert.equal(link.href,expected);assert.equal(link.target,'_blank');assert(link.rel.includes('sponsored'));});
        assert.equal(await evaluate(`document.querySelectorAll('.review-pros').length`),review.pros?.length?1:0);
        assert.equal(await evaluate(`document.querySelectorAll('.review-cons').length`),review.cons?.length?1:0);
        assert(await evaluate(`[...document.querySelectorAll('.review-on-page a')].every(el=>!!document.querySelector(el.getAttribute('href')))`), 'TOC has broken anchors');
      }
      for (const width of widths) {
        await call('Emulation.setDeviceMetricsOverride', {width,height:1000,deviceScaleFactor:1,mobile:width<768});
        await evaluate('scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        const measurements = await measure();
        if (!baseline) {
          assert(measurements.scrollWidth<=width+1&&!measurements.overflow.length,'Overflow: '+JSON.stringify(measurements));
          if (width>900) assert(measurements.main.width/measurements.sidebar.width>2.2,'Desktop proportions');
          else assert.equal(measurements.tocPosition,'static','Mobile TOC must not stick');
          const stress = await evaluate(`(() => {
            const nodes=[...document.querySelectorAll('main h1,main h2,main h3,main .affiliate-cta-button>span:first-child')],original=nodes.map(el=>el.textContent);
            nodes.forEach(el=>el.textContent='VeryLongSoftwareNameWithoutSpaces'.repeat(5));
            const result=document.documentElement.scrollWidth;
            nodes.forEach((el,i)=>el.textContent=original[i]);return result;
          })()`);
          assert(stress<=width+1,'Long text overflow');
          await evaluate(`scrollTo(0,document.documentElement.scrollHeight);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
          assert(await evaluate(`document.querySelector('.review-on-page').getBoundingClientRect().bottom<=document.querySelector('footer').getBoundingClientRect().top`),'TOC overlaps footer');
          await evaluate('scrollTo(0,0)');
        }
        if (record===records[0]||record===records[1]) {
          const full = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
          fs.writeFileSync(path.join(output,review.slug+'-'+width+'.png'),Buffer.from(full.data,'base64'));
          const top = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
          fs.writeFileSync(path.join(output,review.slug+'-'+width+'-top.png'),Buffer.from(top.data,'base64'));
        }
        report.push({route,...measurements,...(width===1440?{behavior}:{})});
      }
      console.log('Reviewed '+review.title+' at five widths');
    }
    if (!baseline) {
      const before=JSON.parse(fs.readFileSync(path.resolve('design-review/review-detail/before/report.json')));
      const normalizeBehavior=item=>({...item,links:[...item.links].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
      for(const row of report.filter(row=>row.behavior)) {
        const prior=before.find(item=>item.route===row.route&&item.behavior);
        assert.deepEqual(normalizeBehavior(row.behavior),normalizeBehavior(prior.behavior),'SEO, links, or share controls changed');
      }
      assert.equal(errors.length,0,'Browser errors: '+errors.join(', '));
      const live = await (await fetch('http://localhost:5000/api/reviews/'+records[0].slug)).json();
      const complete = {
        ...live, slug:'qa-complete-review', title:'QA complete review',
        product:{...live.product,affiliate:{enabled:true,disclosureText:'QA affiliate disclosure'}},
        pricingPlans:[
          {name:'QA Starter',price:'$19',billing:'Monthly',description:'QA entry plan',features:['QA feature one','QA feature two']},
          {name:'QA Team',price:'$49',billing:'Monthly',description:'QA team plan',features:['QA collaboration']},
          {name:'QA Custom',price:'Contact provider',description:'QA custom plan',features:[]},
        ],
        alternatives:[{_id:'qa-alternative',name:'QA alternative',description:'QA alternative description',category:{name:'Development'}}],
        cons:['QA limitation'],ratingBreakdown:{features:4,easeOfUse:3.5,valueForMoney:0,support:5},
      };
      const sparse = {...live,slug:'qa-sparse-review',title:'QA sparse review',deal:null,overallRating:null,ratingBreakdown:{},
        author:'',publishedAt:null,readTime:null,features:[],pricingPlans:[],pros:[],cons:[],alternatives:[],topPros:[],biggestLimitation:'',
      };
      const fixtures = [complete,sparse,{...sparse,slug:'qa-zero-rating',overallRating:0},
        {...complete,slug:'qa-upcoming-offer',deal:{...complete.deal,startDate:'2999-01-01T00:00:00Z',endDate:null}},
        {...complete,slug:'qa-expired-offer',deal:{...complete.deal,endDate:'2000-01-01T00:00:00Z'}}];
      for (const fixture of fixtures) {
        const html = await renderFixture(fixture);
        await evaluate(`document.querySelector('main').outerHTML=${JSON.stringify(html)}`);
        assert.equal(await evaluate(`document.querySelectorAll('.review-pricing-card').length`),fixture.pricingPlans.length);
        assert.equal(await evaluate(`document.querySelectorAll('.alternative-card').length`),fixture.alternatives.length);
        const hasRating=typeof fixture.overallRating==='number';
        assert.equal(await evaluate(`document.querySelectorAll('.review-main-score').length`),hasRating?1:0);
        assert.equal(await evaluate(`document.querySelectorAll('.review-author-meta').length`),fixture.author||fixture.publishedAt||fixture.readTime?1:0);
        const links = await evaluate(`[...document.querySelectorAll('main .affiliate-cta-button')].map(el=>el.getAttribute('href'))`);
        if (fixture.slug==='qa-complete-review') {
          assert.equal(links.length,3);links.forEach(href=>assert.equal(href,'http://localhost:5000/api/affiliate/go/'+fixture.product._id+'?source=review'));
          assert(html.includes('QA affiliate disclosure'));
        } else if (fixture.slug==='qa-upcoming-offer'||fixture.slug==='qa-expired-offer') assert.equal(links.length,0,'Scheduled offer exposes a purchase link');
        else { assert.equal(links.length,1);assert.equal(links[0],fixture.product.website); }
        if(fixture===sparse) {
          assert.equal(await evaluate(`document.querySelectorAll('.review-rating-summary,.review-pros,.review-cons,#features,#pricing').length`),0,'Empty optional sections remain');
        }
        for (const width of widths) {
          await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
          await evaluate('scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
          const measurements=await measure();
          assert(measurements.scrollWidth<=width+1&&!measurements.overflow.length,'Fixture overflow: '+JSON.stringify(measurements));
          assert(await evaluate(`[...document.querySelectorAll('.review-on-page a')].every(el=>!!document.querySelector(el.getAttribute('href')))`),'Fixture has broken anchors');
          report.push({fixture:fixture.slug,...measurements});
          if(fixture===complete||fixture===sparse) {
            const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
            fs.writeFileSync(path.join(output,fixture.slug+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
          }
        }
        console.log('Verified isolated fixture '+fixture.slug);
      }
    }
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log('Completed '+report.length+' responsive checks'+(baseline?' (baseline).':'; content, links, SEO, anchors and footer clearance passed.'));
  } finally { socket.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
