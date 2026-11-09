// Anonymous, read-only browser QA of public beta. Never submits forms or writes to APIs.
import { chromium } from 'playwright';
const base='https://feat-beta-staging-profile-20.uadav-stream-staging.pages.dev';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
const checks=[];
try {
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  try{
   const res=await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#view')?.contentDocument?.getElementById('profileNativeHome'),{timeout:15000});
   const route=()=>page.evaluate(()=>({url:location.pathname+location.search,frame:document.querySelector('#view')?.contentWindow?.location.pathname||null,active:[...document.querySelectorAll('#mobile button.active,#top .nav button.active')].map(x=>x.dataset.route)}));
   const first=await route();checks.push({viewport:viewport.name,step:'start-profile',...first,status:res?.status()});
   if(first.frame!=='/usuario'&&first.frame!=='/usuario.html')failures.push(viewport.name+': profile iframe missing');
   const selector=viewport.name==='mobile'?'#mobile':'#top .nav';
   for(const [label,destination] of [['Cartelera','/cartelera.html'],['Trabajo',viewport.name==='mobile'?'/bolsa-trabajo.html':'/trabajo.html'],['Explorar','/descubrir.html'],['En vivo','/en-vivo.html']]){
    await page.locator(selector+' [data-route="'+destination+'"]').click();
    await page.waitForTimeout(600);
    const state=await route();checks.push({viewport:viewport.name,step:label,...state});
    const normalize=p=>p?.endsWith('.html')?p.slice(0,-5):p;
    const queryView=new URLSearchParams(state.url.split('?')[1]||'').get('view');
    if(normalize(queryView)!==normalize(destination))failures.push(viewport.name+': '+label+' URL not synchronized');
    if(normalize(state.frame)!==normalize(destination))failures.push(viewport.name+': '+label+' iframe missing');
    if(!state.active.includes(destination))failures.push(viewport.name+': '+label+' tab is not highlighted');
   }
   await page.locator(viewport.name==='mobile'?'#mobile [data-route="/usuario.html"]':'#userBtn').click();
   await page.waitForTimeout(450);
   const returned=await route();checks.push({viewport:viewport.name,step:'return-profile',...returned});
   if(!returned.url.includes('usuario.html'))failures.push(viewport.name+': profile return not working');
   await page.goBack({waitUntil:'domcontentloaded'}).catch(()=>{});
   await page.waitForTimeout(550);
   const back=await route();checks.push({viewport:viewport.name,step:'browser-back',...back});
   if(!back.url.includes('en-vivo'))failures.push(viewport.name+': browser history not restored');
   await page.goForward({waitUntil:'domcontentloaded'}).catch(()=>{});
   await page.waitForTimeout(550);
   const forward=await route();checks.push({viewport:viewport.name,step:'browser-forward',...forward});
   if(!forward.url.includes('usuario.html'))failures.push(viewport.name+': forward history not restored');
  }catch(error){failures.push(viewport.name+': '+String(error.message).slice(0,180))}
  finally{await page.close()}
 }
 for(const [name,path] of [['evento','/publicar-evento.html'],['trabajo','/bolsa-trabajo.html']]){
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'es-AR'});
  try{
   const res=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
   const state=await page.evaluate(()=>({url:location.pathname,title:document.title,formCount:document.querySelectorAll('form').length,fields:document.querySelectorAll('input,select,textarea').length,overflow:document.documentElement.scrollWidth>innerWidth+3}));
   checks.push({step:'public-page-'+name,status:res?.status(),...state});
   if(res?.status()!==200||state.overflow)failures.push(name+': page not available or overflows mobile viewport');
  }catch(error){failures.push(name+': '+String(error.message).slice(0,180))}
  finally{await page.close()}
 }
}finally{await browser.close()}
checks.forEach(x=>console.log(JSON.stringify(x)));
if(failures.length){console.error('FUNCTIONAL QA FAILED',JSON.stringify(failures));process.exitCode=1}
else console.log('PASS: public beta shell navigation, history and public form access');
