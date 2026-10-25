/* Isolated QA entrypoint. Appended by build-job-restore-qa.mjs.
 * It serves no platform API. Only synthetic fixtures can reach the embedded
 * original restore route, and only after an empty database is initialized. */
const UADAV_RESTORE_QA_PURPOSE='UADAV_BOLSA_DISPOSABLE_RESTORE_11762';
const UADAV_RESTORE_QA_INTERNAL_KEY='synthetic-internal-restore-only';
const UADAV_RESTORE_QA_IDS=['JOB-QA-RESTORE-A','JOB-QA-RESTORE-B','POST-QA-RESTORE-A','POST-QA-RESTORE-B'];
function uadavRestoreQaError(message,status=409){return Object.assign(Error(message),{qaStatus:status})}
function uadavRestoreQaCheck(ok,message,status=409){if(!ok)throw uadavRestoreQaError(message,status)}
function uadavRestoreQaReply(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}})}
async function uadavRestoreQaAuth(request,env){
 const secret=String(env.QA_RESTORE_KEY||''),header=request.headers.get('Authorization')||'';
 uadavRestoreQaCheck(secret.length>=32&&secret.length<=256,'Configurá una clave exclusiva de QA de al menos 32 caracteres.',503);
 uadavRestoreQaCheck(/^Bearer [^\r\n]{1,256}$/.test(header),'Ingresá la clave exclusiva del ensayo.',401);
 const a=await uadavDigest(secret),b=await uadavDigest(header.slice(7));let difference=0;
 for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 uadavRestoreQaCheck(difference===0,'La clave del ensayo no es válida.',401);return a;
}
async function uadavRestoreQaTables(db){
 return (await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' AND substr(name,1,4)<>'_cf_' ORDER BY name").all()).results.map(row=>row.name);
}
async function uadavRestoreQaState(db,secretHash){
 const tables=await uadavRestoreQaTables(db);
 if(!tables.length)return {empty:true,phase:0};
 uadavRestoreQaCheck(tables.includes('qa_restore_guard'),'La base ya contiene datos. Usá una base nueva y vacía; no se modificó nada.',423);
 const row=await db.prepare('SELECT * FROM qa_restore_guard WHERE purpose=?').bind(UADAV_RESTORE_QA_PURPOSE).first();
 uadavRestoreQaCheck(row&&row.secret_hash===secretHash,'La base no pertenece a este ensayo.',423);
 uadavRestoreQaCheck(tables.every(name=>UADAV_RESTORE_QA_TABLES.includes(name)),'La base contiene tablas ajenas al ensayo.',423);
 const records=(await db.prepare('SELECT collection,id,data_json FROM job_store_records LIMIT 5').all()).results;
 uadavRestoreQaCheck(records.length<=4&&records.every(row=>UADAV_RESTORE_QA_IDS.includes(row.id)&&row.collection===(row.id.startsWith('POST-')?'postulaciones_trabajo':'bolsa_trabajo')),'La base contiene registros ajenos al ensayo.',423);
 const a=await uadavRestoreQaFixture('A'),b=await uadavRestoreQaFixture('B'),expected=new Map();
 for(const fixture of [a,b]){const {owner_access_hash,...job}=fixture.job;expected.set(job.id,job);expected.set(fixture.app.id,fixture.app)}
 const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([x],[y])=>x.localeCompare(y))):item);
 uadavRestoreQaCheck(records.every(item=>canonical(JSON.parse(item.data_json))===canonical(expected.get(item.id))),'Los registros no corresponden a las fichas ficticias del ensayo.',423);
 const emptyTables=['audience_devices','audience_recovery_keys','audience_deletions','audience_announcements','job_owner_recovery_tokens','job_owner_recovery_v2','job_store_rates','job_store_checks'];
 const checks=await db.batch([db.prepare('SELECT COUNT(*) AS n FROM audience_accounts WHERE id<>?').bind(a.accountId),...emptyTables.map(name=>db.prepare('SELECT COUNT(*) AS n FROM '+name))]);
 uadavRestoreQaCheck(checks.every(result=>result.results[0].n===0),'La base contiene datos ajenos al ensayo.',423);
 const present=[a,b].filter(fixture=>records.some(record=>record.id===fixture.job.id));
 uadavRestoreQaCheck(records.length===present.length*2&&present.every(fixture=>records.some(record=>record.id===fixture.app.id)),'El ensayo contiene una pareja de registros incompleta.',423);
 const relations=await db.batch([db.prepare('SELECT job_id,secret_hash FROM job_owner_credentials'),db.prepare('SELECT * FROM job_account_links'),db.prepare('SELECT * FROM job_expiry_notices')]);
 const rows=value=>value.map(canonical).sort().join('\n');
 uadavRestoreQaCheck(rows(relations[0].results)===rows(present.map(fixture=>({job_id:fixture.job.id,secret_hash:fixture.job.owner_access_hash})))&&rows(relations[1].results)===rows(present.flatMap(fixture=>fixture.links))&&rows(relations[2].results)===rows(present.map(fixture=>fixture.notice)),'Los accesos o vínculos no corresponden al ensayo.',423);
 const allowedCounts=[[0],[0,2],[2],[2],[2,4],[4],[4]];
 uadavRestoreQaCheck(allowedCounts[row.phase]?.includes(records.length),'Los datos no corresponden al paso confirmado del ensayo.',423);
 return {...row,empty:false};
}
async function uadavRestoreQaFixture(letter){
 const jobId='JOB-QA-RESTORE-'+letter,appId='POST-QA-RESTORE-'+letter,accountId=await uadavDigest('synthetic-qa-restore-account'),iso='2026-10-25T12:00:00.000Z',deadline='2099-12-31';
 const job={id:jobId,titulo:'QA RESTAURACIÓN '+letter+' · FICTICIA',descripcion:'Ensayo aislado sin datos personales reales.',activo:false,estado:'cerrada_por_contratante',fecha_limite:deadline,request_id:'qa-restore-offer-'+letter,owner_access_hash:await uadavDigest('synthetic-owner-'+letter)};
 const app={id:appId,job_id:jobId,nombre:'Persona ficticia '+letter,email:'qa-'+letter.toLowerCase()+'@example.invalid',estado:'recibida',request_id:'qa-restore-application-'+letter,consulta_hash:await uadavDigest('synthetic-application-'+letter),consent_scope:'job_application_v1',consent_at:iso,shared_fields:['nombre','email']};
 const links=[['bolsa_trabajo',jobId],['postulaciones_trabajo',appId]].map(([collection,record_id])=>({collection,record_id,account_id:accountId,linked_at:iso}));
 const notice={notice_id:await uadavJobExpiryId(jobId,deadline,'soon',accountId),job_id:jobId,deadline,kind:'soon',account_id:accountId,run_id:'synthetic-qa-restore-'+letter,created_at:iso};
 return {job,app,accountId,links,notice,backup:{job_storage:'d1',backup_integrity:{complete:true},job_accounts_available:true,job_expiry_notices_available:true,kv:{bolsa_trabajo:[job],postulaciones_trabajo:[app]},tables:{job_account_links:links,job_expiry_notices:[notice]}}};
}
function uadavRestoreQaDb(db,{injectFailure=false}={}){
 function statement(native,sql){return {_native:native,sql,bind(...args){return statement(native.bind(...args),sql)},run:()=>native.run(),all:()=>native.all(),first:(...args)=>native.first(...args)}}
 return {prepare:sql=>statement(db.prepare(sql),sql),withSession:mode=>uadavRestoreQaDb(typeof db.withSession==='function'?db.withSession(mode):db,{injectFailure}),batch:statements=>{
  const native=statements.map(item=>item._native);
  if(injectFailure&&statements.some(item=>/^INSERT INTO job_store_records\b/.test(item.sql)))native.push(db.prepare('INSERT INTO job_store_checks(id,valid) VALUES(?,0)').bind(crypto.randomUUID()));
  return db.batch(native);
 }};
}
async function uadavRestoreQaCall(db,fixture,{locked=false,injectFailure=false}={}){
 const kv=new Map(),env={DB:uadavRestoreQaDb(db,{injectFailure}),ADMIN_KEY:UADAV_RESTORE_QA_INTERNAL_KEY,JOB_STORE_D1:'true',...(!locked?{ENABLE_JOB_D1_RESTORE:'staging-tested'}:{}),UADAV_DB:{get:async key=>kv.get(key)||null,put:async(key,value)=>{kv.set(key,value)}}};
 const request=new Request('https://uadav-api-staging.uadavstream.workers.dev/api/admin/backup/jobs/restore-missing',{method:'POST',headers:{Origin:'https://uadav-stream-staging.pages.dev','Content-Type':'application/json',Authorization:'Bearer '+UADAV_RESTORE_QA_INTERNAL_KEY},body:JSON.stringify({confirm:'RECUPERAR FALTANTES',confirm_second:'APLICAR RECUPERACION',external_backup_confirmed:true,restore_account_links:true,dry_run:false,backup:fixture.backup})});
 // Direct call inside this isolate: no network, service binding or real staging
 // request. The DB above is the guarded disposable binding, never a live DB.
 const response=await uadavStagingWorker.fetch(request,env,{});return {status:response.status,data:await response.json()};
}
async function uadavRestoreQaCounts(db){
 const result=await db.batch(['job_store_records','job_owner_credentials','job_account_links','job_expiry_notices','job_store_checks'].map(name=>db.prepare('SELECT COUNT(*) AS n FROM '+name)));
 return {records:result[0].results[0].n,credentials:result[1].results[0].n,links:result[2].results[0].n,notices:result[3].results[0].n,checks:result[4].results[0].n};
}
function uadavRestoreQaCountsEqual(actual,records,credentials,links,notices){return actual.records===records&&actual.credentials===credentials&&actual.links===links&&actual.notices===notices&&actual.checks===0}
async function uadavRestoreQaRunPhase(db,phase){
 const a=await uadavRestoreQaFixture('A'),b=await uadavRestoreQaFixture('B');let result;
 if(phase===1){
  result=await uadavRestoreQaCall(db,a,{locked:true});uadavRestoreQaCheck(result.status===423&&result.data.code==='RESTORE_LOCKED','No se conservó el bloqueo por defecto.');
  uadavRestoreQaCheck(uadavRestoreQaCountsEqual(await uadavRestoreQaCounts(db),0,0,0,0),'La petición bloqueada modificó datos.');
  return 'Bloqueo de restauración por defecto: aprobado';
 }
 if(phase===2){
  result=await uadavRestoreQaCall(db,a);uadavRestoreQaCheck(result.status===200&&result.data.success===true,'No se confirmó la primera restauración.');
  uadavRestoreQaCheck(uadavRestoreQaCountsEqual(await uadavRestoreQaCounts(db),2,1,2,1),'La primera restauración quedó incompleta.');
  return 'Oferta, postulación, acceso, vínculos y aviso: recuperados';
 }
 if(phase===3){
  result=await uadavRestoreQaCall(db,a);uadavRestoreQaCheck(result.status===200&&result.data.ofertas===0&&result.data.postulaciones===0&&result.data.account_links_restored===0&&result.data.expiry_notices_restored===0,'La repetición no fue idempotente.');
  uadavRestoreQaCheck(uadavRestoreQaCountsEqual(await uadavRestoreQaCounts(db),2,1,2,1),'La repetición alteró los conteos.');return 'Repetición sin duplicados: aprobada';
 }
 if(phase===4){
  result=await uadavRestoreQaCall(db,b,{injectFailure:true});uadavRestoreQaCheck(result.status===409,'No se detectó la interrupción SQL controlada.');
  uadavRestoreQaCheck(uadavRestoreQaCountsEqual(await uadavRestoreQaCounts(db),2,1,2,1),'La interrupción dejó escrituras parciales.');return 'Interrupción y rollback entre colecciones: aprobados';
 }
 if(phase===5){
  result=await uadavRestoreQaCall(db,b);uadavRestoreQaCheck(result.status===200&&result.data.success===true,'No se pudo retomar la recuperación.');
  uadavRestoreQaCheck(uadavRestoreQaCountsEqual(await uadavRestoreQaCounts(db),4,2,4,2),'El reintento no conservó todo el lote.');return 'Reintento posterior al fallo: aprobado';
 }
 const store=uadavJobStore({DB:db}),jobs=await store.read('bolsa_trabajo'),apps=await store.read('postulaciones_trabajo');
 const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([x],[y])=>x.localeCompare(y))):item);
 for(const fixture of [a,b]){
  uadavRestoreQaCheck(canonical(jobs.find(row=>row.id===fixture.job.id))===canonical(fixture.job),'Los campos o el acceso de una oferta no coinciden.');
  uadavRestoreQaCheck(canonical(apps.find(row=>row.id===fixture.app.id))===canonical(fixture.app),'La postulación o su consentimiento no coinciden.');
 }
 uadavRestoreQaCheck((await db.prepare('PRAGMA foreign_key_check').all()).results.length===0,'Se encontraron referencias inválidas.');
 const check=await db.prepare('PRAGMA quick_check').first();uadavRestoreQaCheck(String(Object.values(check||{})[0]).toLowerCase()==='ok','Falló la comprobación de integridad.');
 return 'Cotejo de campos, accesos, consentimiento e integridad: aprobado';
}
const UADAV_RESTORE_QA_HTML=String.raw`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>UADAV · Ensayo aislado de restauración</title><style>body{margin:0;background:#080d16;color:#eef3fa;font:17px/1.55 system-ui}main{max-width:780px;margin:36px auto;padding:24px}section{background:#131d30;border:1px solid #34415b;border-radius:18px;padding:24px;margin:20px 0}label{display:block;margin:16px 0}input,button{font:inherit;padding:12px;border-radius:10px}input[type=password]{width:90%;max-width:500px}button{cursor:pointer;background:#e9f1ff;color:#080d16;border:0;margin:6px}button:disabled{opacity:.45;cursor:default}strong{color:#ffe082}#feedback{white-space:pre-wrap}li{margin:10px 0}</style></head><body><main><strong>SOLO BASE NUEVA DE QA · DATOS FICTICIOS</strong><h1>Ensayo de restauración</h1><p>Comprueba la recuperación en una base desechable. No admite respaldos personales y no habilita la restauración de la plataforma.</p><section><form id="loginForm"><label>Clave exclusiva del ensayo<input id="qaKey" type="password" autocomplete="current-password" required></label><button id="loginButton" type="submit">Abrir ensayo</button></form><p id="authState" role="status">Ingresá para comprobar la base vinculada.</p></section><section><h2>1. Preparar la base vacía</h2><label><input id="confirmEmpty" type="checkbox" disabled> Confirmo que vinculé la base nueva de prueba, distinta de staging y producción.</label><button id="initializeButton" disabled>Preparar base vacía</button><h2>2. Ejecutar las comprobaciones</h2><button id="runButton" disabled>Ejecutar pruebas</button><button id="copyButton" disabled>Copiar resultado sin datos privados</button><ol id="results"></ol><p id="feedback" role="status"></p></section><p>No se envían correos ni se activa cron. Los accesos usados por las pruebas son ficticios.</p><script>
(function(){'use strict';let key='',phase=0,busy=false,report=null;const $=id=>document.getElementById(id);async function api(path,body){const r=await fetch(path,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(body||{})});let d;try{d=await r.json()}catch{throw Error('No se confirmó la respuesta del ensayo.')}if(!r.ok||d.success!==true)throw Error(d.error||'No se confirmó la operación.');return d}function show(d){report=d;phase=d.phase||0;$('copyButton').disabled=phase<6;$('confirmEmpty').disabled=!d.empty;$('initializeButton').disabled=!d.empty||!$('confirmEmpty').checked;$('runButton').disabled=d.empty||phase>=6;for(const message of d.messages||[]){const li=document.createElement('li');li.textContent=message;$('results').appendChild(li)}$('feedback').textContent=phase>=6?'Ensayo completo. Podés copiar el resultado para la auditoría.':d.empty?'La base está vacía y no contiene datos de la plataforma.':'Base preparada. Completá las pruebas pendientes.'}
$('loginForm').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;report=null;phase=0;$('copyButton').disabled=true;$('initializeButton').disabled=true;$('runButton').disabled=true;$('confirmEmpty').disabled=true;$('results').textContent='';key=$('qaKey').value;$('qaKey').value='';$('loginButton').disabled=true;try{const d=await api('/status');$('authState').textContent='Sesión de prueba abierta';$('results').textContent='';show(d)}catch(e){key='';$('authState').textContent=e.message}finally{busy=false;$('loginButton').disabled=false}});
$('confirmEmpty').addEventListener('change',()=>{$('initializeButton').disabled=!$('confirmEmpty').checked});
$('initializeButton').addEventListener('click',async()=>{if(busy||!$('confirmEmpty').checked)return;busy=true;$('initializeButton').disabled=true;try{show(await api('/initialize',{confirm:'PREPARAR_BASE_QA_VACIA'}))}catch(e){$('feedback').textContent=e.message}finally{busy=false}});
$('runButton').addEventListener('click',async()=>{if(busy)return;busy=true;$('runButton').disabled=true;try{while(phase<6){const d=await api('/step',{phase:phase+1});$('results').textContent='';show(d)}}catch(e){$('feedback').textContent=e.message+' Volvé a abrir el ensayo para comprobar el estado antes de reintentar.'}finally{busy=false}});
$('copyButton').addEventListener('click',async()=>{if(report?.complete!==true)return;try{await navigator.clipboard.writeText(JSON.stringify({result:'complete',scope:'isolated-synthetic-d1',core_sha256:report.source_core_sha256,counts:report.counts,checks:report.messages},null,2));$('feedback').textContent='Resultado copiado, sin clave ni datos personales.'}catch{$('feedback').textContent='No se pudo copiar. Seleccioná el resultado visible y guardalo manualmente.'}});
})();</script></main></body></html>`;
const uadavRestoreQaWorker={async fetch(request,env){
 try{
  const url=new URL(request.url);
  uadavRestoreQaCheck(url.protocol==='https:'&&/^uadav-restore-qa\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname),'Este archivo solo puede usarse en el Worker separado uadav-restore-qa.',403);
  if(request.method==='GET'&&url.pathname==='/health')return uadavRestoreQaReply({ok:true,purpose:'disposable-d1-rehearsal',version:'11762-restore-qa-1',core_sha256:UADAV_RESTORE_QA_CORE_SHA256,enabled:env.QA_RESTORE_ONLY==='true',database_bound:!!env.DB});
  if(request.method==='GET'&&url.pathname==='/')return new Response(UADAV_RESTORE_QA_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'}});
  uadavRestoreQaCheck(request.method==='POST'&&['/status','/initialize','/step'].includes(url.pathname),'Ruta no disponible en el ensayo.',404);
  uadavRestoreQaCheck(env.QA_RESTORE_ONLY==='true'&&env.DB,'El ensayo requiere su propia base y QA_RESTORE_ONLY=true.',503);
  const secretHash=await uadavRestoreQaAuth(request,env),db=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB;
  const state=await uadavRestoreQaState(db,secretHash);
  const status=row=>({success:true,empty:row.empty,phase:row.phase||0,complete:row.phase===6,...(row.phase===6?{counts:{offers:2,applications:2,credentials:2,links:4,notices:2}}:{}),messages:JSON.parse(row.messages||'[]'),source_core_sha256:UADAV_RESTORE_QA_CORE_SHA256});
  if(url.pathname==='/status')return uadavRestoreQaReply(status(state));
  const body=await uadavSecurityJSON(request,2048).catch(()=>null);uadavRestoreQaCheck(body&&typeof body==='object'&&!Array.isArray(body),'Solicitud inválida.',400);
  if(url.pathname==='/initialize'){
   uadavRestoreQaCheck(body.confirm==='PREPARAR_BASE_QA_VACIA','Confirmá la base nueva y vacía.',412);
   if(!state.empty)return uadavRestoreQaReply(status(state));
   const fixture=await uadavRestoreQaFixture('A');
   const guard=UADAV_RESTORE_QA_SCHEMA.find(sql=>sql.startsWith('CREATE TABLE qa_restore_guard'));
   // The empty-database precondition is rechecked INSIDE the same D1 batch as
   // schema creation. A concurrent unrelated table makes phase=-1 fail CHECK,
   // rolling back the marker and all DDL rather than trusting the earlier read.
   await db.batch([db.prepare(guard),db.prepare("INSERT INTO qa_restore_guard(purpose,secret_hash,phase,messages,lease_until) SELECT ?,?,CASE WHEN (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' AND substr(name,1,4)<>'_cf_')=1 THEN 0 ELSE -1 END,?,0").bind(UADAV_RESTORE_QA_PURPOSE,secretHash,'[]'),...UADAV_RESTORE_QA_SCHEMA.filter(sql=>sql!==guard).map(sql=>db.prepare(sql)),db.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')"),db.prepare('INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,?,1,?)').bind(fixture.accountId,'{}','2026-10-25T12:00:00.000Z')]).catch(()=>{throw uadavRestoreQaError('No se confirmó la preparación. Volvé a abrir el ensayo para comprobar el estado.',409)});
   return uadavRestoreQaReply(status({empty:false,phase:0,messages:'[]'}));
  }
  uadavRestoreQaCheck(!state.empty,'Prepará primero la base vacía.',412);
  const phase=Number(body.phase);uadavRestoreQaCheck(Number.isInteger(phase)&&phase>=1&&phase<=6,'Paso inválido.',400);
  if(phase<=state.phase)return uadavRestoreQaReply(status(state));
  uadavRestoreQaCheck(phase===state.phase+1,'Comprobá el estado antes de continuar.',409);
  const owner=crypto.randomUUID(),now=Date.now();
  const lock=await db.prepare('UPDATE qa_restore_guard SET lease_until=?,lock_owner=? WHERE purpose=? AND phase=? AND lease_until<=?').bind(now+60000,owner,UADAV_RESTORE_QA_PURPOSE,state.phase,now).run();
  uadavRestoreQaCheck(lock.meta?.changes===1,'Hay otra comprobación en curso. Esperá y volvé a abrir el ensayo.',409);
  try{
   const message=await uadavRestoreQaRunPhase(db,phase),messages=[...JSON.parse(state.messages||'[]'),message];
   const saved=await db.prepare('UPDATE qa_restore_guard SET phase=?,messages=? WHERE purpose=? AND phase=? AND lock_owner=?').bind(phase,JSON.stringify(messages),UADAV_RESTORE_QA_PURPOSE,state.phase,owner).run();
   uadavRestoreQaCheck(saved.meta?.changes===1,'No se confirmó el paso. Volvé a comprobar el estado.',409);
   return uadavRestoreQaReply(status({empty:false,phase,messages:JSON.stringify(messages)}));
  }finally{await db.prepare('UPDATE qa_restore_guard SET lease_until=0,lock_owner=NULL WHERE purpose=? AND lock_owner=?').bind(UADAV_RESTORE_QA_PURPOSE,owner).run()}
 }catch(error){return uadavRestoreQaReply({success:false,error:error.qaStatus?error.message:'No se completó el ensayo. No cambies de base ni habilites la restauración de staging.'},error.qaStatus||503)}
}};
export default uadavRestoreQaWorker;
