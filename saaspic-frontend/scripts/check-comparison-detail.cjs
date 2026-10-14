// Read-only QA: real records, baseline behavior, and in-memory comparison fixtures.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const widths = [1440, 1024, 768, 390, 320];
const baseline = process.argv.includes('--baseline');
const output = path.resolve('design-review/comparison-detail', baseline ? 'before' : 'after');

async function renderFixture(comparison) {
  const vm = require('node:vm');
  const React = require('react');
  const {renderToStaticMarkup} = require('react-dom/server');
  const babel = require('next/dist/compiled/babel/core');
  const bundle = require('next/dist/compiled/babel/bundle');
  const cache = new Map();
  function load(file) {
    file=path.resolve(file);
    if(cache.has(file)) return cache.get(file);
    const componentModule={exports:{}};
    const transformed=babel.transformSync(fs.readFileSync(file,'utf8'),{
      filename:file,configFile:false,babelrc:false,
      presets:[[bundle.presetReact().default,{runtime:'automatic'}]],
      plugins:[bundle.pluginTransformModulesCommonjs().default],
    });
    const componentRequire=name=>{
      if(name.endsWith('.css'))return {};
      if(/components\/(Navbar|Footer)$/.test(name))return {default:()=>null,__esModule:true};
      if(name==='next/link')return {default:({children,...props})=>React.createElement('a',props,children),__esModule:true};
      if(name.startsWith('@/')||name.startsWith('.')){
        const base=name.startsWith('@/')?path.join('src',name.slice(2)):path.join(path.dirname(file),name);
        const resolved=[base,base+'.js',base+'.jsx'].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
        assert(resolved,'Module not found: '+name);return load(resolved);
      }
      return require(name);
    };
    const mockFetch=async url=>({ok:true,status:200,json:async()=>String(url).endsWith('/comparisons/'+comparison.slug)?comparison:[]});
    vm.runInNewContext(transformed.code,{require:componentRequire,module:componentModule,exports:componentModule.exports,process,console,fetch:mockFetch});
    cache.set(file,componentModule.exports);return componentModule.exports;
  }
  return renderToStaticMarkup(await load('src/app/comparisons/[slug]/page.js').default({params:Promise.resolve({slug:comparison.slug})}));
}

