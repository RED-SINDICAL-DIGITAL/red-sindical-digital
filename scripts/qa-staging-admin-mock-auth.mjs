// Admin authentication contract with mocked responses only. Never contacts staging/production API.
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765',apiOrigin='https://uadav-api-staging.uadavstream.workers.dev';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const problems=[];
try {
 for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1365,height:768}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:'es-AR'});
  let homeWritesAllowed=false,homeWrites=0;const homeSaved={};let adminChecks=0,denied=0,otherWrites=0,revokeNext=false,backupIncompleteNext=false;
  await context.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin===base)return route.continue();
   if(url.origin!==apiOrigin)return route.abort();
   if(req.method()!=='GET'&&homeWritesAllowed&&['/api/secciones','/api/web_visibility','/api/home_layout','/api/landing_config'].includes(url.pathname)){homeWrites++;homeSaved[url.pathname]=req.postDataJSON();return route.fulfill({contentType:'application/json',body:'{"success":true}'});}if(req.method()!=='GET'){otherWrites++;return route.fulfill({status:403,contentType:'application/json',body:'{"error":"mock is read-only"}'});}
   const path=url.pathname,auth=req.headers().authorization||'';
   let status=200,body={};
   if(Object.hasOwn(homeSaved,path))body=homeSaved[path];else if(path==='/api/admin_check'){
    adminChecks++;
    if(auth!=='Bearer QA-ADMIN-VALID'){status=401;denied++;body={success:false,error:'Credencial de prueba rechazada'};}
    else body={success:true};
   }else if(path==='/api/health')body={ok:true,version:'QA',d1:true,kv:true};
   else if(path==='/api/config')body={branding:{name:'PLATFORM QA'}};
   else if(auth!=='Bearer QA-ADMIN-VALID'&&path.startsWith('/api/admin/')){status=401;denied++;body={error:'Acceso privado rechazado'};}
   else if(path==='/api/v7/export'){body={generated_at:'2026-11-10T00:00:00Z',kv:backupIncompleteNext?{}:{bolsa_trabajo:[],postulaciones_trabajo:[]},tables:{},backup_integrity:{complete:true}};backupIncompleteNext=false;}
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
   await page.evaluate(()=>window.go('home'));
   await page.getByRole('button',{name:'+ Fila de Trabajo',exact:true}).click();
   if(await page.locator('#sType').inputValue()!=='trabajos'||await page.locator('#sMode').inputValue()!=='auto')throw Error('Trabajo preset is not editable and automatic');
   await page.getByRole('button',{name:'Preparar sección',exact:true}).click();
   await page.getByRole('button',{name:'+ Fila de Cartelera',exact:true}).click();
   if(await page.locator('#sType').inputValue()!=='eventos')throw Error('Cartelera preset is missing');
   await page.getByRole('button',{name:'Preparar sección',exact:true}).click();
   if(otherWrites)throw Error('Preparing sections wrote to the API');
   await page.locator('[data-landing-field]').first().waitFor();
   const heroKey=await page.evaluate(()=>window.UADAVLandingContent.schema.legacy.promo_title);
   await page.locator('[data-landing-field="'+heroKey+'"]').fill('Landing editada desde Admin QA');
   await page.getByRole('button',{name:'Subir Bolsa',exact:true}).click();
   if(await page.locator('[data-landing-field="'+heroKey+'"]').inputValue()!=='Landing editada desde Admin QA')throw Error('Reordering Home lost the landing draft');
   await page.getByLabel('Mostrar Trabajo',{exact:true}).uncheck();
   for(let n=0;n<6;n++)await page.getByRole('button',{name:'Subir bloque Preguntas frecuentes',exact:true}).click();
   homeWritesAllowed=true;await page.locator('#saveHomeBtn').click();await page.waitForFunction(()=>document.getElementById('saveHomeBtn')?.disabled===false);homeWritesAllowed=false;
   if(homeWrites!==4||!homeSaved['/api/landing_config']?.landing_page)throw Error('Complete landing was not included in the synthetic save');
   if(homeSaved['/api/home_layout'].order.indexOf('jobs')>homeSaved['/api/home_layout'].order.indexOf('cartelera'))throw Error('Home section reorder was not saved');
   await page.evaluate(()=>window.go('audit'));await page.locator('#backupPreviewResult').waitFor();await page.evaluate(()=>window.go('home',true));await page.locator('[data-landing-field]').first().waitFor();
   if(await page.locator('[data-landing-field="'+heroKey+'"]').inputValue()!=='Landing editada desde Admin QA'||await page.getByLabel('Mostrar Trabajo',{exact:true}).isChecked())throw Error('Full landing did not recover its saved text and visibility');
   if(await page.locator('#landingBlockOrder > div').first().getAttribute('data-landing-order')!=='faq')throw Error('Landing order did not survive save/reload');
   await page.evaluate(()=>window.go('audit'));
   await page.locator('#backupPreviewResult').waitFor({state:'attached',timeout:12000});
   const backupCheck=await page.evaluate(async()=>{
    const basic={generated_at:'2026-11-10T00:00:00Z',kv:{bolsa_trabajo:[],postulaciones_trabajo:[]},tables:{},backup_integrity:{complete:false}};
    const fake=data=>({files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}]});
    await window.previewBackupFile(fake(basic));
    const incomplete=document.getElementById('backupPreviewResult').textContent;
    await window.previewBackupFile(fake({generated_at:'2026-11-10T00:00:00Z',kv:{bolsa_trabajo:{oops:true},postulaciones_trabajo:[]},tables:{},backup_integrity:{complete:true}}));
    const invalidCritical=document.getElementById('backupPreviewResult').textContent;
    const blocked=await window.restoreMissingJobs();
    const blockedText=document.getElementById('backupPreviewResult').textContent;
    const invalid=await window.previewBackupFile(fake({generated_at:'2026-11-10'}));
    const invalidText=document.getElementById('backupPreviewResult').textContent;
    return {invalidCritical:invalidCritical.includes('bolsa_trabajo')&&invalidCritical.includes('no son listas válidas'),incomplete:incomplete.includes('INCOMPLETO')&&incomplete.includes('Integridad del respaldo'),blocked:blocked===false&&blockedText.includes('Restauración bloqueada'),invalid:invalidText.includes('No se pudo validar')};
   });
   if(!backupCheck.incomplete||!backupCheck.invalidCritical||!backupCheck.blocked||!backupCheck.invalid)problems.push(viewport.name+': backup integrity/restore guard failed');
   const backupDownloadEvent=page.waitForEvent('download',{timeout:12000});
   await page.evaluate(()=>window.exportAll());
   const backupDownload=await backupDownloadEvent;
   const exportFilename=backupDownload.suggestedFilename();
   if(!/backup-.*\.json$/.test(exportFilename)||exportFilename.includes('INCOMPLETO'))problems.push(viewport.name+': complete JSON export filename is incorrect');

   backupIncompleteNext=true;
   let cancelledIncomplete=false;
   page.once('dialog',async dialog=>{cancelledIncomplete=true;await dialog.dismiss()});
   await page.evaluate(()=>window.exportAll());
   if(!cancelledIncomplete)problems.push(viewport.name+': absent critical KV was not flagged as incomplete');

   await page.evaluate(()=>window.go('imports'));
   await page.locator('#importFile').waitFor({state:'attached',timeout:12000});
   await page.locator('#importEntity').selectOption('events');
   await page.locator('#importFile').setInputFiles({name:'qa-events.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({entity:'events',rows:[{titulo:'Evento sintético QA',descripcion:'Prueba aislada',source_url:'https://example.com/qa-evento-externo'}]}))});
   await page.locator('#importPreview').evaluate(()=>{});
   await page.evaluate(()=>window.previewImport());
   const preview=await page.evaluate(()=>({count:window.S.importRows.length,enabled:!document.getElementById('importCommit').disabled,text:document.getElementById('importPreview').textContent}));
   if(preview.count!==1||!preview.enabled||!preview.text.includes('Evento sintético QA'))problems.push(viewport.name+': JSON preview did not display one synthetic event');
   await page.locator('#importOrigin').fill('Cambio después de vista previa');
   await page.locator('#importOrigin').dispatchEvent('change');
   const invalidated=await page.evaluate(()=>({disabled:document.getElementById('importCommit').disabled,count:window.S.importRows.length}));
   if(!invalidated.disabled||invalidated.count!==0)problems.push(viewport.name+': changing settings did not invalidate import');
   await page.evaluate(()=>window.commitImport());
   if(otherWrites!==0)problems.push(viewport.name+': invalidated import invoked remote write');

   await page.locator('#importFile').setInputFiles({name:'qa-invalid.json',mimeType:'application/json',buffer:Buffer.from('{invalid-json')});
   await page.evaluate(()=>window.previewImport());
   const malformed=await page.evaluate(()=>({disabled:document.getElementById('importCommit').disabled,text:document.getElementById('importPreview').textContent}));
   if(!malformed.disabled||!malformed.text.includes('No se pudo'))problems.push(viewport.name+': invalid JSON import was not rejected');
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
   console.log(JSON.stringify({device:viewport.name,invalidRejected:rejected.hidden,accepted:entered.appVisible,logoutCleared:after.hidden&&!after.stored,revocationHidden:true,checks:adminChecks,denied,backupCheck,exportFilename,importPreview:preview.count,invalidated:invalidated.disabled,malformedRejected:malformed.disabled,externalWrites:otherWrites}));
  }catch(e){problems.push(viewport.name+': '+String(e.message).slice(0,210));}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(problems.length){console.error('FAIL Admin synthetic auth',JSON.stringify(problems));process.exitCode=1}
else console.log('PASS: Admin invalid key denied, valid mock key accepted, logout clears session on two viewports');
