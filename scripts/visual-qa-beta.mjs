// Public, anonymous read-only QA. No logins, writes, secrets or real user data.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base='https://feat-beta-staging-profile-20.uadav-stream-staging.pages.dev';
const out='artifacts/beta-visual';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let problems=[];
try{
 for(const device of [{name:'mobile-390',width:390,height:844},{name:'mobile-320',width:320,height:700},{name:'desktop-1365',width:1365,height:768}]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,locale:'es-AR',colorScheme:'dark'});
  try{
   const response=await page.goto(base+'/usuario.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(1100);
   const state=await page.evaluate(()=>{
    const home=document.getElementById('profileNativeHome');
    const title=document.querySelector('#profileNativeHome h1');
    const empty=document.querySelector('#profileNativeHome .profile-empty-recent');
    const cta=document.querySelector('#profileNativeHome .profile-empty-action');
    return {
     title:title?.textContent?.trim()||null,
     titleFamily:title?getComputedStyle(title).fontFamily:null,
     homeVisible:!!home&&!home.hidden&&getComputedStyle(home).display!=='none',
     horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+3,
     scrollWidth:document.documentElement.scrollWidth,
     viewport:window.innerWidth,
     emptyVisible:!!empty&&getComputedStyle(empty).display!=='none',
     exploreHref:cta?.getAttribute('href')||null,
     taskCount:document.querySelectorAll('#profileNativeHome #profileTasks .profile-task').length
    };
   });
   await page.screenshot({path:out+'/profile-'+device.name+'.png',fullPage:true,animations:'disabled'});
   console.log(JSON.stringify({device:device.name,status:response?.status(),...state}));
   if(response?.status()!==200)problems.push(device.name+': HTTP status');
   if(!state.homeVisible)problems.push(device.name+': native profile not visible');
   if(state.horizontalOverflow)problems.push(device.name+': horizontal overflow');
   if(state.taskCount!==4)problems.push(device.name+': expected four quick access tasks');
   if(state.emptyVisible&&state.exploreHref!=='/descubrir.html')problems.push(device.name+': empty history does not link to Explore');
   if(state.titleFamily&&/times new roman|georgia|serif(?!\w)/i.test(state.titleFamily.replace('sans-serif','')))problems.push(device.name+': serif title');
  }catch(error){problems.push(device.name+': '+error.message);console.log(JSON.stringify({device:device.name,error:error.message}));}
  finally{await page.close();}
 }
 for(const device of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,locale:'es-AR',colorScheme:'dark'});
  try{
   const response=await page.goto(base+'/app.html?view=%2Fusuario.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(1400);
   const state=await page.evaluate(()=>({
    topVisible:getComputedStyle(document.getElementById('top')).display!=='none',
    mobileVisible:getComputedStyle(document.getElementById('mobile')).display!=='none',
    mobileTabs:document.querySelectorAll('#mobile button').length,
    desktopTabs:document.querySelectorAll('#top .nav button').length,
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+3,
    iframeSrc:document.getElementById('view')?.getAttribute('src')||''
   }));
   await page.screenshot({path:out+'/shell-'+device.name+'.png',fullPage:true,animations:'disabled'});
   console.log(JSON.stringify({device:'shell-'+device.name,status:response?.status(),...state}));
   if(response?.status()!==200)problems.push('shell-'+device.name+': HTTP status');
   if(device.name==='mobile'&&(!state.mobileVisible||state.topVisible))problems.push('mobile navigation visibility');
   if(device.name==='desktop'&&(!state.topVisible||state.mobileVisible))problems.push('desktop navigation visibility');
   if(state.mobileTabs!==5||state.desktopTabs!==4)problems.push('navigation tab count');
   if(state.horizontalOverflow)problems.push('shell horizontal overflow');
  }catch(error){problems.push('shell-'+device.name+': '+error.message);console.log(JSON.stringify({device:'shell-'+device.name,error:error.message}));}
  finally{await page.close();}
 }
}finally{await browser.close();}
if(problems.length){console.error('Visual QA errors: '+JSON.stringify(problems));process.exitCode=1;}
else console.log('PASS: Anonymous responsive beta visual QA; screenshots saved.');
