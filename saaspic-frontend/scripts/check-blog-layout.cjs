// Read-only browser checks against real public Blog records; no database writes.
const fs = require('node:fs');
const path = require('node:path');
const widths = [320, 375, 768, 1024, 1440];
const baseline = process.argv.includes('--baseline');
const baseUrl = process.env.BLOG_BASE_URL || 'http://localhost:3001';
const output = path.resolve('design-review/blog-layout', baseline ? 'before' : 'after');
async function run() {
  fs.mkdirSync(output, { recursive: true });
  const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data), request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(new Error('Timeout: ' + method)); }, 30000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  try {
    await call('Page.enable');
    const [blogs, deals, reviews, comparisons] = await Promise.all(['blogs','deals','reviews','comparisons'].map(async endpoint => {
      const response = await fetch('http://localhost:5000/api/' + endpoint);
      const data = await response.json(); if (!response.ok || !Array.isArray(data) || !data.length) throw new Error('Real records required: ' + endpoint); return data;
    }));
    const blogRoutes = ['/blogs', ...blogs.map(blog=>'/blogs/'+blog.slug), '/blogs/layout-check-unavailable-article'];
    const guardRoutes = ['/', '/deals', '/reviews', '/comparisons', '/deals/'+deals[0]._id, '/reviews/'+reviews[0].slug, '/comparisons/'+comparisons[0].slug];
    const report=[], failures=[], stressChecks=[];
    for (const route of [...blogRoutes,...guardRoutes]) {
      await call('Page.navigate', {url:baseUrl+route});
      for (let attempt=0;attempt<120;attempt++) {
        if (await evaluate(`location.pathname===${JSON.stringify(route)}&&document.readyState==='complete'&&document.querySelectorAll('main').length===1&&document.querySelector('main').checkVisibility()&&!!document.querySelector('main h1')`)) break;
        if(attempt===119)throw new Error('Page not ready: '+route);
        await new Promise(resolve=>setTimeout(resolve,250));
      }
      await evaluate('document.fonts.ready.then(()=>true)');
      const behavior=await evaluate(`({title:document.title,seo:[...document.querySelectorAll('head meta,head link[rel="canonical"]')].map(el=>el.outerHTML),content:document.querySelector('main').textContent.replace(/\\s+/g,''),links:[...document.querySelectorAll('main a')].map(el=>[el.getAttribute('href'),el.getAttribute('rel'),el.getAttribute('target')]),article:document.querySelector('.blog-article')?.textContent.replace(/\\s+/g,'')})`);
      for(const width of widths) {
        await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
        await new Promise(resolve=>setTimeout(resolve,100));
        await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        const data=await evaluate(`(()=>{
          const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
          const overflow=[...document.querySelectorAll('main *')].filter(el=>{if(el.closest('.saaspin-hero-glow,.deals-premium-glow,.deals-submit-decoration,.comparison-table-wrapper'))return false;const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left < -1)}).slice(0,12).map(el=>({tag:el.tagName,class:el.className}));
          const article=document.querySelector('.blog-article');
          const grid=document.querySelector('.public-blog-grid');
          const cards=[...document.querySelectorAll('.public-blog-grid>.premium-blog-card')].map(el=>({rect:rect(el),image:rect(el.querySelector('.premium-blog-image')),button:rect(el.querySelector('.premium-blog-read')),title:rect(el.querySelector('.premium-blog-title')),excerpt:rect(el.querySelector('.premium-blog-excerpt'))}));
          const nav=document.querySelector('.navbar-toggle');
          const guard=[...document.querySelectorAll('main h1,main .home-container,main .deals-container,main .reviews-container,main .comparisons-container,main .deal-detail-container,main .review-detail-container,main .comparison-detail-container')].map(el=>({class:el.className,rect:rect(el),font:getComputedStyle(el).fontSize}));
          return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow,cards,columns:grid?getComputedStyle(grid).gridTemplateColumns:null,articleWidth:article?article.clientWidth-parseFloat(getComputedStyle(article).paddingLeft)-parseFloat(getComputedStyle(article).paddingRight):null,toggleInsideHeader:getComputedStyle(nav).display==='none'||rect(nav).bottom<=rect(document.querySelector('.navbar')).bottom+1,guard};
        })()`);
        report.push({route,viewport:width,...data,...(width===1440?{behavior}:{})});
        if(data.scrollWidth>data.width+1||data.overflow.length)failures.push({route,width,issue:'Page overflow',overflow:data.overflow});
        if(!baseline&&blogRoutes.includes(route)&&!data.toggleInsideHeader)failures.push({route,width,issue:'Mobile menu outside header'});
        if(!baseline&&data.articleWidth>800)failures.push({route,width,issue:'Article reading width exceeds 800px'});
        for(const card of data.cards){const peers=data.cards.filter(other=>Math.abs(other.rect.y-card.rect.y)<1);if(peers.some(other=>Math.abs(other.rect.height-card.rect.height)>1||Math.abs(other.button.bottom-card.button.bottom)>1||Math.abs(other.image.height-card.image.height)>1))failures.push({route,width,issue:'Blog cards or buttons are misaligned'});}
        if(!baseline&&data.cards.some(card=>card.title.bottom>card.excerpt.y+1))failures.push({route,width,issue:'Card title overlaps excerpt'});
        if(route==='/blogs'&&width<768){await evaluate(`document.querySelector('.navbar-toggle').click()`);await new Promise(resolve=>setTimeout(resolve,150));if(!await evaluate(`document.querySelector('.navbar-toggle').getAttribute('aria-expanded')==='true'&&!!document.querySelector('.navbar-mobile[role="dialog"]')`))throw new Error('Mobile navigation failed');await evaluate(`document.querySelector('.navbar-toggle').click()`);}
        if(route==='/blogs'||route==='/blogs/'+blogs[0].slug){const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(output,route.replaceAll('/','_').slice(1)+'-'+width+'.png'),Buffer.from(shot.data,'base64'));}
        if(!baseline&&blogRoutes.includes(route)&&!route.includes('unavailable')){
          const stress=await evaluate(`(async()=>{
            const nodes=[...document.querySelectorAll('main h1,main h2,main h3,.premium-blog-meta>span:not(.premium-blog-meta-dot),.premium-blog-category,.blog-detail-tags span,.blog-on-page-links a,.blog-article-section p,.affiliate-cta-button>span:first-child')].filter(el=>!el.childElementCount);
            const originals=nodes.map(el=>el.textContent);nodes.forEach(el=>el.textContent='LongArticleTitleOrURLWithoutSpaces'.repeat(8));
            const article=document.querySelector('.blog-article');let table=null,cover=null,image=null;
            if(article){table=document.createElement('table');table.tabIndex=0;table.innerHTML='<caption>Responsive table fixture</caption><thead><tr><th>Feature</th><th>First product</th><th>Second product</th><th>Third product</th></tr></thead><tbody><tr><td>'+('Wide comparison data '.repeat(8))+'</td><td>'+('Additional details '.repeat(8))+'</td><td>Third column</td><td>Fourth column</td></tr></tbody>';article.append(table);}
            if(article){
              const source='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#e6f7fa"/></svg>');
              image=document.createElement('img');image.src=source;image.width=1600;image.height=900;image.alt='Responsive article image fixture';article.append(image);
              cover=document.createElement('div');cover.className='blog-detail-cover';const coverImage=image.cloneNode();cover.append(coverImage);document.querySelector('main').insertBefore(cover,document.querySelector('.blog-detail-hero').nextSibling);
              await Promise.all([image.decode(),coverImage.decode()]);table.scrollLeft=200;
            }
            const overflow=[...document.querySelectorAll('main *')].filter(el=>{if(el.closest('table'))return false;const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left < -1)}).slice(0,12).map(el=>({tag:el.tagName,class:el.className}));
            const result={width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow,table:table?{width:table.clientWidth,scrollWidth:table.scrollWidth,scrollLeft:table.scrollLeft,overflowX:getComputedStyle(table).overflowX}:null,image: image?{width:image.getBoundingClientRect().width,articleWidth:article.clientWidth,coverHeight:cover.getBoundingClientRect().height}:null};
            table?.remove();image?.remove();cover?.remove();nodes.forEach((el,index)=>el.textContent=originals[index]);return result;
          })()`);stressChecks.push({route,viewport:width,...stress});
        }
      }
      console.log('Reviewed '+route);
    }
    const priorFile=path.resolve('design-review/blog-layout/before/report.json');
    if(!baseline&&fs.existsSync(priorFile)){
      const before=JSON.parse(fs.readFileSync(priorFile));
      for(const row of report){const prior=before.find(item=>item.route===row.route&&item.viewport===row.viewport);if(!prior)continue;
        if(row.behavior){const old=prior.behavior,newBehavior=row.behavior;if(JSON.stringify(old.seo)!==JSON.stringify(newBehavior.seo)||JSON.stringify(old.links)!==JSON.stringify(newBehavior.links)||old.article!==newBehavior.article)failures.push({route:row.route,issue:'Article, metadata or links changed'});}
        if(guardRoutes.includes(row.route)&&JSON.stringify(prior.guard)!==JSON.stringify(row.guard))failures.push({route:row.route,width:row.viewport,issue:'Unrelated page geometry changed'});
      }
    }
    const stressFailures=stressChecks.filter(row=>row.scrollWidth>row.width+1||row.overflow.length||row.table&&(row.table.overflowX!=='auto'||row.table.scrollWidth>row.table.width&&row.table.scrollLeft===0)||row.image&&(row.image.width>row.image.articleWidth||row.image.coverHeight>481));
    const summary={checks:report.length,blogChecks:report.filter(row=>blogRoutes.includes(row.route)).length,guardChecks:report.filter(row=>guardRoutes.includes(row.route)).length,stressChecks:stressChecks.length,failures,stressFailures};
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(output,'stress-report.json'),JSON.stringify(stressChecks,null,2));fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2));
    console.log(JSON.stringify(summary,null,2));if(!baseline&&(failures.length||stressFailures.length))process.exitCode=1;
  }finally{socket.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
