// Isolated visual smoke: local Pages files only; no real API calls, logins, writes or email.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:8765';
const out='artifacts/staging-integration-visual';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const viewport of [{name:'mobile-390',width:390,height:844},{name:'mobile-320',width:320,height:700},{name:'desktop-1365',width:1365,height:768}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,locale:'es-AR',colorScheme:'dark'});
  // Never call live systems: all network outside the local static server is blocked.
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   return url.origin===base ? route.continue() : route.abort();
  });
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  try{
   const response=await page.goto(base+'/usuario.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>{
    const doc=document.getElementById('view')?.contentDocument||document;
    return !!doc.getElementById('profileNativeHome')&&!!doc.getElementById('profileLegacyViews');
   },null,{timeout:15000});
   await page.waitForTimeout(400);
   const state=await page.evaluate(()=>{
    const doc=document.getElementById('view')?.contentDocument||document;
    const home=doc.getElementById('profileNativeHome');
    const legacy=doc.getElementById('profileLegacyViews');
    const style=doc.getElementById('beta-profile-visual-20261108');
    return {
     status:document.readyState,
     home:!!home,legacy:!!legacy,style:!!style,
     jobsTabs:!!doc.getElementById('profileJobsTabApplications')&&!!doc.getElementById('profileJobsTabOffers'),
     ownedEvents:!!doc.getElementById('profileOwnedEventSave')&&!!doc.getElementById('profileOwnedEventsList'),
     scrollWidth:doc.documentElement.scrollWidth,viewport:innerWidth,
     overflow:doc.documentElement.scrollWidth>innerWidth+3,
     nativeVisible:!!home&&!home.hidden&&doc.defaultView.getComputedStyle(home).display!=='none'
    };
   });
   await page.screenshot({path:out+'/profile-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
   console.log(JSON.stringify({viewport:viewport.name,http:response?.status(),...state}));
   if(response?.status()!==200||!state.home||!state.legacy||!state.style||!state.jobsTabs||!state.ownedEvents||state.overflow||!state.nativeVisible)errors.push(viewport.name+': profile check failed');
  }catch(error){errors.push(viewport.name+': '+String(error?.message||error).slice(0,180));}
  finally{await page.close();}
 }
}finally{await browser.close();}
if(errors.length){console.error('FAIL: '+JSON.stringify(errors));process.exitCode=1}
else console.log('PASS: offline local Mi Perfil responsive browser smoke');
