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
   // Exercise the deployed shell itself, not just static HTML. No API calls are allowed.
   const shell=await page.evaluate(()=>{
    window.__qaShellNodes={dock:document.getElementById('mediaDock'),radio:document.getElementById('radioAudio'),frame:document.getElementById('view')};
    return Object.values(window.__qaShellNodes).every(Boolean);
   });
   if(!shell)failures.push(viewport.name+': persistent shell elements missing');
   const nav=viewport.width<=390?'#mobile':'#top .nav';
   for(const route of ['/cartelera.html','/en-vivo.html','/bolsa-trabajo.html','/index-v117.html','/usuario.html']){
    await page.locator(nav+' [data-route="'+route+'"]').click();
    await page.waitForTimeout(900);
    const navigation=await page.evaluate(expected=>{
     const view=document.querySelector('#view');
     let framePath='',frameError='';
     try{framePath=view?.contentWindow?.location.pathname||''}catch(e){frameError=String(e?.message||e)}
     return {expected,view:new URLSearchParams(location.search).get('view'),framePath,frameError,url:location.href};
    },route);
    console.log('PREVIEW_NAV',JSON.stringify({viewport:viewport.name,...navigation}));
    const canonical=value=>String(value||'').replace(/\.html$/,'');
    if(canonical(navigation.view)!==canonical(route)||canonical(navigation.framePath)!==canonical(route))failures.push(viewport.name+': route mismatch '+JSON.stringify(navigation));
    const same=await page.evaluate(()=>({
     dock:window.__qaShellNodes?.dock===document.getElementById('mediaDock'),
     radio:window.__qaShellNodes?.radio===document.getElementById('radioAudio'),
     frame:window.__qaShellNodes?.frame===document.getElementById('view'),
     overflow:document.documentElement.scrollWidth>innerWidth+3
    }));
    if(!same.dock||!same.radio||!same.frame||same.overflow)failures.push(viewport.name+': shell lost elements on '+route);
   }
   await page.screenshot({path:out+'/shell-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
   const adminResponse=await page.goto(origin+'/admin.html',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('#loginGate').waitFor({state:'visible',timeout:12000});
   const admin=await page.evaluate(()=>({
    loginVisible:getComputedStyle(document.getElementById('loginGate')).display!=='none',
    appHidden:document.getElementById('app').classList.contains('hidden'),
    noSession:!sessionStorage.getItem('uadav_admin_v8')
   }));
   await page.screenshot({path:out+'/admin-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
   if(adminResponse?.status()!==200||!admin.loginVisible||!admin.appHidden||!admin.noSession)failures.push(viewport.name+': public admin guard failed');
   const verifierPage=await page.goto(origin+'/verificar-respaldo.html',{waitUntil:'domcontentloaded',timeout:25000});
   if(verifierPage?.status()!==200)failures.push(viewport.name+': offline backup verifier not deployed');
   const mock={generated_at:'2026-11-10T14:00:00Z',kv:{bolsa_trabajo:[],postulaciones_trabajo:[]},tables:{audit:[]},backup_integrity:{complete:true,d1_configured:true}};
   await page.locator('#backup').setInputFiles({name:'backup-qa.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(mock))});
   await page.locator('#inspect').click();
   await page.waitForFunction(()=>document.querySelector('#result')?.dataset.verified==='true',null,{timeout:8000});
   const valid=await page.locator('#result').innerText();
   if(!valid.includes('ESTRUCTURA CORRECTA')||!/SHA-256: [a-f0-9]{64}/.test(valid))failures.push(viewport.name+': backup checker positive case failed');
   await page.locator('#backup').setInputFiles({name:'backup-incompleto.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...mock,backup_integrity:{complete:false}}))});
   await page.locator('#inspect').click();
   await page.waitForFunction(()=>document.querySelector('#result')?.dataset.verified==='false',null,{timeout:8000});
   const denied=await page.locator('#result').innerText();
   if(!denied.includes('RESPALDO INCOMPLETO'))failures.push(viewport.name+': incomplete backup not rejected');
   await page.locator('#backup').setInputFiles({name:'backup-sin-d1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...mock,tables:{}}))});
   await page.locator('#inspect').click();
   await page.waitForFunction(()=>{const r=document.querySelector('#result');return r?.dataset.verified==='false'&&r.textContent.includes('El respaldo no contiene ninguna tabla D1')},null,{timeout:8000});
   const noD1=await page.locator('#result').innerText();
   if(!noD1.includes('no contiene ninguna tabla D1'))failures.push(viewport.name+': empty D1 table inventory incorrectly accepted');
   console.log('BACKUP_BROWSER_QA',JSON.stringify({viewport:viewport.name,valid:true,incompleteRejected:denied.includes('RESPALDO INCOMPLETO'),missingD1Rejected:noD1.includes('no contiene ninguna tabla D1')}));
   console.log(JSON.stringify({viewport:viewport.name,profile,admin,origin}));
  }catch(e){failures.push(viewport.name+': '+String(e?.message||e).slice(0,240));}
  finally{await context.close();}
 }
}finally{await browser.close();}
if(failures.length){console.error('FAILED remote preview QA:',JSON.stringify(failures));process.exitCode=1}
else console.log('PASS: published isolated preview profile and anonymous Admin, three viewports, no external requests.');
