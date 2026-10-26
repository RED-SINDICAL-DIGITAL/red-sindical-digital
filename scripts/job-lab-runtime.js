/* Appended to the immutable 11764 core. No platform route is exposed here.
 * Every operation uses the separately guarded disposable DB and fake accounts.
 * Browser probes are separate HTTP requests, coordinated through that DB. */
const UADAV_BOLSA_LAB_PURPOSE='UADAV_BOLSA_SYNTHETIC_LAB_11764_1';
const UADAV_BOLSA_LAB_COUNTS=[0,2,2,9,2,2,2,1,6];
const UADAV_BOLSA_LAB_PARALLEL=new Set([1,2,4,5,6,8]);
const UADAV_BOLSA_LAB_LABELS=['','Publicación simultánea sin duplicados','Postulación simultánea y consentimiento','Privacidad entre cuentas y perfil artístico','Comprobante anterior y vínculo concurrente','Revocación durante el guardado','Recuperación: un solo canje','Recuperación: rollback y reintento','Límite atómico e integridad final'];
function uadavBolsaLabCheck(ok,code,status=409){if(!ok)throw Object.assign(Error(code),{labCode:code,labStatus:status})}
function uadavBolsaLabReply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}})}
async function uadavBolsaLabAuth(request,env){
 const secret=String(env.QA_BOLSA_KEY||''),header=request.headers.get('Authorization')||'';
 uadavBolsaLabCheck(secret.length>=32&&secret.length<=256,'LAB_KEY_CONFIGURATION',503);
 uadavBolsaLabCheck(/^Bearer [^\r\n]{1,256}$/.test(header),'LAB_AUTH_REQUIRED',401);
 const expected=await uadavDigest(secret),actual=await uadavDigest(header.slice(7));let difference=0;
 for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^actual.charCodeAt(i);
 uadavBolsaLabCheck(difference===0,'LAB_AUTH_INVALID',401);return expected;
}
function uadavBolsaLabDB(native,hook=null,counter={used:0}){
 const spend=()=>{uadavBolsaLabCheck(++counter.used<=45,'LAB_QUERY_BUDGET',503)};
 function statement(value,sql){return {_native:value,sql,bind(...args){return statement(value.bind(...args),sql)},run(){spend();return value.run()},all(){spend();return value.all()},first(...args){spend();return value.first(...args)}}}
 return {prepare:sql=>statement(native.prepare(sql),sql),withSession:mode=>uadavBolsaLabDB(typeof native.withSession==='function'?native.withSession(mode):native,hook,counter),async batch(statements){if(hook)await hook(statements);spend();return native.batch(statements.map(s=>s._native))},queries:()=>counter.used};
}
async function uadavBolsaLabFixture(seed){
 const hash=label=>uadavDigest('bolsa-lab:'+seed+':'+label),a='UAC-'+await hash('A'),b='UAC-'+await hash('B');
 const requests={};for(const label of ['offer','application','spoof','device-denied','unconsented','extra-data']){const h=await hash('request:'+label);requests[label]=[h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20,32)].join('-')}
 return {a,b,accountA:await uadavDigest(a),accountB:await uadavDigest(b),device:'UAD-'+await hash('device'),legacyKey:await hash('legacy'),oldKey:await hash('old'),nextKey:await hash('next'),finalKey:await hash('final'),recoveryToken:await hash('token'),rollbackToken:await hash('rollback-token'),artistA:await hash('artistA'),artistB:await hash('artistB'),request:label=>requests[label]};
}
async function uadavBolsaLabTables(db){return (await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' AND substr(name,1,4)<>'_cf_' ORDER BY name").all()).results.map(x=>x.name)}
async function uadavBolsaLabState(db,secretHash){
 const tables=await uadavBolsaLabTables(db);if(!tables.length)return {empty:true,phase:0};
 uadavBolsaLabCheck(tables.includes('qa_bolsa_guard')&&tables.every(x=>UADAV_BOLSA_LAB_TABLES.includes(x)),'LAB_DATABASE_NOT_DISPOSABLE',423);
 const row=await db.prepare('SELECT * FROM qa_bolsa_guard WHERE purpose=?').bind(UADAV_BOLSA_LAB_PURPOSE).first();
 uadavBolsaLabCheck(row&&row.secret_hash===secretHash&&row.core_hash===UADAV_BOLSA_LAB_CORE_SHA256&&/^[a-f0-9-]{36}$/.test(row.seed),'LAB_DATABASE_IDENTITY',423);
 const fixture=await uadavBolsaLabFixture(row.seed),accounts=(await db.prepare('SELECT id FROM audience_accounts LIMIT 3').all()).results;
 uadavBolsaLabCheck(accounts.length===2&&accounts.every(x=>[fixture.accountA,fixture.accountB].includes(x.id)),'LAB_FOREIGN_ACCOUNTS',423);
 const records=(await db.prepare('SELECT collection,id,data_json,request_id FROM job_store_records LIMIT 7').all()).results;
 const allowed=new Set(['offer','application','spoof'].map(x=>fixture.request(x)));
 uadavBolsaLabCheck(records.length<=6&&records.every(x=>{
  const item=JSON.parse(x.data_json);
  if(['JOB-QA-LAB-LEGACY','JOB-QA-LAB-RECOVERY'].includes(x.id))return x.collection==='bolsa_trabajo'&&item.titulo==='LAB FICTICIA · '+x.id&&item.activo===false;
  return allowed.has(x.request_id)&&item.request_id===x.request_id&&(x.collection==='bolsa_trabajo'?item.titulo==='LAB FICTICIA · Publicación simultánea':item.nombre==='LAB Persona B'&&item.email==='qa-b@example.invalid');
 }),'LAB_FOREIGN_RECORDS',423);
 return {...row,fixture,empty:false};
}
function uadavBolsaLabEnv(db,fixture){
 const artists=[{id:'ART-LAB-A',nombre:'LAB Artista A',claimed:true},{id:'ART-LAB-B',nombre:'LAB Artista B',claimed:true}];
 return {DB:db,ADMIN_KEY:'synthetic-bolsa-lab-internal',ACCOUNT_ALLOWED_ORIGINS:'https://uadav-stream-staging.pages.dev',JOB_STORE_D1:'true',JOB_STORE_MAINTENANCE:'false',UADAV_DB:{async get(key){
  uadavBolsaLabCheck(!['bolsa_trabajo','postulaciones_trabajo'].includes(key),'LAB_UNEXPECTED_KV_JOB_READ',503);
  if(key==='artistas')return JSON.stringify(artists);
  for(const [token,artist_id,account_id] of [[fixture.artistA,'ART-LAB-A',fixture.accountA],[fixture.artistB,'ART-LAB-B',fixture.accountB]])if(key==='artist_access_'+token)return JSON.stringify({artist_id,account_id,account_credential_hash:account_id,expires:Date.now()+3600000});
  return null;
 },async put(key){uadavBolsaLabCheck(!['bolsa_trabajo','postulaciones_trabajo'].includes(key),'LAB_UNEXPECTED_KV_JOB_WRITE',503)}}};
}
async function uadavBolsaLabCall(db,fixture,route,method='GET',body,actor='none'){
 // Initialization installs the exact audience schema. The operational binding
 // retains this cache across requests; lab proxies are new for every probe.
 uadavAccountSchemas.set(db,Promise.resolve());
 const credential={a:fixture.a,b:fixture.b,device:fixture.device,admin:'synthetic-bolsa-lab-internal',none:''}[actor];
 uadavBolsaLabCheck(credential!==undefined,'LAB_ACTOR_INVALID',400);
 const request=new Request('https://uadav-api-staging.uadavstream.workers.dev/api/'+route,{method,headers:{Origin:'https://uadav-stream-staging.pages.dev','Content-Type':'application/json','CF-Connecting-IP':'203.0.113.117',...(credential?{Authorization:'Bearer '+credential}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 // Internal invocation, never a network request to the operational staging API.
 const result=await uadavStagingWorker.fetch(request,uadavBolsaLabEnv(db,fixture),{});return {status:result.status,data:await result.json(),headers:result.headers};
}
async function uadavBolsaLabRecord(db,fixture,label){const row=await db.prepare('SELECT id,data_json FROM job_store_records WHERE request_id=?').bind(fixture.request(label)).first();uadavBolsaLabCheck(row,'LAB_RECORD_MISSING');return {id:row.id,...JSON.parse(row.data_json)}}
async function uadavBolsaLabSignal(db,key){return !!await db.prepare('SELECT value FROM qa_bolsa_signals WHERE key=?').bind(key).first()}
async function uadavBolsaLabWait(db,key,kind='signal'){
 for(let i=0;i<10;i++){
  const ready=kind==='signal'?await uadavBolsaLabSignal(db,key):(await db.prepare('SELECT COUNT(*) AS n FROM qa_bolsa_attempts WHERE phase=?').bind(key).first()).n===UADAV_BOLSA_LAB_COUNTS[key];
  if(ready)return;await new Promise(resolve=>setTimeout(resolve,100));
 }
 uadavBolsaLabCheck(false,'LAB_RENDEZVOUS_TIMEOUT',409);
}
async function uadavBolsaLabProbe(db,state,phase,slot){
 const f=state.fixture;
 if(phase===1){
  const r=await uadavBolsaLabCall(db,f,'bolsa_trabajo','POST',{titulo:'LAB FICTICIA · Publicación simultánea',descripcion:'Prueba ficticia aislada, sin contratación real.',contacto:'qa-owner@example.invalid',request_id:f.request('offer'),save_to_account:true},'a');
  if(r.status===200){const row=await db.prepare('SELECT secret_hash FROM job_owner_credentials WHERE job_id=?').bind(r.data.item?.id||'').first();uadavBolsaLabCheck(row?.secret_hash===await uadavDigest(r.data.clave_contratante||''),'LAB_OWNER_PROOF_HASH');}
  return {http_status:r.status};
 }
 if(phase===2||phase===3&&slot===6){
  const job=await uadavBolsaLabRecord(db,f,'offer'),spoof=phase===3;
  const r=await uadavBolsaLabCall(db,f,'bolsa_trabajo/postular','POST',{job_id:job.id,nombre:'LAB Persona B',email:'qa-b@example.invalid',request_id:f.request(spoof?'spoof':'application'),save_to_account:true,consent_scope:'job_application_v1',consent_at:new Date().toISOString(),shared_fields:['nombre','email','artist_profile'],artist_token:spoof?f.artistA:f.artistB,artist_id:spoof?'ART-LAB-A':'ART-LAB-B',perfil_verificado:true},'b');
  if(spoof){
   uadavBolsaLabCheck([200,400,401,403].includes(r.status),'LAB_FOREIGN_ARTIST_STATUS');
   if(r.status===200){const item=await uadavBolsaLabRecord(db,f,'spoof');uadavBolsaLabCheck(!item.perfil_verificado&&!item.artist_id,'LAB_FOREIGN_ARTIST_LINK');}
   return {http_status:r.status,foreign_artist_rejected:true};
  }
  if(r.status===200){const item=await uadavBolsaLabRecord(db,f,'application');uadavBolsaLabCheck(item.perfil_verificado===true&&item.artist_id==='ART-LAB-B'&&item.consent_scope==='job_application_v1'&&!item.whatsapp&&!item.portfolio_url,'LAB_CONSENT_OR_ARTIST_SCOPE');}
  return {http_status:r.status};
 }
 if(phase===3){
  const job=await uadavBolsaLabRecord(db,f,'offer'),app=await uadavBolsaLabRecord(db,f,'application');
  if(slot===7||slot===8){const requestId=f.request(slot===7?'unconsented':'extra-data'),r=await uadavBolsaLabCall(db,f,'bolsa_trabajo/postular','POST',{job_id:job.id,nombre:'LAB Persona B',email:'qa-b@example.invalid',request_id:requestId,save_to_account:true,consent_at:new Date().toISOString(),shared_fields:['nombre','email'],...(slot===7?{}:{consent_scope:'job_application_v1',whatsapp:'+5493410000000'})},'b');uadavBolsaLabCheck(r.status===400&&!await db.prepare('SELECT id FROM job_store_records WHERE request_id=?').bind(requestId).first(),'LAB_UNCONSENTED_DATA_ACCEPTED');return {passed:true};}
  if(slot===0){for(const [actor,id,other] of [['a',job.id,app.id],['b',app.id,job.id]]){const r=await uadavBolsaLabCall(db,f,'bolsa_trabajo/cuenta','GET',undefined,actor);uadavBolsaLabCheck(r.status===200&&r.data.items.some(x=>x.id===id)&&!r.data.items.some(x=>x.id===other),'LAB_ACCOUNT_LIST_ISOLATION');}return {passed:true};}
  if(slot===1){const denied=await uadavBolsaLabCall(db,f,'bolsa_trabajo/mis-postulantes','POST',{job_id:job.id,cuenta:true},'b'),allowed=await uadavBolsaLabCall(db,f,'bolsa_trabajo/mis-postulantes','POST',{job_id:job.id,cuenta:true},'a');uadavBolsaLabCheck(denied.status===404&&allowed.status===200&&allowed.data.items.length===1&&!allowed.data.items[0].whatsapp,'LAB_INBOX_PRIVACY');return {passed:true};}
  if(slot===2){const denied=await uadavBolsaLabCall(db,f,'bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:job.id,cuenta:true,accion:'cerrar'},'b');uadavBolsaLabCheck(denied.status===404&&(await uadavBolsaLabRecord(db,f,'offer')).activo===true,'LAB_FOREIGN_CLOSE');return {passed:true};}
  if(slot===3||slot===4){const r=await uadavBolsaLabCall(db,f,'account/notifications','GET',undefined,slot===3?'a':'b');uadavBolsaLabCheck(r.status===200&&Array.isArray(r.data.items)&&(slot===3?r.data.items.some(x=>x.id==='announcement:job-application:'+app.id):r.data.items.length===0),'LAB_NOTIFICATION_PRIVACY');return {passed:true};}
  const denied=await uadavBolsaLabCall(db,f,'account/notifications','PATCH',{keys:['announcement:job-application:'+app.id]},'b');uadavBolsaLabCheck(denied.status===409,'LAB_FOREIGN_NOTIFICATION_ACK');return {passed:true};
 }
 if(phase===4){const r=await uadavBolsaLabCall(db,f,'bolsa_trabajo/cuenta/vincular','POST',{tipo:'oferta',id:'JOB-QA-LAB-LEGACY',clave:f.legacyKey,confirm:'VINCULAR_A_MI_CUENTA'},slot===0?'a':'b');return {http_status:r.status};}
 if(phase===5){
  if(slot===1){await uadavBolsaLabWait(db,'device-authenticated');await db.prepare('UPDATE audience_devices SET revoked_at=? WHERE credential_hash=?').bind(Date.now(),await uadavDigest(f.device)).run();await db.prepare("INSERT OR REPLACE INTO qa_bolsa_signals(key,value) VALUES('device-revoked',1)").run();return {revoked:true};}
  const hooked=uadavBolsaLabDB(db,async statements=>{if(statements.some(x=>/^INSERT INTO job_store_records\b/.test(x.sql))){await db.prepare("INSERT OR REPLACE INTO qa_bolsa_signals(key,value) VALUES('device-authenticated',1)").run();await uadavBolsaLabWait(db,'device-revoked');}});
  const r=await uadavBolsaLabCall(hooked,f,'bolsa_trabajo','POST',{titulo:'LAB FICTICIA · Revocación',descripcion:'Prueba aislada.',contacto:'qa-device@example.invalid',request_id:f.request('device-denied'),save_to_account:true},'device');return {http_status:r.status};
 }
 if(phase===6){
  try{await uadavJobRedeemRecovery(db,{jobId:'JOB-QA-LAB-RECOVERY',tokenHash:await uadavDigest(f.recoveryToken),newSecretHash:await uadavDigest(f.nextKey)});return {http_status:200};}
  catch(e){uadavBolsaLabCheck(e.jobCode==='JOB_RECOVERY_INVALID','LAB_RECOVERY_ERROR');return {http_status:e.status};}
 }
 if(phase===7){
  const now=Date.now(),tokenHash=await uadavDigest(f.rollbackToken),id='JOB-QA-LAB-RECOVERY';
  await db.batch([db.prepare('INSERT OR IGNORE INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,?,2,?,?)').bind(tokenHash,id,now+3600000,now),db.prepare("INSERT OR IGNORE INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,f.accountA,new Date().toISOString())]);
  const failing={...db,batch:statements=>db.batch([...statements,db.prepare('INSERT INTO job_store_checks(id,valid) VALUES(?,0)').bind(crypto.randomUUID())])};
  let rejected=false;try{await uadavJobRedeemRecovery(failing,{jobId:id,tokenHash,newSecretHash:await uadavDigest(f.finalKey)})}catch{rejected=true}
  const credential=await db.prepare('SELECT secret_hash,revision FROM job_owner_credentials WHERE job_id=?').bind(id).first(),token=await db.prepare('SELECT consumed_at FROM job_owner_recovery_v2 WHERE token_hash=?').bind(tokenHash).first(),link=await db.prepare('SELECT account_id FROM job_account_links WHERE record_id=?').bind(id).first();
  uadavBolsaLabCheck(rejected&&credential.revision===2&&credential.secret_hash===await uadavDigest(f.nextKey)&&token.consumed_at===null&&link?.account_id===f.accountA,'LAB_RECOVERY_ROLLBACK');
  await uadavJobRedeemRecovery(db,{jobId:id,tokenHash,newSecretHash:await uadavDigest(f.finalKey)});return {rollback:true,retried:true};
 }
 return {allowed:await uadavJobRate(uadavBolsaLabEnv(db,f),'lab-rate:'+state.seed,3,60000)};
}
async function uadavBolsaLabVerify(db,state,phase,attempts){
 const results=attempts.map(x=>JSON.parse(x.data_json)),f=state.fixture,sorted=results.map(x=>x.http_status).sort();
 if([1,2,4].includes(phase))uadavBolsaLabCheck(JSON.stringify(sorted)==='[200,409]','LAB_RACE_OUTCOMES');
 if(phase===1){const rows=(await db.prepare('SELECT id FROM job_store_records WHERE request_id=?').bind(f.request('offer')).all()).results;uadavBolsaLabCheck(rows.length===1,'LAB_OFFER_DUPLICATE');const r=await uadavBolsaLabCall(db,f,'bolsa_trabajo');uadavBolsaLabCheck(r.status===200&&r.data.length===1&&r.data.every(x=>!['owner_access_hash','request_id','contacto','contacto_email'].some(k=>Object.hasOwn(x,k))),'LAB_PUBLIC_PROJECTION');}
 if(phase===2){const app=await uadavBolsaLabRecord(db,f,'application');const rows=(await db.prepare('SELECT account_id FROM audience_announcements').all()).results;uadavBolsaLabCheck(rows.length===1&&rows[0].account_id===f.accountA&&app.consent_scope==='job_application_v1','LAB_APPLICATION_NOTICE_ATOMIC');}
 if(phase===3)uadavBolsaLabCheck(results.every(x=>x.passed||x.foreign_artist_rejected),'LAB_PRIVACY_RESULT');
 if(phase===4){const links=(await db.prepare("SELECT account_id FROM job_account_links WHERE collection='bolsa_trabajo' AND record_id='JOB-QA-LAB-LEGACY'").all()).results;uadavBolsaLabCheck(links.length===1&&[f.accountA,f.accountB].includes(links[0].account_id),'LAB_RECEIPT_LINK_DUPLICATE');const r=await uadavBolsaLabCall(db,f,'bolsa_trabajo/mis-postulantes','POST',{job_id:'JOB-QA-LAB-LEGACY',clave:f.legacyKey});uadavBolsaLabCheck(r.status===200,'LAB_LEGACY_PROOF_REVOKED');}
 if(phase===5){uadavBolsaLabCheck(results[0].http_status===409&&results[1].revoked,'LAB_REVOKED_COMMIT_ACCEPTED');const row=await db.prepare('SELECT id FROM job_store_records WHERE request_id=?').bind(f.request('device-denied')).first();uadavBolsaLabCheck(!row,'LAB_REVOKED_PARTIAL_RECORD');}
 if(phase===6){uadavBolsaLabCheck(sorted.filter(x=>x===200).length===1&&sorted.every(x=>[200,400,409].includes(x)),'LAB_TOKEN_REUSED');const c=await db.prepare("SELECT secret_hash,revision FROM job_owner_credentials WHERE job_id='JOB-QA-LAB-RECOVERY'").first();uadavBolsaLabCheck(c.revision===2&&c.secret_hash===await uadavDigest(f.nextKey),'LAB_RECOVERY_CREDENTIAL');}
 if(phase===7)uadavBolsaLabCheck(results[0].rollback&&results[0].retried,'LAB_RECOVERY_RETRY');
 if(phase===8){uadavBolsaLabCheck(results.filter(x=>x.allowed===true).length===3&&results.every(x=>typeof x.allowed==='boolean'),'LAB_RATE_ATOMIC');uadavBolsaLabCheck((await db.prepare('PRAGMA foreign_key_check').all()).results.length===0,'LAB_REFERENTIAL_INTEGRITY');const row=await db.prepare('PRAGMA quick_check').first();uadavBolsaLabCheck(Object.values(row||{})[0]==='ok','LAB_DATABASE_INTEGRITY');for(const route of ['acceso/solicitar','acceso/restablecer'])uadavBolsaLabCheck((await uadavBolsaLabCall(db,f,'bolsa_trabajo/'+route,'POST',{})).status===503,'LAB_EMAIL_UNLOCKED');}
 return UADAV_BOLSA_LAB_LABELS[phase]+': aprobado';
}
function uadavBolsaLabStatus(state){return {success:true,scope:'isolated-synthetic-bolsa',version:'11764-bolsa-lab-1',core_sha256:UADAV_BOLSA_LAB_CORE_SHA256,empty:state.empty,phase:state.phase||0,complete:state.phase===8,messages:JSON.parse(state.messages||'[]'),next:state.phase<8?{phase:state.phase+1,slots:UADAV_BOLSA_LAB_COUNTS[state.phase+1],parallel:UADAV_BOLSA_LAB_PARALLEL.has(state.phase+1)}:null}}
const uadavBolsaLabWorker={async fetch(request,env){
 try{
  const url=new URL(request.url);
  uadavBolsaLabCheck(url.protocol==='https:'&&/^uadav-bolsa-lab\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname),'LAB_HOST_ONLY',403);
  if(request.method==='GET'&&url.pathname==='/')return new Response(UADAV_BOLSA_LAB_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  if(request.method==='GET'&&url.pathname==='/health')return uadavBolsaLabReply({ok:true,version:'11764-bolsa-lab-1',purpose:'isolated-synthetic-bolsa',core_sha256:UADAV_BOLSA_LAB_CORE_SHA256,enabled:env.QA_BOLSA_ONLY==='true',database_bound:!!env.DB});
  uadavBolsaLabCheck(request.method==='POST'&&['/status','/initialize','/probe','/finish'].includes(url.pathname),'LAB_ROUTE_NOT_AVAILABLE',404);
  uadavBolsaLabCheck(!request.headers.get('Origin')||request.headers.get('Origin')===url.origin,'LAB_ORIGIN_INVALID',403);
  uadavBolsaLabCheck(env.QA_BOLSA_ONLY==='true'&&env.DB,'LAB_CONFIGURATION',503);
  const secretHash=await uadavBolsaLabAuth(request,env),session=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB,db=uadavBolsaLabDB(session),state=await uadavBolsaLabState(db,secretHash);
  if(url.pathname==='/status')return uadavBolsaLabReply(uadavBolsaLabStatus(state));
  const body=await uadavSecurityJSON(request,2048).catch(()=>null);uadavBolsaLabCheck(body&&typeof body==='object'&&!Array.isArray(body),'LAB_BODY_INVALID',400);
  if(url.pathname==='/initialize'){
   uadavBolsaLabCheck(body.confirm==='PREPARAR_BASE_FICTICIA_NUEVA','LAB_EMPTY_CONFIRMATION',412);
   if(!state.empty)return uadavBolsaLabReply(uadavBolsaLabStatus(state));
   const seed=crypto.randomUUID(),f=await uadavBolsaLabFixture(seed),now=new Date().toISOString(),guard=UADAV_BOLSA_LAB_SCHEMA.find(s=>s.startsWith('CREATE TABLE qa_bolsa_guard'));
   const statements=[db.prepare(guard),db.prepare("INSERT INTO qa_bolsa_guard(purpose,secret_hash,core_hash,seed,phase,messages,lease_until) SELECT ?,?,?,?,CASE WHEN (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND substr(name,1,7)<>'sqlite_' AND substr(name,1,4)<>'_cf_')=1 THEN 0 ELSE -1 END,'[]',0").bind(UADAV_BOLSA_LAB_PURPOSE,secretHash,UADAV_BOLSA_LAB_CORE_SHA256,seed),...UADAV_BOLSA_LAB_SCHEMA.filter(s=>s!==guard).map(s=>db.prepare(s)),db.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')")];
   for(const id of [f.accountA,f.accountB])statements.push(db.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,'{}',1,?)").bind(id,now));
   statements.push(db.prepare('INSERT INTO audience_devices(credential_hash,id,account_id,name,created_at,expires_at,revoked_at) VALUES(?,?,?,?,?,0,NULL)').bind(await uadavDigest(f.device),'LAB-DEVICE-A',f.accountA,'LAB Dispositivo A',Date.now()));
   for(const [account,artist] of [[f.accountA,'ART-LAB-A'],[f.accountB,'ART-LAB-B']])statements.push(db.prepare('INSERT INTO audience_artist_links(account_id,artist_id,claim_id,expires_at,created_at) VALUES(?,?,NULL,0,?)').bind(account,artist,Date.now()));
   for(const [id,key] of [['JOB-QA-LAB-LEGACY',f.legacyKey],['JOB-QA-LAB-RECOVERY',f.oldKey]]){const item={id,titulo:'LAB FICTICIA · '+id,descripcion:'Dato ficticio aislado.',activo:false,estado:'cerrada_por_contratante',fecha_limite:'2099-12-31'};statements.push(db.prepare("INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,JSON.stringify(item),now),db.prepare('INSERT INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,1,?)').bind(id,await uadavDigest(key),now));}
   statements.push(db.prepare("INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo','JOB-QA-LAB-RECOVERY',?,?)").bind(f.accountA,now),db.prepare("INSERT INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,'JOB-QA-LAB-RECOVERY',1,?,?)").bind(await uadavDigest(f.recoveryToken),Date.now()+3600000,Date.now()));
   await db.batch(statements).catch(()=>{throw Object.assign(Error('LAB_INITIALIZE_UNCONFIRMED'),{labCode:'LAB_INITIALIZE_UNCONFIRMED',labStatus:409})});
   return uadavBolsaLabReply(uadavBolsaLabStatus({empty:false,phase:0}));
  }
  uadavBolsaLabCheck(!state.empty&&body.confirm==='EJECUTAR_SOLO_DATOS_FICTICIOS','LAB_TEST_CONFIRMATION',412);
  const phase=body.phase;uadavBolsaLabCheck(Number.isInteger(phase)&&phase>=1&&phase<=8,'LAB_PHASE_INVALID',400);
  if(url.pathname==='/finish'&&phase<=state.phase)return uadavBolsaLabReply(uadavBolsaLabStatus(state));
  uadavBolsaLabCheck(phase===state.phase+1,'LAB_PHASE_ORDER',409);
  if(url.pathname==='/probe'){
   const slot=body.slot;uadavBolsaLabCheck(Number.isInteger(slot)&&slot>=0&&slot<UADAV_BOLSA_LAB_COUNTS[phase],'LAB_SLOT_INVALID',400);
   const prior=await db.prepare('SELECT * FROM qa_bolsa_attempts WHERE phase=? AND slot=?').bind(phase,slot).first();if(prior?.state==='done')return uadavBolsaLabReply({success:true,phase,slot,result:JSON.parse(prior.data_json)});
   const owner=crypto.randomUUID(),now=Date.now();await db.prepare("INSERT OR IGNORE INTO qa_bolsa_attempts(phase,slot,state) VALUES(?,?,'pending')").bind(phase,slot).run();
   const claimed=await db.prepare("UPDATE qa_bolsa_attempts SET lease_until=?,owner=? WHERE phase=? AND slot=? AND state='pending' AND lease_until<=?").bind(now+60000,owner,phase,slot,now).run();uadavBolsaLabCheck(claimed.meta?.changes===1,'LAB_PROBE_BUSY',409);
   try{
    if(UADAV_BOLSA_LAB_PARALLEL.has(phase))await uadavBolsaLabWait(db,phase,'arrivals');
    const result=await uadavBolsaLabProbe(db,state,phase,slot);
    const saved=await db.prepare("UPDATE qa_bolsa_attempts SET state='done',status=200,data_json=?,lease_until=0,owner=NULL WHERE phase=? AND slot=? AND owner=?").bind(JSON.stringify(result),phase,slot,owner).run();uadavBolsaLabCheck(saved.meta?.changes===1,'LAB_PROBE_UNCONFIRMED');
    return uadavBolsaLabReply({success:true,phase,slot,result});
   }finally{await db.prepare("UPDATE qa_bolsa_attempts SET lease_until=0,owner=NULL WHERE phase=? AND slot=? AND owner=? AND state='pending'").bind(phase,slot,owner).run()}
  }
  const attempts=(await db.prepare('SELECT * FROM qa_bolsa_attempts WHERE phase=? ORDER BY slot').bind(phase).all()).results;
  uadavBolsaLabCheck(attempts.length===UADAV_BOLSA_LAB_COUNTS[phase]&&attempts.every(x=>x.state==='done'),'LAB_PHASE_INCOMPLETE');
  const owner=crypto.randomUUID(),lock=await db.prepare('UPDATE qa_bolsa_guard SET lease_until=?,lock_owner=? WHERE purpose=? AND phase=? AND lease_until<=?').bind(Date.now()+60000,owner,UADAV_BOLSA_LAB_PURPOSE,state.phase,Date.now()).run();uadavBolsaLabCheck(lock.meta?.changes===1,'LAB_FINISH_BUSY');
  try{
   const message=await uadavBolsaLabVerify(db,state,phase,attempts),messages=[...JSON.parse(state.messages),message];
   const saved=await db.prepare('UPDATE qa_bolsa_guard SET phase=?,messages=? WHERE purpose=? AND phase=? AND lock_owner=?').bind(phase,JSON.stringify(messages),UADAV_BOLSA_LAB_PURPOSE,state.phase,owner).run();uadavBolsaLabCheck(saved.meta?.changes===1,'LAB_PHASE_UNCONFIRMED');
   return uadavBolsaLabReply(uadavBolsaLabStatus({empty:false,phase,messages:JSON.stringify(messages)}));
  }finally{await db.prepare('UPDATE qa_bolsa_guard SET lease_until=0,lock_owner=NULL WHERE purpose=? AND lock_owner=?').bind(UADAV_BOLSA_LAB_PURPOSE,owner).run()}
 }catch(error){return uadavBolsaLabReply({success:false,error:error.labCode||'LAB_OPERATION_UNCONFIRMED',message:'No se confirmó la comprobación. Conservá el resultado y revisá el estado del laboratorio.'},error.labStatus||503)}
}};
const UADAV_BOLSA_LAB_HTML=String.raw`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>UADAV · Laboratorio de Bolsa</title><style>body{margin:0;background:#080e19;color:#edf4ff;font:17px/1.55 system-ui}main{max-width:800px;margin:auto;padding:28px 20px}section{background:#142033;border:1px solid #384b68;border-radius:18px;padding:24px;margin:22px 0}label{display:block;margin:16px 0}input,button{font:inherit;padding:12px;border-radius:10px}input[type=password]{width:min(90%,500px)}button{cursor:pointer;border:0;margin:6px;background:#eaf3ff;color:#08101d}button:disabled{opacity:.45}strong{color:#ffe08a}#feedback{white-space:pre-wrap}li{margin:12px 0}</style></head><body><main><strong>LABORATORIO SEPARADO · SOLO DATOS FICTICIOS</strong><h1>Comprobar Bolsa</h1><p>Prueba privacidad, operaciones simultáneas y transacciones en una base nueva y desechable. No admite respaldos personales ni ejecuta llamadas a la plataforma actual.</p><section><form id="labLogin"><label>Clave exclusiva del laboratorio<input id="labKey" type="password" autocomplete="current-password" required></label><button id="labEnter" type="submit">Entrar al laboratorio</button></form><p id="authState" role="status">Ingresá para comprobar la base vinculada.</p></section><section><h2>1. Preparar la base nueva</h2><label><input id="emptyConfirmation" type="checkbox" disabled> Confirmo que DB es la base nueva del laboratorio, distinta de las bases de staging, producción y restauración.</label><button id="initialize" disabled>Preparar base ficticia</button><h2>2. Ejecutar las comprobaciones</h2><label><input id="testConfirmation" type="checkbox" disabled> Autorizo estas pruebas con cuentas y registros ficticios dentro del laboratorio.</label><button id="run" disabled>Ejecutar pruebas de Bolsa</button><ol id="results"></ol><p id="feedback" role="status"></p><button id="copy" disabled>Copiar resultado seguro</button></section><p>El correo permanece deshabilitado. No se modifica el cron ni la oferta que debe vencer con el reloj real.</p><script>
(function(){'use strict';const $=id=>document.getElementById(id);let key='',state=null,busy=false;async function api(path,body={}){const response=await fetch(path,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(body)});let data;try{data=await response.json()}catch{throw Error('Respuesta sin confirmar.')}if(!response.ok||data.success!==true)throw Error(data.error||'No se confirmó la prueba.');return data}function paint(data){state=data;$('results').replaceChildren();for(const message of data.messages||[]){const li=document.createElement('li');li.textContent=message;$('results').append(li)}$('emptyConfirmation').disabled=!data.empty;$('initialize').disabled=!data.empty||!$('emptyConfirmation').checked;$('testConfirmation').disabled=data.empty||data.complete;$('run').disabled=data.empty||data.complete||!$('testConfirmation').checked;$('copy').disabled=!data.complete;$('feedback').textContent=data.complete?'Comprobaciones completas. Copiá el resultado para la auditoría.':data.empty?'Base vacía confirmada.':'Base preparada. Faltan comprobaciones.'}
$('labLogin').onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;key=$('labKey').value;$('labKey').value='';$('labEnter').disabled=true;try{paint(await api('/status'));$('authState').textContent='Sesión del laboratorio abierta.'}catch(error){key='';$('authState').textContent=error.message}finally{busy=false;$('labEnter').disabled=false}};
$('emptyConfirmation').onchange=()=>{$('initialize').disabled=!$('emptyConfirmation').checked};$('testConfirmation').onchange=()=>{$('run').disabled=!$('testConfirmation').checked||!state||state.empty||state.complete};
$('initialize').onclick=async()=>{if(busy||!$('emptyConfirmation').checked)return;busy=true;$('initialize').disabled=true;try{paint(await api('/initialize',{confirm:'PREPARAR_BASE_FICTICIA_NUEVA'}))}catch(error){$('feedback').textContent=error.message}finally{busy=false}};
$('run').onclick=async()=>{if(busy||!state||!$('testConfirmation').checked)return;busy=true;$('run').disabled=true;try{while(!state.complete){const phase=state.next.phase,slots=Array.from({length:state.next.slots},(_,slot)=>slot),probe=slot=>api('/probe',{phase,slot,confirm:'EJECUTAR_SOLO_DATOS_FICTICIOS'});$('feedback').textContent='Ejecutando comprobación '+phase+' de 8…';if(state.next.parallel)await Promise.all(slots.map(probe));else for(const slot of slots)await probe(slot);paint(await api('/finish',{phase,confirm:'EJECUTAR_SOLO_DATOS_FICTICIOS'}))}}catch(error){$('feedback').textContent=error.message+' Volvé a entrar para leer el estado antes de reintentar.'}finally{busy=false}};
$('copy').onclick=async()=>{if(!state?.complete)return;try{await navigator.clipboard.writeText(JSON.stringify({result:'complete',scope:state.scope,version:state.version,core_sha256:state.core_sha256,checks:state.messages},null,2));$('feedback').textContent='Resultado copiado, sin claves ni datos personales.'}catch{$('feedback').textContent='No se pudo copiar. Conservá el resultado visible.'}}})();</script></main></body></html>`;
export default uadavBolsaLabWorker;