async function run() {
  fs.mkdirSync(output,{recursive:true});
  const records=await (await fetch('http://localhost:5000/api/comparisons')).json();
  assert(records.length,'Real comparisons required');
  const tabs=await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let sequence=0;
  const pending=new Map(),errors=[],report=[];
  socket.onmessage=event=>{
    const message=JSON.parse(event.data);
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
    const request=pending.get(message.id);
    if(!request)return;
    clearTimeout(request.timer);pending.delete(message.id);
    if(message.error)request.reject(new Error(message.error.message));else request.resolve(message.result);
  };
  const call=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Timeout: '+method));},30000);
    pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const normalize=text=>text.replace(/\s+/g,' ').trim();
  const checkWidths=async(label,screenshots)=>{
    for(const width of widths){
      await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
      await evaluate('scrollTo(0,0);new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
      const measurements=await evaluate(`(() => {
        const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
        const overflow=[...document.querySelectorAll('main *')].filter(el=>{if(el.closest('.comparison-table-wrapper')&&!el.matches('.comparison-table-wrapper'))return false;const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left < -1);}).map(el=>el.className);
        const products=[...document.querySelectorAll('.comparison-detail-product')].map(el=>({rect:rect(el),logo:rect(el.querySelector('.comparison-detail-logo')),button:el.querySelector('.affiliate-cta-button')?rect(el.querySelector('.affiliate-cta-button')):null}));
        const tables=[...document.querySelectorAll('.comparison-table-wrapper')].map(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,headers:[...el.querySelectorAll('thead th')].map(th=>({text:th.textContent.trim(),width:rect(th).width})),overflowX:getComputedStyle(el).overflowX}));
        return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow,products,tables};
      })()`);
      if(!baseline){
        assert(measurements.scrollWidth<=width+1&&!measurements.overflow.length,'Overflow: '+JSON.stringify(measurements));
        if(width>600&&measurements.products.length===2){
          assert(Math.abs(measurements.products[0].rect.width-measurements.products[1].rect.width)<1,'Unequal product widths');
          if(measurements.products.every(item=>item.button))assert(Math.abs(measurements.products[0].button.y-measurements.products[1].button.y)<1,'Misaligned product buttons');
        }
        assert(await evaluate(`[...document.querySelectorAll('.comparison-on-page a')].every(el=>!!document.querySelector(el.getAttribute('href')))`),'Broken TOC anchors');
        for(const table of measurements.tables){
          assert(Math.abs(table.headers[1].width-table.headers[2].width)<1,'Unequal table columns');
          if(table.scrollWidth>table.width){
            await evaluate(`document.querySelector('.comparison-table-wrapper').focus()`);
            await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
            await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
            await new Promise(resolve=>setTimeout(resolve,150));
            assert(await evaluate(`document.querySelector('.comparison-table-wrapper').scrollLeft>0`),'Table cannot scroll with keyboard');
            assert(await evaluate(`getComputedStyle(document.querySelector('.comparison-table tbody th')).position==='sticky'`),'Feature labels are not sticky');
            await evaluate(`document.querySelector('.comparison-table-wrapper').scrollLeft=0;document.activeElement.blur();scrollTo(0,0)`);
          }
        }
        const stress=await evaluate(`(() => {
          const nodes=[...document.querySelectorAll('main h1,main h2,main h3,main .affiliate-cta-button>span:first-child,main .comparison-table td')],original=nodes.map(el=>el.textContent);
          nodes.forEach(el=>el.textContent='VeryLongSoftwareNameWithoutSpaces'.repeat(5));
          const value=document.documentElement.scrollWidth;
          nodes.forEach((el,i)=>el.textContent=original[i]);return value;
        })()`);
        assert(stress<=width+1,'Long text causes page overflow');
      }
      if(screenshots){
        const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
        fs.writeFileSync(path.join(output,label+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
        const top=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        fs.writeFileSync(path.join(output,label+'-'+width+'-top.png'),Buffer.from(top.data,'base64'));
      }
      report.push({label,...measurements});
    }
  };
  try{
    await call('Page.enable');await call('Runtime.enable');
    for(const record of records){
      const comparison=await (await fetch('http://localhost:5000/api/comparisons/'+record.slug)).json();
      const route='/comparisons/'+comparison.slug;
      await call('Page.navigate',{url:'http://localhost:3000'+route});
      for(let attempt=0;attempt<120;attempt++){
        if(await evaluate(`location.pathname===${JSON.stringify(route)}&&document.readyState==='complete'&&!!document.querySelector('.comparison-detail-products')`))break;
        if(attempt===119)throw new Error('Page not ready: '+route);
        await new Promise(resolve=>setTimeout(resolve,250));
      }
      await evaluate('document.fonts.ready.then(()=>true)');
      const content=normalize(await evaluate(`document.querySelector('main').innerText`));
      for(const text of [comparison.title,comparison.excerpt,comparison.introduction,comparison.conclusion,comparison.productA.name,comparison.productB.name,
        ...(comparison.comparisonPoints||[]).flatMap(point=>[point.title,point.productA,point.productB]),
        ...['productABestFor','productBBestFor','productAStrengths','productBStrengths','productALimitations','productBLimitations'].flatMap(key=>comparison[key]||[])].filter(Boolean)){
        assert(content.includes(normalize(text)),'Missing data: '+text);
      }
      const behavior=await evaluate(`({title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,links:[...document.querySelectorAll('main a')].filter(el=>!el.getAttribute('href').startsWith('#')).map(el=>({href:el.getAttribute('href'),rel:el.rel,target:el.target})),buttons:[...document.querySelectorAll('main button')].map(el=>el.textContent)})`);
      if(!baseline){
        const rows=await evaluate(`[...document.querySelectorAll('.comparison-table tbody tr')].map(tr=>[...tr.children].map(el=>el.textContent.trim()))`);
        assert.deepEqual(rows,comparison.comparisonPoints.map(point=>[point.title,point.productA,point.productB]),'Table values associated with wrong product');
        assert.equal(await evaluate(`document.querySelectorAll('.comparison-verdict-card').length`),(comparison.productABestFor?.length?1:0)+(comparison.productBBestFor?.length?1:0));
      }
      await checkWidths(comparison.slug,record===records[0]);
      report.find(row=>row.label===comparison.slug&&row.width===1440).behavior=behavior;
      console.log('Reviewed '+comparison.title+' at five widths');
    }
    if(!baseline){
      const before=JSON.parse(fs.readFileSync(path.resolve('design-review/comparison-detail/before/report.json')));
      const normalizeBehavior=item=>({...item,links:[...item.links].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
      for(const row of report.filter(row=>row.behavior)){
        const prior=before.find(item=>item.label===row.label&&item.behavior);
        assert.deepEqual(normalizeBehavior(row.behavior),normalizeBehavior(prior.behavior),'SEO, links or sharing controls changed');
      }
      assert.equal(errors.length,0,'Browser errors: '+errors.join(', '));
      const live=await (await fetch('http://localhost:5000/api/comparisons/'+records[0].slug)).json();
      const full={...live,slug:'qa-full-comparison',title:'QA full comparison',
        productA:{...live.productA,pricingInfo:'QA monthly pricing information',affiliate:{enabled:true,disclosureText:'QA affiliate disclosure A'}},
        productB:{...live.productB,pricingInfo:'QA annual pricing information',affiliate:{enabled:true,disclosureText:'QA affiliate disclosure B'}},
        productABestFor:['QA audience A'],productBBestFor:['QA audience B'],productAStrengths:['QA strength A'],productBStrengths:['QA strength B'],
        productALimitations:['QA limitation A'],productBLimitations:['QA limitation B'],
      };
      const sparse={...live,slug:'qa-sparse-comparison',author:'',publishedAt:null,readTime:null,comparisonPoints:[],
        excerpt:'',introduction:'',conclusion:'',productABestFor:[],productBBestFor:[],productAStrengths:[],productBStrengths:[],productALimitations:[],productBLimitations:[],
        productA:{...live.productA,description:'',shortDescription:'',pricingInfo:'',category:null},
        productB:{...live.productB,description:'',shortDescription:'',pricingInfo:'',category:null},
      };
      const uneven={...full,slug:'qa-uneven-comparison',productA:{...full.productA,name:'VeryLongSoftwareProductNameWithoutSpaces'.repeat(3)},productBBestFor:[],productBStrengths:[],productBLimitations:[],comparisonPoints:[{title:'QA feature',productA:'',productB:'QA B value'}]};
      for(const fixture of [full,sparse,uneven]){
        const html=await renderFixture(fixture);
        await evaluate(`document.querySelector('main').outerHTML=${JSON.stringify(html)}`);
        if(fixture===sparse){
          assert.equal(await evaluate(`document.querySelectorAll('.comparison-detail-meta,.comparison-verdict-card,#quick-comparison,#deep-dives,#final-verdict,#overview,#pricing-comparison').length`),0,'Empty optional sections displayed');
        }else{
          const links=await evaluate(`[...document.querySelectorAll('main .affiliate-cta-button')].map(el=>el.getAttribute('href'))`);
          assert.equal(links.length,4);
          for(const product of [fixture.productA,fixture.productB])assert.equal(links.filter(link=>link==='http://localhost:5000/api/affiliate/go/'+product._id+'?source=comparison').length,2,'Affiliate source or product changed');
          assert(html.includes('QA affiliate disclosure A')&&html.includes('QA affiliate disclosure B'));
          assert(html.includes('QA monthly pricing information')&&html.includes('QA annual pricing information'));
        }
        await checkWidths(fixture.slug,true);
        console.log('Verified isolated fixture '+fixture.slug);
      }
    }
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log('Completed '+report.length+' viewport checks'+(baseline?' (baseline).':'; content, table associations, keyboard scrolling, links, SEO and fixtures passed.'));
  }finally{socket.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
