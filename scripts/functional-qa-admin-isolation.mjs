// Anonymous Admin access and API isolation QA. Never supplies credentials or calls write APIs.
import {chromium} from 'playwright';
const base='https://feat-beta-staging-profile-20.uadav-stream-staging.pages.dev';
const staging='https://uadav-api-staging.uadavstream.workers.dev/api/';
const production='https://uadav-api.uadavstream.workers.dev/api/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  const page=await context.newPage();
  const crossProduction=[],writes=[];
  page.on('request',r=>{
   const url=r.url();
   if(url.startsWith(production))crossProduction.push({method:r.method(),route:url.slice(production.length).split('?')[0]});
   if(url.includes('uadavstream.workers.dev/api/')&&!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.method());
  });
  try{
   const response=await page.goto(base+'/admin.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>typeof window.PLATFORM_API_BASE==='string',null,{timeout:12000});
   await page.waitForTimeout(800);
   const state=await page.evaluate(()=>({
    api:window.PLATFORM_API_BASE,
    alias:window.UADAV_API_BASE,
    local:window.PLATFORM_USE_LOCAL_API===true,
    gate:!!document.getElementById('loginGate')&&getComputedStyle(document.getElementById('loginGate')).display!=='none',
    appHidden:!!document.getElementById('app')?.classList.contains('hidden'),
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+3
   }));
   console.log(JSON.stringify({viewport:viewport.name,status:response?.status(),...state,productionRequests:crossProduction.length,apiWrites:writes.length}));
   if(response?.status()!==200||state.api!==staging||state.alias!==staging||state.local)errors.push(viewport.name+': Admin API isolation not enforced');
   if(!state.gate||!state.appHidden)errors.push(viewport.name+': anonymous Admin is not gated');
   if(state.horizontalOverflow)errors.push(viewport.name+': Admin login overflows');
   if(crossProduction.length||writes.length)errors.push(viewport.name+': anonymous Admin requested production or wrote API');
  }catch(error){errors.push(viewport.name+': '+String(error.message).slice(0,170))}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(errors.length){console.error('ADMIN ISOLATION QA FAILED',JSON.stringify(errors));process.exitCode=1}
else console.log('PASS: Admin anonymous gate, staging API isolation and responsive login, no writes or production calls.');
