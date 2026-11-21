// Anonymous Admin gate QA. Local files only; no real login, API, secrets or writes.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const viewport of [{name:'mobile-390',width:390,height:844},{name:'desktop-1365',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage();
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging';sessionStorage.clear();});
  try{
   const response=await page.goto(base+'/admin.html',{waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('#loginGate').waitFor({state:'visible',timeout:10000});
   const state=await page.evaluate(()=>{
    const gate=document.getElementById('loginGate');
    const app=document.getElementById('app');
    return {
     gateVisible:!!gate&&getComputedStyle(gate).display!=='none',
     appHidden:!!app&&(app.classList.contains('hidden')||getComputedStyle(app).display==='none'),
     keyField:document.getElementById('loginKey')?.type==='password',
     overflow:document.documentElement.scrollWidth>innerWidth+3,
     adminKeyPresent:!!sessionStorage.getItem('uadav_admin_v8')
    };
   });
   console.log(JSON.stringify({viewport:viewport.name,http:response?.status(),...state}));
   if(response?.status()!==200||!state.gateVisible||!state.appHidden||!state.keyField||state.overflow||state.adminKeyPresent)errors.push(viewport.name+': Admin anonymous guard/layout failed');
  }catch(error){errors.push(viewport.name+': '+String(error?.message||error).slice(0,200));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(errors.length){console.error('FAIL: anonymous Admin QA',JSON.stringify(errors));process.exitCode=1;}
else console.log('PASS: anonymous Admin login gate remains visible, private app hidden; mobile and desktop.');
