// Read-only functional browser checks of personal subviews and accessible job tabs.
// Runs with local files only; all external requests are blocked.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
try{
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage();
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging'});
  try{
   await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#view');
   await frame.locator('#profileNativeHome').waitFor({state:'visible',timeout:16000});
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
  }catch(error){failures.push(viewport.name+': '+String(error?.message||error).slice(0,230));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error('FAIL',JSON.stringify(failures));process.exitCode=1;}
else console.log('PASS: offline personal job subview and tab interaction, event editor preserved.');
