// Offline browser QA: preserve shell navigation and player nodes; no live API or credentials.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const normalize=p=>String(p||'').split('?')[0].replace(/\\.html$/,'');
try{
 for(const device of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},locale:'es-AR'});
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  try{
   await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('view')?.contentDocument?.getElementById('profileNativeHome'),null,{timeout:15000});
   await page.evaluate(()=>window.__qaNodes={frame:document.getElementById('view'),dock:document.getElementById('mediaDock'),audio:document.getElementById('radioAudio')});
   const nav=device.name==='mobile'?'#mobile':'#top .nav';
   for(const route of ['/cartelera.html','/en-vivo.html','/index-v117.html']){
    await page.locator(nav+' [data-route="'+route+'"]').click();
    await page.waitForFunction(expected=>{const q=new URLSearchParams(location.search).get('view');return q===expected},route,{timeout:10000});
    await page.waitForFunction(expected=>{const frame=document.getElementById('view');return frame?.contentWindow?.location.pathname===expected},route,{timeout:10000});
    const st=await page.evaluate(()=>({dock:window.__qaNodes.dock===document.getElementById('mediaDock'),audio:window.__qaNodes.audio===document.getElementById('radioAudio'),frame:window.__qaNodes.frame===document.getElementById('view'),overflow:document.documentElement.scrollWidth>innerWidth+3}));
    console.log(JSON.stringify({device:device.name,route,...st}));
    if(!st.dock||!st.audio||!st.frame||st.overflow)errors.push(device.name+' shell/player node continuity at '+route);
   }
   await page.locator(device.name==='mobile'?'#mobile [data-route="/usuario.html"]':'#userBtn').click();
   await page.waitForFunction(()=>new URLSearchParams(location.search).get('view')==='/usuario.html',null,{timeout:10000});
   await page.goBack({waitUntil:'domcontentloaded'});
   const back=await page.evaluate(()=>new URLSearchParams(location.search).get('view'));
   if(normalize(back)!==normalize('/index-v117.html'))errors.push(device.name+' browser back not restored: '+back);
  }catch(e){errors.push(device.name+': '+String(e.message).slice(0,200));}
  finally{await page.close();}
 }
}finally{await browser.close();}
if(errors.length){console.error('FAIL',JSON.stringify(errors));process.exitCode=1}
else console.log('PASS: offline shell navigation, history and persistent player DOM on mobile + desktop');
