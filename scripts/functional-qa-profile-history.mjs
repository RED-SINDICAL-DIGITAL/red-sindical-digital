// Isolated synthetic history regression check on anonymous Cloudflare Preview.
// Writes exclusively to a disposable Playwright browser context, never to remote APIs.
import {chromium} from 'playwright';
const origin='https://feat-beta-staging-profile-20.uadav-stream-staging.pages.dev';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  const page=await context.newPage();
  try{
   // A synthetic local-only history item, never retrieved or played.
   await page.addInitScript(()=>{
     localStorage.setItem('uadav_recent_v11',JSON.stringify([{
       title:'Historial de prueba local',provider:'audio',content_type:'podcast',
       url:'https://example.invalid/qa-never-played.mp3',saved_at:Date.now()
     }]));
   });
   await page.goto(origin+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded',timeout:30000});
   const read=async()=>page.evaluate(()=>{
     const doc=document.querySelector('#view')?.contentDocument||document;
     const home=doc.querySelector('#profileNativeHome');
     const recent=doc.querySelector('#profileNativeHome #recent');
     return {
       visible:!!home&&!home.hidden&&doc.defaultView.getComputedStyle(home).display!=='none',
       itemCount:recent?.querySelectorAll('[data-i]').length||0,
       title:recent?.textContent||'',
       stored:JSON.parse(localStorage.getItem('uadav_recent_v11')||'[]').length,
       route:new URLSearchParams(location.search).get('view')
     };
   });
   await page.waitForFunction(()=>{
     const d=document.querySelector('#view')?.contentDocument;
     return !!d?.querySelector('#profileNativeHome #recent [data-i]');
   },null,{timeout:12000});
   const initial=await read();
   if(!initial.visible||initial.itemCount!==1||initial.stored!==1)errors.push(viewport.name+': local recent missing on first render');
   const nav=viewport.name==='mobile'?'#mobile':'#top .nav';
   await page.locator(nav+' [data-route="/cartelera.html"]').click();
   await page.waitForFunction(()=>new URLSearchParams(location.search).get('view')==='/cartelera.html',{timeout:12000});
   await page.locator(viewport.name==='mobile'?'#mobile [data-route="/usuario.html"]':'#userBtn').click();
   await page.waitForFunction(()=>{
     const d=document.querySelector('#view')?.contentDocument;
     return new URLSearchParams(location.search).get('view')==='/usuario.html'&&!!d?.querySelector('#profileNativeHome #recent [data-i]');
   },null,{timeout:12000});
   const returned=await read();
   if(!returned.visible||returned.itemCount!==1||returned.stored!==1)errors.push(viewport.name+': local history lost after navigation');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!document.querySelector('#view')?.contentDocument?.querySelector('#profileNativeHome #recent [data-i]'),null,{timeout:12000});
   const reloaded=await read();
   if(!reloaded.visible||reloaded.itemCount!==1||reloaded.stored!==1)errors.push(viewport.name+': local history lost after reload');
   console.log(JSON.stringify({viewport:viewport.name,initial:{visible:initial.visible,count:initial.itemCount},returned:{visible:returned.visible,count:returned.itemCount},reloaded:{visible:reloaded.visible,count:reloaded.itemCount},result:'synthetic history retained'}));
  }catch(e){errors.push(viewport.name+': '+String(e.message).slice(0,160))}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(errors.length){console.error('PROFILE HISTORY QA FAILED',JSON.stringify(errors));process.exitCode=1}
else console.log('PASS: disposable browser local history survives tab navigation and reload; no remote writes');
