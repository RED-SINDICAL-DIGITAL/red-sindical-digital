// Public preview read-only browser QA. Only the official isolated Pages preview can be loaded.
// All API, analytics, video and third-party requests are blocked; never login or submit forms.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const origin='https://integration-staging-preserve.uadav-stream-staging.pages.dev';
const baseHost=new URL(origin).hostname;
const out='artifacts/staging-integration-remote-preview';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
 for(const viewport of [{name:'mobile-390',width:390,height:844},{name:'mobile-320',width:320,height:700},{name:'desktop-1365',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   return url.protocol==='https:'&&url.hostname===baseHost?route.continue():route.abort();
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  try{
   const result=await page.goto(origin+'/usuario.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.waitForFunction(()=>{
    const doc=document.querySelector('#view')?.contentDocument;
    const home=doc?.getElementById('profileNativeHome');
    return !!home&&!home.hidden&&doc.defaultView.getComputedStyle(home).display!=='none';
   },null,{timeout:18000});
   const profile=await page.evaluate(()=>{
    const doc=document.querySelector('#view').contentDocument;
    const home=doc.getElementById('profileNativeHome');
    return {
     style:!!doc.getElementById('beta-profile-visual-20261108'),
     jobs:!!doc.getElementById('profileJobsTabOffers'),
     events:!!doc.getElementById('profileOwnedEventSave'),
     homeVisible:!!home&&!home.hidden&&doc.defaultView.getComputedStyle(home).display!=='none',
     horizontalOverflow:doc.documentElement.scrollWidth>innerWidth+3
    };
   });
   await page.screenshot({path:out+'/profile-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
   if(result?.status()!==200||!profile.style||!profile.jobs||!profile.events||!profile.homeVisible||profile.horizontalOverflow)failures.push(viewport.name+': public profile smoke failed');
   const adminResponse=await page.goto(origin+'/admin.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('#loginGate').waitFor({state:'visible',timeout:12000});
   const admin=await page.evaluate(()=>({
    loginVisible:getComputedStyle(document.getElementById('loginGate')).display!=='none',
    appHidden:document.getElementById('app').classList.contains('hidden'),
    noSession:!sessionStorage.getItem('uadav_admin_v8')
   }));
   await page.screenshot({path:out+'/admin-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
   if(adminResponse?.status()!==200||!admin.loginVisible||!admin.appHidden||!admin.noSession)failures.push(viewport.name+': public admin guard failed');
   console.log(JSON.stringify({viewport:viewport.name,profile,admin,origin}));
  }catch(e){failures.push(viewport.name+': '+String(e?.message||e).slice(0,240));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error('FAILED remote preview QA:',JSON.stringify(failures));process.exitCode=1}
else console.log('PASS: published isolated preview profile and anonymous Admin, three viewports, no external requests.');
