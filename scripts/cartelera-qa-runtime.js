/* Isolated synthetic runner. No operational routes, bindings or cron are exposed. */
const CQA_PURPOSE='UADAV_CARTELERA_DISPOSABLE_11770',CQA_HOST='uadav-cartelera-qa-11770.uadavstream.workers.dev';
const cqaHash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),b=>b.toString(16).padStart(2,'0')).join('');
const cqaNeed=(ok,code,status=423)=>{if(!ok)throw Object.assign(Error(code),{qaCode:code,status})};
function cqaDB(native,prefix){
 const pattern=new RegExp('\\b('+CQA_SQL_NAMES.join('|')+')\\b','g');
 function sqlMap(sql){let out=sql.replace(pattern,n=>prefix+n);if(/\bsqlite_master\b/.test(out)){cqaNeed(/^SELECT\b/i.test(out.trim()),'QA_SQL_INVENTORY');out=out.replace(/\bsqlite_master\b/g,"(SELECT type,substr(name,"+(prefix.length+1)+") AS name,tbl_name,rootpage,sql FROM sqlite_master WHERE substr(name,1,"+prefix.length+")='"+prefix+"')")}return out}
 const db={prepare(sql){let bound=native.prepare(sqlMap(sql));const item={bind(...args){bound=bound.bind(...args);return item},run:()=>bound.run(),all:()=>bound.all(),first:(...args)=>bound.first(...args)};Object.defineProperty(item,'native',{get:()=>bound});return item},batch:s=>native.batch(s.map(x=>x.native)),withSession:()=>db};return db;
}
async function cqaGuard(native,keyHash,initialize=false){
 const names=(await native.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).results.map(r=>r.name);
 const foreign=n=>n!=='_cf_KV'&&n!=='cartelera_qa_guard'&&!['qc11770_','qr11770_','qf11770_'].some(p=>n.startsWith(p));
 cqaNeed(!names.some(foreign),'QA_FOREIGN_DATABASE');
 if(!names.includes('cartelera_qa_guard')){
  cqaNeed(names.every(n=>n==='_cf_KV'),'QA_UNOWNED_DATABASE');if(!initialize)return null;
  await native.batch([
   native.prepare('CREATE TABLE IF NOT EXISTS cartelera_qa_guard(id INTEGER PRIMARY KEY CHECK(id=1),purpose TEXT NOT NULL,key_hash TEXT NOT NULL,core_sha TEXT NOT NULL,state_json TEXT NOT NULL,lease_owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0)'),
   native.prepare("INSERT INTO cartelera_qa_guard(id,purpose,key_hash,core_sha,state_json) SELECT 1,CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_cf_KV','cartelera_qa_guard')) THEN NULL ELSE ? END,?,?,? WHERE NOT EXISTS(SELECT 1 FROM cartelera_qa_guard)").bind(CQA_PURPOSE,keyHash,CQA_CORE_SHA,JSON.stringify({phase:0,checks:[]}))
  ]);
 }
 const row=await native.prepare('SELECT * FROM cartelera_qa_guard WHERE id=1').first();cqaNeed(row&&row.purpose===CQA_PURPOSE&&row.key_hash===keyHash&&row.core_sha===CQA_CORE_SHA,'QA_GUARD_MISMATCH');return row;
}
function cqaCoreEnv(env){const values=new Map([['moderation_settings',JSON.stringify({enabled:false,provider:'none'})]]);return {DB:cqaDB(env.DB,'qc11770_'),ADMIN_KEY:env.CARTELERA_QA_KEY,EVENT_ATOMIC_STAGING:'true',UADAV_DB:{get:async k=>values.get(k)||null,put:async(k,v)=>values.set(k,v)}}}
async function cqaCall(core,path,method='GET',body,admin=true){const r=await uadavStagingWorker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/'+path,{method,headers:{'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.117',...(admin?{Authorization:'Bearer '+core.ADMIN_KEY}:{})},...(body?{body:JSON.stringify(body)}:{})}),core,{});return {status:r.status,body:await r.json()}}
const cqaEvent=(request_id,title='QA 11770 · Evento ficticio')=>({request_id,titulo:title,descripcion:'Prueba sintética aislada. No es una convocatoria real.',fecha:'2028-12-31',fecha_inicio:'2028-12-31',hora:'21:00',lugar:'Sala ficticia de QA',ciudad:'Rosario',es_gratuito:true});
async function cqaPhase(native,env,phase,state){
 const core=cqaCoreEnv(env),db=core.DB,checks=[...state.checks];
 if(phase===1){
  const body={...cqaEvent('qa11770-publication-reference'),destacado_solicitado:true},results=await Promise.all([cqaCall(core,'eventos','POST',body,false),cqaCall(core,'eventos','POST',body,false)]);
  cqaNeed(results.every(x=>x.status===200)&&results[0].body.id===results[1].body.id,'QA_PUBLICATION');const id=results[0].body.id;
  cqaNeed((await cqaCall(core,'eventos','POST',{...body,titulo:'Contenido cambiado'},false)).status===409,'QA_CONFLICT');
  const receipt=await cqaCall(core,'eventos/receipt?request_id='+body.request_id);cqaNeed(receipt.body.confirmed===true&&receipt.body.id===id&&Object.keys(receipt.body).length===2,'QA_RECEIPT');
  const admin=await cqaCall(core,'cartelera','POST',cqaEvent('qa11770-admin-reference','QA 11770 · Evento de Admin'));cqaNeed(admin.status===200&&!!admin.body.item?.id,'QA_ADMIN_CREATE');
  cqaNeed((await cqaCall(core,'cartelera','PUT',{id,titulo:'QA 11770 · Editado'})).status===200,'QA_ADMIN_EDIT');
  checks.push('Publicación pública concurrente, conflicto y comprobante: aprobado','Creación y edición de Admin: aprobado');return {...state,phase,checks,event_id:id};
 }
 if(phase===2){
  const source={titulo:'QA 11770 · Importado ficticio',fecha:'2028-12-31',lugar:'Sala ficticia',source_url:'https://example.org/cartelera-qa/11770',source_auto_sync:false},payload={kind:'event',items:[source]};
  cqaNeed((await cqaCall(core,'admin/federated/import','POST',payload)).status===200,'QA_IMPORT');cqaNeed((await cqaCall(core,'admin/import','POST',{entity:'events',rows:[source]})).status===200,'QA_BULK_IMPORT');
  const imported=await db.prepare("SELECT id FROM events WHERE title=?").bind(source.titulo).all();cqaNeed(imported.results.length===1,'QA_IMPORT_DUPLICATE');
  cqaNeed((await cqaCall(core,'cartelera','DELETE',{id:imported.results[0].id})).status===200,'QA_DELETE');cqaNeed((await cqaCall(core,'admin/federated/import','POST',payload)).body.skipped===1,'QA_RESURRECTION');
  await db.prepare("UPDATE events SET data_json=json_set(data_json,'$.destacado_solicitado',json('true')) WHERE id=?").bind(state.event_id).run();
  cqaNeed((await cqaCall(core,'eventos','PUT',{id:state.event_id,action:'feature_paid',destacado_pagado:true,destacado_hasta:new Date(Date.now()+86400000).toISOString()})).status===200,'QA_PAID_FEATURE');
  await db.prepare("UPDATE events SET data_json=json_set(data_json,'$.destacado_hasta','2000-01-01T00:00:00Z') WHERE id=?").bind(state.event_id).run();
  cqaNeed((await cqaCall(core,'admin/cartelera/maintenance','POST',{})).status===200,'QA_MAINTENANCE');
  const e=await db.prepare('SELECT featured,payment_status FROM events WHERE id=?').bind(state.event_id).first();cqaNeed(e.featured===0&&e.payment_status==='vencido','QA_EXPIRY');
  cqaNeed((await cqaCall(core,'admin/cartelera/maintenance','POST',{})).body.expired_features===0,'QA_REPEATED_MAINTENANCE');
  checks.push('Importación repetida y baja sin reactivación: aprobado','Destacado pago, vencimiento y mantenimiento repetido: aprobado');return {...state,phase,checks};
 }
 if(phase===3){
  await db.prepare(uadavCarteleraNotices.schema).run();const notice=await db.prepare("SELECT id FROM notifications WHERE template='event_published' ORDER BY id LIMIT 1").first();cqaNeed(notice,'QA_NOTICE_MISSING');
  await db.prepare("INSERT OR IGNORE INTO event_notification_dispatch(notification_id,state,owner,lease_until,attempts,next_at,provider_id,error_code,updated_at) VALUES(?,'sending','qa-interrupted',1,1,0,NULL,NULL,'2026-10-28T00:00:00Z')").bind(notice.id).run();
  const tables={};for(const name of ['events','event_publication_intents','notifications','entity_versions','event_notification_dispatch'])tables[name]=(await db.prepare('SELECT * FROM '+name).all()).results;
  const backup={version:'11770-cartelera-qa',tables};backup.backup_digest={algorithm:'SHA-256',format:'json-stringify-without-backup_digest-v1',value:await cqaHash(JSON.stringify(backup))};
  const restored=cqaDB(native,'qr11770_'),purpose='CARTELERA_DISPOSABLE_RESTORE_11770',r=await cqaRestore.restoreDisposable(restored,backup,{purpose});cqaNeed(r.complete,'QA_RESTORE');
  cqaNeed((await cqaRestore.restoreDisposable(restored,backup,{purpose})).already_restored,'QA_RESTORE_RETRY');
  cqaNeed((await restored.prepare('SELECT state FROM event_notification_dispatch WHERE notification_id=?').bind(notice.id).first()).state==='uncertain','QA_RESTORE_MAIL');
  const failDB=cqaDB(native,'qf11770_');const failNames=(await failDB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).results;
  if(!failNames.length){const batch=failDB.batch.bind(failDB);failDB.batch=s=>batch([...s,failDB.prepare('INSERT INTO missing_restore_probe VALUES(1)')]);let rejected=false;
   try{await cqaRestore.restoreDisposable(failDB,backup,{purpose})}catch{rejected=true}
   cqaNeed(rejected&&(await failDB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()).results.length===0,'QA_RESTORE_ROLLBACK');failDB.batch=batch;
  }
  await cqaRestore.restoreDisposable(failDB,backup,{purpose});
  checks.push('Respaldo, restauración, rollback y reintento en D1 aislado: aprobado','Restauración de envío interrumpido sin reenvío: aprobado');return {...state,phase,checks,counts:r.counts};
 }
 throw Object.assign(Error('QA_PHASE'),{qaCode:'QA_PHASE',status:400});
}
async function cqaMail(env,state){
 cqaNeed(state.phase===3,'QA_SYNTHETIC_FIRST');cqaNeed(/^[A-Za-z0-9._-]{32,512}$/.test(env.BREVO_API_KEY||'')&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.BREVO_QA_RECIPIENT||''),'QA_MAIL_CONFIGURATION');
 const core=cqaCoreEnv(env),body={...cqaEvent('qa11770-mail-reference','QA Cartelera 11770 · Aviso de publicación'),contacto_email:env.BREVO_QA_RECIPIENT};
 const published=await cqaCall(core,'eventos','POST',body);cqaNeed(published.status===200,'QA_MAIL_EVENT');
 let diagnostic=state.mail_diagnostic||null;
 await uadavCarteleraNotices.dispatch(core.DB,async n=>{
  const id=String(n.payload?.payload?.id||'');cqaNeed(/^[-A-Za-z0-9_]{1,120}$/.test(id),'QA_MAIL_EVENT_ID');
  const current=await core.DB.prepare('SELECT status FROM events WHERE id=?').bind(id).first();if(current?.status!=='published')return {skipped:true};
  const title=String(n.payload?.payload?.titulo||'Evento').slice(0,180);
  const body=JSON.stringify({sender:{email:'acceso@correo-staging.uadavstream.com.ar',name:'UADAV STREAM · staging'},to:[{email:n.to}],headers:{idempotencyKey:n.id},subject:'Cartelera · '+title,textContent:'Tu evento está publicado.\n'+title+'\nhttps://uadav-stream-staging.pages.dev/evento.html?id='+encodeURIComponent(id)});
  return uadavAccountEmail.uadavBrevoRequest({mode:'staging-only',apiKey:env.BREVO_API_KEY,body,fetchImpl:async request=>{
   const response=await fetch(request);diagnostic={http_status:response.status,provider_code:'unavailable',reason:'unknown'};
   if(response.status!==201){
    const reader=response.clone().body?.getReader();let bytes=0,chunks=[];
    if(reader)try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>8192)break;chunks.push(part.value)}if(bytes<=8192){const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length}const data=JSON.parse(new TextDecoder().decode(buffer));
     const allowed=['invalid_parameter','missing_parameter','unauthorized','permission_denied','not_enough_credits','duplicate_parameter','account_under_validation','document_not_found','method_not_allowed'];if(allowed.includes(data.code))diagnostic.provider_code=data.code;
     const message=String(data.message||'').toLowerCase();diagnostic.reason=/idempotenc/.test(message)?'idempotency':/sender|exp.diteur|remitente/.test(message)?'sender':/unrecogni[sz]ed|whitelist|ip address|unauthori[sz]ed ip/.test(message)?'ip_authorization':/htmlcontent|textcontent|content|subject/.test(message)?'message_content':/recipient|email address|email is/.test(message)?'recipient':/api.key|authentication/.test(message)?'authentication':/activat|validat|suspend|account/.test(message)?'account_status':'unknown';
    }}catch{}finally{if(reader)await reader.cancel().catch(()=>{})}
   }else diagnostic.reason='accepted';return response;
  }});
 },{allowedRecipient:env.BREVO_QA_RECIPIENT});
 const row=await core.DB.prepare("SELECT d.state,d.error_code,d.attempts,d.next_at FROM event_notification_dispatch d JOIN notifications n ON n.id=d.notification_id WHERE n.id=?").bind('N-EVENT-'+published.body.id+'-event_published').first();
 return {...state,mail_attempted:true,provider_accepted:row?.state==='accepted',mail_state:row?.state||'not_confirmed',mail_diagnostic:diagnostic,mail_error_code:row?.error_code||null,mail_attempts:row?.attempts||0,mail_retry_after:row?.next_at?new Date(row.next_at).toISOString():null};
}
function cqaReport(state){return{scope:'cartelera-isolated-11770',version:'11770-cartelera-qa-1',core_sha256:CQA_CORE_SHA,phase:state?.phase||0,phases:3,synthetic_complete:state?.phase===3,complete:state?.phase===3&&state?.provider_accepted===true&&state?.real_email_received===true,checks:state?.checks||[],counts:state?.counts||null,mail_attempted:state?.mail_attempted===true,provider_accepted:state?.provider_accepted===true,mail_state:state?.mail_state||'not_sent',real_email_received:state?.real_email_received===true,receipt_confirmation:state?.real_email_received?'operator':'pending',operational_routes_exposed:false,mail_diagnostic:state?.mail_diagnostic||null,mail_error_code:state?.mail_error_code||null,mail_attempts:state?.mail_attempts||0,mail_retry_after:state?.mail_retry_after||null}}
const cqaWorker={async scheduled(){return{executed:false,reason:'isolated-qa-only'}},async fetch(request,env){
 const url=new URL(request.url),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},reply=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers});
 if(url.hostname!==CQA_HOST||url.search)return reply({error:'QA_HOST'},403);
 if(request.method==='GET'&&url.pathname==='/health')return reply({ok:true,version:'11770-cartelera-qa-1',purpose:CQA_PURPOSE,core_sha256:CQA_CORE_SHA,enabled:env.CARTELERA_QA_ONLY==='true',database_bound:!!env.DB,operational_routes_exposed:false});
 if(request.method==='GET'&&url.pathname==='/'){
  const nonce=crypto.randomUUID().replaceAll('-','');return new Response(CQA_HTML.replaceAll('%%NONCE%%',nonce),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'Referrer-Policy':'no-referrer'}});
 }
 if(!['/api/qa/status','/api/qa/step','/api/qa/mail','/api/qa/received'].includes(url.pathname))return reply({error:'Ruta no disponible en el laboratorio.'},404);
 let row,owner,keyHash;
 try{
  cqaNeed(!request.headers.get('Origin')||request.headers.get('Origin')===url.origin,'QA_ORIGIN',403);cqaNeed(env.CARTELERA_QA_ONLY==='true'&&env.DB&&typeof env.CARTELERA_QA_KEY==='string'&&env.CARTELERA_QA_KEY.length>=32,'QA_CONFIGURATION');cqaNeed(request.headers.get('Authorization')==='Bearer '+env.CARTELERA_QA_KEY,'QA_UNAUTHORIZED',401);
  keyHash=await cqaHash(env.CARTELERA_QA_KEY);
  if(url.pathname==='/api/qa/status'&&request.method==='GET'){row=await cqaGuard(env.DB,keyHash);return reply({...cqaReport(row?JSON.parse(row.state_json):null),mail_configured:!!env.BREVO_API_KEY&&!!env.BREVO_QA_RECIPIENT})}
  cqaNeed(request.method==='POST','QA_METHOD',405);const raw=await request.text();cqaNeed(raw.length<2048,'QA_BODY',413);let body;try{body=JSON.parse(raw)}catch{cqaNeed(false,'QA_BODY',400)}
  cqaNeed(url.pathname!=='/api/qa/mail'||body.confirm==='SEND_ONE_CARTELERA_QA_EMAIL','QA_MAIL_CONFIRM',400);cqaNeed(url.pathname!=='/api/qa/received'||body.confirm==='I_RECEIVED_CARTELERA_QA_EMAIL','QA_RECEIPT_CONFIRM',400);
  row=await cqaGuard(env.DB,keyHash,true);let state=JSON.parse(row.state_json);
  if(url.pathname==='/api/qa/step'){cqaNeed(Number.isInteger(body.phase)&&body.phase>=1&&body.phase<=3,'QA_PHASE',400);if(body.phase<=state.phase)return reply(cqaReport(state));cqaNeed(body.phase===state.phase+1,'QA_PHASE_ORDER',409)}
  owner=crypto.randomUUID();const locked=await env.DB.prepare('UPDATE cartelera_qa_guard SET lease_owner=?,lease_until=? WHERE id=1 AND lease_until<=?').bind(owner,Date.now()+120000,Date.now()).run();cqaNeed(Number(locked.meta?.changes)===1,'QA_RUNNING',409);
  state=JSON.parse((await env.DB.prepare('SELECT state_json FROM cartelera_qa_guard WHERE id=1 AND lease_owner=?').bind(owner).first()).state_json);
  if(url.pathname==='/api/qa/step'){if(body.phase>state.phase)state=await cqaPhase(env.DB,env,body.phase,state)}
  else if(url.pathname==='/api/qa/mail')state=await cqaMail(env,state);
  else {cqaNeed(state.provider_accepted===true,'QA_PROVIDER_NOT_CONFIRMED',409);state={...state,real_email_received:true,operator_confirmed_at:new Date().toISOString()}}
  const saved=await env.DB.prepare('UPDATE cartelera_qa_guard SET state_json=?,lease_owner=NULL,lease_until=0 WHERE id=1 AND lease_owner=?').bind(JSON.stringify(state),owner).run();cqaNeed(Number(saved.meta?.changes)===1,'QA_RESULT_LOST');owner=null;return reply(cqaReport(state));
 }catch(e){if(owner&&env.DB)try{await env.DB.prepare('UPDATE cartelera_qa_guard SET lease_owner=NULL,lease_until=0 WHERE id=1 AND lease_owner=?').bind(owner).run()}catch{}return reply({error:e.qaCode||'QA_STEP_UNCONFIRMED',retry_by_status:true},e.status||503)}
}};
export default cqaWorker;
