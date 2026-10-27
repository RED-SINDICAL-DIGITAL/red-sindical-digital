/* Separate, synthetic extension of the already approved Bolsa laboratory.
 * Preserves its eight-phase history. No real provider secret, email or network.
 * The operational Worker and its public recovery endpoints are not changed. */
const MAIL_LAB_PURPOSE='UADAV_MAIL_RECOVERY_LAB_11766_1';
const MAIL_LAB_TO='qa-mail@example.invalid',MAIL_LAB_KEY='synthetic-mail-lab-key-'+'x'.repeat(48);
const MAIL_LAB_IDS=[[],['01'],['02'],['03'],['04-A','04-B'],['05-A','05-B','05-C','05-D'],['06-A','06-B'],[]].map(ids=>ids.map(s=>'JOB-QA-MAIL-'+s));
const MAIL_LAB_ALL=MAIL_LAB_IDS.flat(),MAIL_LAB_COUNTS=[0,2,2,2,4,4,4,1];
const MAIL_LAB_LABELS=['','Solicitud cifrada y mensaje inmutable','Respuesta perdida y enlace recibido','Canje concurrente: una sola credencial','Rollback y respuesta perdida del canje','Cambios de contacto, revocación y vencimiento','Reintentos idénticos y cambio de clave del proveedor','Integridad final y aislamiento del laboratorio'];
UADAV_BOLSA_LAB_TABLES.push('job_recovery_outbox','qa_mail_guard','qa_mail_attempts','qa_mail_messages');
const mailCheck=(value,code,status=409)=>uadavBolsaLabCheck(value,'MAIL_LAB_'+code,status);
const mailReply=(data,status=200)=>uadavBolsaLabReply({...UADAV_MAIL_LAB_METADATA,...data},status);
function mailDB(native,counter={used:0}){
 const spend=n=>mailCheck((counter.used+=n)<=48,'QUERY_BUDGET',503);
 const statement=value=>({_native:value,bind(...args){return statement(value.bind(...args))},first(...args){spend(1);return value.first(...args)},all(){spend(1);return value.all()},run(){spend(1);return value.run()}});
 return{prepare:sql=>statement(native.prepare(sql)),withSession:mode=>mailDB(typeof native.withSession==='function'?native.withSession(mode):native,counter),batch(statements){spend(statements.length);return native.batch(statements.map(s=>s._native))},queries:()=>counter.used};
}
async function mailBase(db,secretHash){
 const original='SELECT collection,id,data_json,request_id FROM job_store_records LIMIT 7';
 const view={...db,prepare:sql=>db.prepare(sql===original?"SELECT collection,id,data_json,request_id FROM job_store_records WHERE substr(id,1,12)<>'JOB-QA-MAIL-' LIMIT 7":sql)};
 const base=await uadavBolsaLabState(view,secretHash);mailCheck(!base.empty&&base.phase===8&&JSON.stringify(JSON.parse(base.messages))===JSON.stringify(UADAV_BOLSA_LAB_LABELS.slice(1).map(x=>x+': aprobado')),'APPROVED_BOLSA_DB_REQUIRED',423);
 const rows=(await db.prepare("SELECT collection,id,data_json FROM job_store_records WHERE substr(id,1,12)='JOB-QA-MAIL-' LIMIT 12").all()).results;
 mailCheck(rows.length<=MAIL_LAB_ALL.length&&rows.every(r=>{let x;try{x=JSON.parse(r.data_json)}catch{return false}return MAIL_LAB_ALL.includes(r.id)&&r.collection==='bolsa_trabajo'&&x.id===r.id&&x.titulo==='LAB CORREO FICTICIO · '+r.id&&x.activo===false&&[MAIL_LAB_TO,'changed-qa@example.invalid'].includes(x.contacto)}),'FOREIGN_MAIL_RECORD',423);
 const tables=await uadavBolsaLabTables(db);
 if(tables.includes('job_recovery_outbox')){const rows=(await db.prepare('SELECT job_id FROM job_recovery_outbox LIMIT 12').all()).results;mailCheck(rows.length<=MAIL_LAB_ALL.length&&rows.every(r=>MAIL_LAB_ALL.includes(r.job_id)),'FOREIGN_OUTBOX',423);const columns=(await db.prepare('PRAGMA table_info(job_recovery_outbox)').all()).results.map(r=>r.name);mailCheck(columns.includes('redeemed_at')&&columns.includes('redeemed_secret_hash'),'SCHEMA_VERSION',423)}
 if(tables.includes('qa_mail_messages')){const rows=(await db.prepare('SELECT job_id,body FROM qa_mail_messages LIMIT 12').all()).results;mailCheck(rows.length<=MAIL_LAB_ALL.length&&rows.every(r=>{try{const b=JSON.parse(r.body);return MAIL_LAB_ALL.includes(r.job_id)&&b.to?.length===1&&b.to[0].email===MAIL_LAB_TO&&!b.cc&&!b.bcc&&!b.attachment}catch{return false}}),'FOREIGN_MAILBOX',423)}
 return base;
}
async function mailState(db,base,secretHash){
 const tables=await uadavBolsaLabTables(db);if(!tables.includes('qa_mail_guard'))return{initialized:false,phase:0,messages:'[]',base};
 const row=await db.prepare('SELECT * FROM qa_mail_guard WHERE purpose=?').bind(MAIL_LAB_PURPOSE).first();
 mailCheck(row&&row.secret_hash===secretHash&&row.base_seed===base.seed,'DATABASE_IDENTITY',423);
 return{...row,initialized:true,needs_reset:row.mail_hash!==UADAV_MAIL_LAB_METADATA.mail_sha256,base};
}
function mailStatus(state){return{ok:true,initialized:state.initialized,needs_reset:!!state.needs_reset,phase:state.phase,complete:state.initialized&&!state.needs_reset&&state.phase===7,messages:JSON.parse(state.messages),next:state.phase<7?{phase:state.phase+1,slots:MAIL_LAB_COUNTS[state.phase+1],parallel:state.phase+1===3}:null,emails_sent:0,recovery_enabled:false};}
async function mailSetup(db,base,phase){
 const statements=[];
 for(const id of MAIL_LAB_IDS[phase]){
  statements.push(db.prepare("INSERT OR IGNORE INTO job_store_records(collection,id,data_json,updated_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,JSON.stringify({id,titulo:'LAB CORREO FICTICIO · '+id,contacto:MAIL_LAB_TO,activo:false}),new Date().toISOString()));
  statements.push(db.prepare('INSERT OR IGNORE INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,1,?)').bind(id,await uadavDigest('mail-old:'+base.seed+':'+id),new Date().toISOString()));
  statements.push(db.prepare("INSERT OR IGNORE INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,base.fixture.accountA,new Date().toISOString()));
 }
 if(statements.length)await db.batch(statements);
}
async function mailContext(db,base,id,{clock=Date.now,sender='acceso@correo-staging.uadavstream.com.ar',rotate=false,response='accepted',prepareHook}={}){
 const fetchImpl=async request=>{
  mailCheck(request.url==='https://api.brevo.com/v3/smtp/email'&&request.headers.get('api-key')===(rotate?MAIL_LAB_KEY.replaceAll('x','z'):MAIL_LAB_KEY),'FAKE_TRANSPORT');
  const body=await request.text(),parsed=JSON.parse(body);mailCheck(parsed.to?.length===1&&parsed.to[0].email===MAIL_LAB_TO,'REAL_RECIPIENT_BLOCKED',423);
  const prior=await db.prepare('SELECT body FROM qa_mail_messages WHERE job_id=?').bind(id).first();mailCheck(!prior||prior.body===body,'MESSAGE_CHANGED');
  if(!prior)await db.prepare('INSERT INTO qa_mail_messages(job_id,body) VALUES(?,?)').bind(id,body).run();
  if(response==='lost')throw Error('Synthetic receipt loss');
  if(response==='duplicate')return Response.json({code:'duplicate_parameter'},{status:400});
  return Response.json({messageId:'<'+id+'@relay.example.invalid>'},{status:201});
 };
 const adapter=uadavMailCore.createBrevoStagingMail({mode:'staging-only',apiKey:rotate?MAIL_LAB_KEY.replaceAll('x','z'):MAIL_LAB_KEY,senderEmail:sender,allowedRecipients:[MAIL_LAB_TO],clock,fetchImpl});
 const encryptionKey=await uadavDigest('mail-lab-encryption:'+base.seed),actorHash=await uadavDigest('mail-lab-actor:'+base.seed+':'+id),h=await uadavDigest('mail-lab-request:'+base.seed+':'+id);
 const requestId=h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32);
 const engine=uadavMailCore.createJobRecoveryOutbox({db,encryptionKey,mode:'staging-only',clock,prepareDelivery:prepareHook?async p=>{await prepareHook(p);return adapter.prepare(p)}:adapter.prepare});
 const enqueue=()=>engine.enqueue({jobId:id,recipient:MAIL_LAB_TO,requestId,actorHash});
 const token=async()=>{const row=await db.prepare('SELECT body FROM qa_mail_messages WHERE job_id=?').bind(id).first();mailCheck(row,'FAKE_MESSAGE_MISSING');const link=JSON.parse(row.body).textContent.match(/https:\/\/[^\s]+/)[0];return new URLSearchParams(new URL(link).hash.slice(1)).get('token')};
 const credential=()=>db.prepare('SELECT secret_hash,revision FROM job_owner_credentials WHERE job_id=?').bind(id).first();
 const outbox=()=>db.prepare('SELECT * FROM job_recovery_outbox WHERE job_id=? ORDER BY created_at DESC LIMIT 1').bind(id).first();
 const nextHash=label=>uadavDigest('mail-next:'+base.seed+':'+id+':'+label);
 const redeem=async label=>engine.redeem({jobId:id,token:await token(),newSecretHash:await nextHash(label)});
 return{adapter,engine,enqueue,token,credential,outbox,nextHash,redeem};
}
async function mailPrime(db,base,id,options){const context=await mailContext(db,base,id,options);await context.enqueue();await context.engine.dispatch(context.adapter);return context;}
async function mailProbe(db,base,phase,slot){
 const id=MAIL_LAB_IDS[phase][phase===4||phase===6?Math.floor(slot/2):phase===5?slot:0];
 if(phase===1&&slot===0){let raw;const c=await mailContext(db,base,id,{prepareHook:p=>{raw=p.token}});await c.enqueue();const row=await c.outbox();mailCheck(!row.sealed_payload.includes(raw)&&!row.sealed_payload.includes(MAIL_LAB_TO),'PLAINTEXT');let rejected=false;try{await c.engine.redeem({jobId:id,token:raw,newSecretHash:await c.nextHash('one')})}catch(e){rejected=e.code==='JOB_RECOVERY_INPUT'}mailCheck(rejected,'EARLY_PROOF');await c.engine.dispatch(c.adapter);mailCheck((await c.credential()).revision===1,'EARLY_ROTATION');return{passed:true};}
 if(phase===1&&slot===1){const c=await mailContext(db,base,id);mailCheck((await c.redeem('one')).revision===2,'PROOF_REDEMPTION');return{passed:true};}
 if(phase===2&&slot===0){const c=await mailPrime(db,base,id,{response:'lost'});mailCheck((await c.outbox()).state==='queued'&&(await c.credential()).revision===1,'LOST_RECEIPT_ACCESS');return{passed:true};}
 if(phase===2&&slot===1){const c=await mailContext(db,base,id);mailCheck((await c.redeem('one')).revision===2&&(await c.outbox()).state==='redeemed','LOST_RECEIPT_PROOF');return{passed:true};}
 if(phase===3){const c=await mailContext(db,base,id);try{await c.redeem('race-'+slot);return{passed:true,http_status:200}}catch(e){mailCheck(e.code==='JOB_RECOVERY_INPUT','RACE_ERROR');return{passed:true,http_status:400}}}
 if(phase===4&&slot%2===0){await mailPrime(db,base,id);return{passed:true};}
 if(phase===4){const c=await mailContext(db,base,id),lost=slot===3;let fired=false;
  const broken={prepare:sql=>db.prepare(sql),withSession(){return this},async batch(statements){if(!fired){fired=true;if(lost){await db.batch(statements);throw Error('Synthetic lost commit acknowledgement')}return db.batch([...statements,db.prepare('INSERT INTO job_store_checks(id,valid) VALUES(?,0)').bind(crypto.randomUUID())])}return db.batch(statements)}};
  // Construct after the message exists; only redeem uses this injected batch.
  const engine=uadavMailCore.createJobRecoveryOutbox({db:broken,encryptionKey:await uadavDigest('mail-lab-encryption:'+base.seed),mode:'staging-only'}),request={jobId:id,token:await c.token(),newSecretHash:await c.nextHash('rollback')};
  if(lost){mailCheck((await engine.redeem(request)).replayed===true,'LOST_COMMIT_RECONCILE');mailCheck((await c.credential()).revision===2,'LOST_COMMIT_DOUBLE_ROTATION')}
  else{let rejected=false;try{await engine.redeem(request)}catch(e){rejected=e.code==='JOB_RECOVERY_COMMIT'}mailCheck(rejected&&(await c.credential()).revision===1&&(await c.outbox()).state==='accepted','ROLLBACK');await c.engine.redeem(request);mailCheck((await c.credential()).revision===2,'ROLLBACK_RETRY')}
  return{passed:true};
 }
 if(phase===5){const c=await mailPrime(db,base,id);let engine=c.engine;
  if(slot===0)await db.prepare("UPDATE job_store_records SET revision=revision+1,data_json=json_set(data_json,'$.contacto','changed-qa@example.invalid') WHERE id=?").bind(id).run();
  if(slot===1)await db.prepare('UPDATE job_owner_credentials SET revision=revision+1 WHERE job_id=?').bind(id).run();
  if(slot===2){const row=await c.outbox();engine=(await mailContext(db,base,id,{clock:()=>row.expires_at})).engine;}
  let rejected=false;try{await engine.redeem({jobId:slot===3?'JOB-QA-MAIL-01':id,token:await c.token(),newSecretHash:await c.nextHash('stale')})}catch(e){rejected=e.code==='JOB_RECOVERY_INPUT'}mailCheck(rejected,'STALE_PROOF');return{passed:true};
 }
 if(phase===6&&slot%2===0){await mailPrime(db,base,id,{response:'lost'});return{passed:true};}
 if(phase===6){const prior=await db.prepare('SELECT created_at FROM job_recovery_outbox WHERE job_id=?').bind(id).first(),rotate=slot===3;const c=await mailContext(db,base,id,{clock:()=>prior.created_at+5000,sender:'nuevo@correo-staging.uadavstream.com.ar',rotate,response:'duplicate'});const result=await c.engine.dispatch(c.adapter);mailCheck(result.state==='unconfirmed','RETRY_STATE');const row=await c.outbox();mailCheck(row.attempts===2,'RETRY_ATTEMPTS');await c.redeem('retry');mailCheck((await c.credential()).revision===2,'RETRY_RECEIVED_PROOF');return{passed:true,context_rotation_blocked:rotate};}
 mailCheck(phase===7,'PHASE');mailCheck((await db.prepare('PRAGMA foreign_key_check').all()).results.length===0,'FOREIGN_KEYS');mailCheck(Object.values(await db.prepare('PRAGMA quick_check').first())[0]==='ok','INTEGRITY');mailCheck((await db.prepare('SELECT COUNT(*) AS n FROM job_store_checks').first()).n===0,'CHECKS_REMAIN');return{passed:true};
}
const uadavMailLabWorker={async fetch(request,env){
 try{
  const url=new URL(request.url);mailCheck(url.origin==='https://uadav-bolsa-lab.uadavstream.workers.dev','HOST_ONLY',403);
  if(request.method==='GET'&&url.pathname==='/'){const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');return new Response(UADAV_MAIL_LAB_HTML.replaceAll('%%NONCE%%',nonce),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"}})}
  if(request.method==='GET'&&url.pathname==='/health')return mailReply({ok:true,purpose:UADAV_MAIL_LAB_METADATA.scope,enabled:env.QA_BOLSA_ONLY==='true',database_bound:!!env.DB,emails_sent:0,recovery_enabled:false});
  mailCheck(request.method==='POST'&&!url.search&&['/mail/status','/mail/initialize','/mail/prepare','/mail/probe','/mail/finish'].includes(url.pathname),'ROUTE',404);
  mailCheck(!request.headers.get('Origin')||request.headers.get('Origin')===url.origin,'ORIGIN',403);
  const secretHash=await uadavBolsaLabAuth(request,env);mailCheck(env.QA_BOLSA_ONLY==='true'&&env.DB,'CONFIGURATION',503);
  mailCheck(/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''),'BODY',400);const body=await uadavSecurityJSON(request,256).catch(()=>null);mailCheck(body&&typeof body==='object'&&!Array.isArray(body),'BODY',400);
  const native=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB,db=mailDB(native),base=await mailBase(db,secretHash),state=await mailState(db,base,secretHash);
  if(url.pathname==='/mail/status'){mailCheck(Object.keys(body).length===0,'BODY',400);return mailReply(mailStatus(state));}
  mailCheck(body.confirm==='PRUEBAS_FICTICIAS_CORREO','CONFIRMATION',412);
  if(url.pathname==='/mail/initialize'){
   mailCheck(Object.keys(body).length===1,'BODY',400);if(state.initialized)return mailReply(mailStatus(state));
   const placeholders=UADAV_BOLSA_LAB_TABLES.map(()=>'?').join(',');
   const guard="EXISTS(SELECT 1 FROM qa_bolsa_guard WHERE purpose=? AND secret_hash=? AND core_hash=? AND seed=? AND phase=8) AND NOT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' AND substr(name,1,4)<>'_cf_' AND name NOT IN ("+placeholders+")) AND (SELECT COUNT(*) FROM audience_accounts)=2 AND NOT EXISTS(SELECT 1 FROM audience_accounts WHERE id NOT IN (?,?))";
   await db.batch([...uadavJobGuard(db,guard,[UADAV_BOLSA_LAB_PURPOSE,secretHash,UADAV_BOLSA_LAB_CORE_SHA256,base.seed,...UADAV_BOLSA_LAB_TABLES,base.fixture.accountA,base.fixture.accountB]),...UADAV_MAIL_LAB_SCHEMA.map(sql=>db.prepare(sql)),
    db.prepare("CREATE TABLE IF NOT EXISTS qa_mail_guard(purpose TEXT PRIMARY KEY,secret_hash TEXT NOT NULL,base_seed TEXT NOT NULL,mail_hash TEXT NOT NULL,phase INTEGER NOT NULL DEFAULT 0 CHECK(phase BETWEEN 0 AND 7),prepared INTEGER NOT NULL DEFAULT 0,messages TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(messages)),lease_until INTEGER NOT NULL DEFAULT 0,owner TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS qa_mail_attempts(phase INTEGER NOT NULL,slot INTEGER NOT NULL,state TEXT NOT NULL CHECK(state IN ('pending','done')),owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0,data_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(data_json)),PRIMARY KEY(phase,slot))"),
    db.prepare('CREATE TABLE IF NOT EXISTS qa_mail_messages(job_id TEXT PRIMARY KEY,body TEXT NOT NULL CHECK(json_valid(body)))'),
    db.prepare('INSERT OR IGNORE INTO qa_mail_guard(purpose,secret_hash,base_seed,mail_hash) VALUES(?,?,?,?)').bind(MAIL_LAB_PURPOSE,secretHash,base.seed,UADAV_MAIL_LAB_METADATA.mail_sha256)]);
   return mailReply(mailStatus(await mailState(db,base,secretHash)));
  }
  mailCheck(state.initialized&&!state.needs_reset,'MODULE_IDENTITY',423);
  const phase=body.phase;mailCheck(Number.isInteger(phase)&&phase>=1&&phase<=7,'PHASE',400);
  if(phase<=state.phase)return mailReply(mailStatus(state));mailCheck(phase===state.phase+1,'PHASE_ORDER');
  if(url.pathname==='/mail/prepare'){
   mailCheck(Object.keys(body).length===2,'BODY',400);if(state.prepared===phase)return mailReply(mailStatus(state));
   const owner=crypto.randomUUID(),lock=await db.prepare('UPDATE qa_mail_guard SET owner=?,lease_until=? WHERE purpose=? AND phase=? AND lease_until<=?').bind(owner,Date.now()+60000,MAIL_LAB_PURPOSE,state.phase,Date.now()).run();mailCheck(lock.meta?.changes===1,'PREPARE_BUSY');
   try{await mailSetup(db,base,phase);if(phase===3)await mailPrime(db,base,MAIL_LAB_IDS[3][0]);const saved=await db.prepare('UPDATE qa_mail_guard SET prepared=? WHERE purpose=? AND owner=?').bind(phase,MAIL_LAB_PURPOSE,owner).run();mailCheck(saved.meta?.changes===1,'PREPARE_UNCONFIRMED')}finally{await db.prepare('UPDATE qa_mail_guard SET lease_until=0,owner=NULL WHERE purpose=? AND owner=?').bind(MAIL_LAB_PURPOSE,owner).run()}
   return mailReply(mailStatus({...state,prepared:phase}));
  }
  mailCheck(state.prepared===phase,'NOT_PREPARED');
  if(url.pathname==='/mail/probe'){
   const slot=body.slot;mailCheck(Object.keys(body).length===3&&Number.isInteger(slot)&&slot>=0&&slot<MAIL_LAB_COUNTS[phase],'SLOT',400);
   if(phase!==3&&slot>0)mailCheck((await db.prepare("SELECT state FROM qa_mail_attempts WHERE phase=? AND slot=?").bind(phase,slot-1).first())?.state==='done','SLOT_ORDER');
   const prior=await db.prepare('SELECT * FROM qa_mail_attempts WHERE phase=? AND slot=?').bind(phase,slot).first();if(prior?.state==='done')return mailReply({ok:true,result:JSON.parse(prior.data_json)});
   mailCheck(!prior||prior.lease_until<=Date.now(),'PROBE_BUSY');const owner=crypto.randomUUID();
   const claim=await db.prepare("INSERT INTO qa_mail_attempts(phase,slot,state,owner,lease_until) VALUES(?,?,'pending',?,?) ON CONFLICT(phase,slot) DO UPDATE SET owner=excluded.owner,lease_until=excluded.lease_until WHERE qa_mail_attempts.state='pending' AND qa_mail_attempts.lease_until<=?").bind(phase,slot,owner,Date.now()+30000,Date.now()).run();mailCheck(claim.meta?.changes===1,'PROBE_BUSY');
   try{const result=await mailProbe(db,base,phase,slot);const saved=await db.prepare("UPDATE qa_mail_attempts SET state='done',data_json=?,owner=NULL,lease_until=0 WHERE phase=? AND slot=? AND owner=?").bind(JSON.stringify(result),phase,slot,owner).run();mailCheck(saved.meta?.changes===1,'PROBE_UNCONFIRMED');return mailReply({ok:true,result,queries_used:db.queries()})}finally{await db.prepare("UPDATE qa_mail_attempts SET owner=NULL,lease_until=0 WHERE phase=? AND slot=? AND owner=? AND state='pending'").bind(phase,slot,owner).run()}
  }
  mailCheck(Object.keys(body).length===2,'BODY',400);const attempts=(await db.prepare('SELECT * FROM qa_mail_attempts WHERE phase=? ORDER BY slot').bind(phase).all()).results;
  mailCheck(attempts.length===MAIL_LAB_COUNTS[phase]&&attempts.every(r=>r.state==='done'&&JSON.parse(r.data_json).passed===true),'PHASE_INCOMPLETE');
  if(phase===3){const results=attempts.map(r=>JSON.parse(r.data_json));mailCheck(results.filter(r=>r.http_status===200).length===1&&results.filter(r=>r.http_status===400).length===1,'SINGLE_REDEMPTION');const row=await db.prepare('SELECT revision FROM job_owner_credentials WHERE job_id=?').bind(MAIL_LAB_IDS[3][0]).first();mailCheck(row?.revision===2,'DOUBLE_ROTATION')}
  const owner=crypto.randomUUID(),lock=await db.prepare('UPDATE qa_mail_guard SET owner=?,lease_until=? WHERE purpose=? AND phase=? AND lease_until<=?').bind(owner,Date.now()+60000,MAIL_LAB_PURPOSE,state.phase,Date.now()).run();mailCheck(lock.meta?.changes===1,'FINISH_BUSY');
  try{const messages=[...JSON.parse(state.messages),MAIL_LAB_LABELS[phase]+': aprobado'];const saved=await db.prepare('UPDATE qa_mail_guard SET phase=?,messages=? WHERE purpose=? AND owner=? AND phase=?').bind(phase,JSON.stringify(messages),MAIL_LAB_PURPOSE,owner,state.phase).run();mailCheck(saved.meta?.changes===1,'PHASE_UNCONFIRMED');return mailReply(mailStatus({...state,phase,messages:JSON.stringify(messages)}))}finally{await db.prepare('UPDATE qa_mail_guard SET owner=NULL,lease_until=0 WHERE purpose=? AND owner=?').bind(MAIL_LAB_PURPOSE,owner).run()}
 }catch(error){return mailReply({ok:false,error:/^(?:MAIL_LAB|LAB)_[A-Z_]{1,70}$/.test(error?.labCode||'')?error.labCode:'MAIL_LAB_STORAGE',message:'No se confirmó la comprobación. Volvé a entrar para consultar el estado antes de reintentar.'},error?.labStatus||503)}
}};
export default uadavMailLabWorker;
