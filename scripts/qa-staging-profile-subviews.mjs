// Read-only functional browser checks of personal subviews and accessible job tabs.
// Runs with local files only; all external requests are blocked.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts/staging-integration-visual',{recursive:true});
const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
 for(const viewport of [{name:'mobile-320',width:320,height:700},{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768},{name:'tv',width:1920,height:1080}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage();
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  try{
   await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#view');
   await frame.locator('#profileNativeHome').waitFor({state:'visible',timeout:16000});
   const studioShortcut=frame.locator('a.profile-radio-shortcut[href="/radio-studio.html"]');
   await studioShortcut.waitFor({state:'visible',timeout:10000});
   const studioAccessible=await studioShortcut.evaluate(node=>{
     const home=document.getElementById('profileNativeHome');
     return !!home&&!home.hidden&&node.getBoundingClientRect().width>=44&&node.getBoundingClientRect().height>=44
       &&node.closest('#profileTasks')!==null;
   });
   if(!studioAccessible)failures.push(viewport.name+': Mi radio shortcut is not visible in native profile home');
   const publish=frame.locator('.profile-publish-actions');
   await publish.waitFor({state:'visible'});
   if(await publish.locator('a').count()!==2||await frame.locator('#profileTasks a[href="/publicar-evento.html"]').count()!==1)failures.push(viewport.name+': publication links missing or duplicated');
   if(await frame.locator('.profile-more a[href="/publicar-evento.html"]').count())failures.push(viewport.name+': publish remains hidden under more options');
   const header=await frame.locator('#profileNativeHome .hero').boundingBox();
   if(header.height>210)failures.push(viewport.name+': oversized identity header');
   const radioIcon=await studioShortcut.locator('svg use').getAttribute('href');
   if(radioIcon!=='#pi-radio')failures.push(viewport.name+': inconsistent radio icon');
   await frame.locator('#profileNativeHome').screenshot({path:'artifacts/staging-integration-visual/profile-dashboard-'+viewport.name+'.png'});
   await frame.locator('a.profile-task[href*="vista=trabajos"]').click();
   await page.waitForFunction(()=>{
    const doc=document.querySelector('#view')?.contentDocument;
    return !!doc?.getElementById('profileJobsTabOffers')&&!!doc?.getElementById('profileJobsApplications');
   },null,{timeout:14000});
   const offers=frame.locator('#profileJobsTabOffers');
   const applications=frame.locator('#profileJobsTabApplications');
   await offers.click();
   if(await offers.getAttribute('aria-selected')!=='true'||await frame.locator('#profileJobsOffers').isHidden())failures.push(viewport.name+': offers tab not accessible');
   await applications.click();
   if(await applications.getAttribute('aria-selected')!=='true'||await frame.locator('#profileJobsApplications').isHidden())failures.push(viewport.name+': applications tab not accessible');
   const state=await frame.locator('body').evaluate(body=>({
    view:body.dataset.profileView||null,
    tabs:body.querySelectorAll('#mis-trabajos [role="tab"]').length,
    ownerEventForm:!!body.querySelector('#profileOwnedEventForm'),
    ownerEventSave:!!body.querySelector('#profileOwnedEventSave'),
    horizontalOverflow:body.ownerDocument.documentElement.scrollWidth>innerWidth+3
   }));
   console.log(JSON.stringify({viewport:viewport.name,...state,checks:'click-only'}));
   if(state.tabs!==2||!state.ownerEventForm||!state.ownerEventSave||state.horizontalOverflow)failures.push(viewport.name+': profile subview controls/overflow issue');
   // Verify real navigation from Mi Perfil to Radio Studio, not just a visible link.
   await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded'});
   await frame.locator('#profileNativeHome').waitFor({state:'visible',timeout:16000});
   await frame.locator('a.profile-radio-shortcut[href="/radio-studio.html"]').click();
   await page.waitForFunction(()=>{
     const shell=document.querySelector('#view');
     const target=shell?.getAttribute('src')||'';
     const title=shell?.contentDocument?.querySelector('h1')?.textContent||'';
     return /radio-studio[.]html/.test(target)&&title.trim()==='Radio Studio';
   },null,{timeout:14000});
   const studioRoute=await page.evaluate(()=>{
     const v=document.querySelector('#view');
     return {src:v?.getAttribute('src')||'',title:v?.contentDocument?.querySelector('h1')?.textContent?.trim()||'',outside:document.documentElement.scrollWidth>innerWidth+3};
   });
   if(studioRoute.title!=='Radio Studio'||studioRoute.outside)failures.push(viewport.name+': Mi Perfil did not open Radio Studio within shell '+JSON.stringify(studioRoute));
   console.log('PROFILE_TO_RADIO_STUDIO_QA',JSON.stringify({viewport:viewport.name,route:studioRoute.src,title:studioRoute.title}));

  }catch(error){failures.push(viewport.name+': '+String(error?.message||error).slice(0,230));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error('FAIL',JSON.stringify(failures));process.exitCode=1;}
else console.log('PASS: offline personal job subview and tab interaction, event editor preserved.');
