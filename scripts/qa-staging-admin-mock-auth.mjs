// Admin authentication contract with mocked responses only. Never contacts staging/production API.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765',apiOrigin='https://uadav-api-staging.uadavstream.workers.dev';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const problems=[];
try {
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  let adminChecks=0,denied=0,otherWrites=0,revokeNext=false;
  await context.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===base)return route.continue();
   if(url.origin!==apiOrigin)return route.abort();
   if(req.method()!=='GET'){otherWrites++;return route.fulfill({status:403,contentType:'application/json',body:'{"error":"mock is read-only"}'});}
   const path=url.pathname,auth=req.headers().authorization||'';
   let status=200,body={};
   if(path==='/api/admin_check'){
    adminChecks++;
    if(auth!=='Bearer QA-ADMIN-VALID'){status=401;denied++;body={success:false,error:'Credencial de prueba rechazada'};}
    else body={success:true};
   }else if(path==='/api/health')body={ok:true,version:'QA',d1:true,kv:true};
   else if(path==='/api/config')body={branding:{name:'PLATFORM QA'}};
   else if(auth!=='Bearer QA-ADMIN-VALID'&&path.startsWith('/api/admin/')){status=401;denied++;body={error:'Acceso privado rechazado'};}
   else if(path==='/api/admin/d1/status'){if(revokeNext){revokeNext=false;status=401;denied++;body={error:'Sesión revocada'};}else body={configured:true};}
   else body={success:true,items:[],total:0};
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type'}});
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{window.UADAV_ENV='staging';window.PLATFORM_ENV='staging';sessionStorage.removeItem('uadav_admin_v8')});
  try {
   await page.goto(base+'/admin.html',{waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('#loginGate').waitFor({state:'visible',timeout:10000});
   await page.locator('#loginKey').fill('QA-ADMIN-INVALID');
   await page.locator('#loginBtn').click();
   await page.waitForFunction(()=>document.getElementById('loginBtn')?.disabled===false,null,{timeout:10000});
   const rejected=await page.evaluate(()=>({hidden:document.getElementById('app').classList.contains('hidden'),stored:sessionStorage.getItem('uadav_admin_v8')}));
   if(!rejected.hidden||rejected.stored)problems.push(viewport.name+': wrong credential granted access');
   await page.locator('#loginKey').fill('QA-ADMIN-VALID');
   await page.locator('#loginBtn').click();
   await page.locator('#app').waitFor({state:'visible',timeout:14000});
   const entered=await page.evaluate(()=>({gateHidden:document.getElementById('loginGate').classList.contains('hidden'),stored:sessionStorage.getItem('uadav_admin_v8'),appVisible:!document.getElementById('app').classList.contains('hidden')}));
   if(!entered.gateHidden||!entered.appVisible||entered.stored!=='QA-ADMIN-VALID')problems.push(viewport.name+': mock accepted login failed');
   await page.evaluate(()=>window.go('audit'));
   await page.locator('#backupPreviewResult').waitFor({state:'attached',timeout:12000});
   const backupCheck=await page.evaluate(async()=>{
    const basic={generated_at:'2026-11-10T00:00:00Z',kv:{bolsa_trabajo:[],postulaciones_trabajo:[]},tables:{},backup_integrity:{complete:false}};
    const fake=data=>({files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}]});
    await window.previewBackupFile(fake(basic));
    const incomplete=document.getElementById('backupPreviewResult').textContent;
    const blocked=await window.restoreMissingJobs();
    const blockedText=document.getElementById('backupPreviewResult').textContent;
    const invalid=await window.previewBackupFile(fake({generated_at:'2026-11-10'}));
    const invalidText=document.getElementById('backupPreviewResult').textContent;
    return {incomplete:incomplete.includes('INCOMPLETO')&&incomplete.includes('Integridad del respaldo'),blocked:blocked===false&&blockedText.includes('Restauración bloqueada'),invalid:invalidText.includes('No se pudo validar')};
   });
   if(!backupCheck.incomplete||!backupCheck.blocked||!backupCheck.invalid)problems.push(viewport.name+': backup integrity/restore guard failed');
   revokeNext=true;
   await page.evaluate(()=>window.refreshSystemPills());
   await page.waitForFunction(()=>document.getElementById('app').classList.contains('hidden')&&!sessionStorage.getItem('uadav_admin_v8'),null,{timeout:10000});
   const revoked=await page.evaluate(()=>({gate:!document.getElementById('loginGate').classList.contains('hidden'),appHidden:document.getElementById('app').classList.contains('hidden')}));
   if(!revoked.gate||!revoked.appHidden)problems.push(viewport.name+': revoked session still displays Admin');
   await page.locator('#loginKey').fill('QA-ADMIN-VALID');
   await page.locator('#loginBtn').click();
   await page.locator('#app').waitFor({state:'visible',timeout:14000});
   await page.locator('#logoutTop').click();
   await page.locator('#loginGate').waitFor({state:'visible',timeout:10000});
   const after=await page.evaluate(()=>({hidden:document.getElementById('app').classList.contains('hidden'),stored:sessionStorage.getItem('uadav_admin_v8'),field:document.getElementById('loginKey').value}));
   if(!after.hidden||after.stored||after.field)problems.push(viewport.name+': logout did not clear private access');
   if(otherWrites)problems.push(viewport.name+': unexpected API write');
   console.log(JSON.stringify({device:viewport.name,invalidRejected:rejected.hidden,accepted:entered.appVisible,logoutCleared:after.hidden&&!after.stored,revocationHidden:true,checks:adminChecks,denied,backupCheck,externalWrites:otherWrites}));
  }catch(e){problems.push(viewport.name+': '+String(e.message).slice(0,210));}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(problems.length){console.error('FAIL Admin synthetic auth',JSON.stringify(problems));process.exitCode=1}
else console.log('PASS: Admin invalid key denied, valid mock key accepted, logout clears session on two viewports');
