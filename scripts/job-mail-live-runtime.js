/* Private staging end-to-end QA. Public recovery remains503. Only explicitly
 * created closed QA offers can be redeemed, only to the configured recipient.
 * Provider and outbox are the unchanged modules approved in mail-lab-11766-1. */
const LIVE_SITE='https://uadav-api-staging.uadavstream.workers.dev',LIVE_PAGES='https://uadav-stream-staging.pages.dev';
const LIVE_ADMIN='/api/admin/jobs/email-recovery-qa',LIVE_REDEEM='/api/qa/bolsa/email-recovery/redeem';
const LIVE_SCHEMA_KEY='mail:live:schema:11767',LIVE_SCOPE='brevo-recovery-staging';
const LIVE_LABELS=['Enlace recibido y confirmado','Clave anterior revocada','Acceso privado con la clave nueva','Oferta ficticia conservada sin publicación'];
const liveUUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const liveJob=/^JOB-QA-MAIL-LIVE-[A-F0-9]{32}$/;
const liveHex=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const liveHash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const liveFail=(code,status=503)=>{throw Object.assign(Error(code),{liveCode:code,liveStatus:status})};
const liveNeed=(value,code,status)=>{if(!value)liveFail(code,status)};
const liveExact=(body,keys)=>body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).length===keys.length&&keys.every(k=>Object.hasOwn(body,k));
function liveDB(native,counter={used:0}){
 const spend=n=>liveNeed((counter.used+=n)<=48,'RECOVERY_QA_QUERY_BUDGET');
 const wrap=s=>({_native:s,bind(...a){return wrap(s.bind(...a))},first(...a){spend(1);return s.first(...a)},all(){spend(1);return s.all()},run(){spend(1);return s.run()}});
 return{prepare:sql=>wrap(native.prepare(sql)),withSession:()=>liveDB(native,counter),batch:sql=>{spend(sql.length);return native.batch(sql.map(s=>s._native))},queries:()=>counter.used};
}
async function liveReceiverReady(){
 const ctl=new AbortController();let timer;try{
  await Promise.race([(async()=>{const response=await fetch(new Request(LIVE_PAGES+'/email-access-version.json',{method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',headers:{Accept:'application/json'},signal:ctl.signal}));liveNeed(response.status===200&&/^application\/json(?:\s*;|$)/i.test(response.headers.get('Content-Type')||''),'RECOVERY_QA_RECEIVER_NOT_READY',409);const reader=response.body?.getReader();liveNeed(reader,'RECOVERY_QA_RECEIVER_NOT_READY',409);let size=0,text='';const decoder=new TextDecoder();try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;liveNeed(size<=1024,'RECOVERY_QA_RECEIVER_NOT_READY',409);text+=decoder.decode(value,{stream:true})}}finally{await reader.cancel().catch(()=>{})}const data=JSON.parse(text+decoder.decode());liveNeed(liveExact(data,['scope','version','api_origin'])&&data.scope==='email-recovery-receiver-staging'&&data.version==='11767.1'&&data.api_origin===LIVE_SITE,'RECOVERY_QA_RECEIVER_NOT_READY',409)})(),new Promise((_,reject)=>{timer=setTimeout(()=>{ctl.abort();reject(Error('receiver timeout'))},5000)})]);
 }catch{liveFail('RECOVERY_QA_RECEIVER_NOT_READY',409)}finally{clearTimeout(timer);ctl.abort()}
}
async function liveOldSecret(key,job){const k=await crypto.subtle.importKey('raw',Uint8Array.from(key.match(/../g),x=>parseInt(x,16)),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode('uadav-live-qa-owner-v1:'+job))),x=>x.toString(16).padStart(2,'0')).join('')}
async function liveContext(env,withProvider=true){
 liveNeed(env.JOB_STORE_MAINTENANCE!=='true','RECOVERY_QA_MAINTENANCE',423);
 liveNeed(env.JOB_STORE_D1==='true'&&env.DB,'RECOVERY_QA_STORAGE');
 const encryptionKey=env.JOB_RECOVERY_ENCRYPTION_KEY;
 liveNeed(liveHex(encryptionKey),'RECOVERY_QA_ENCRYPTION_KEY');
 const recipient=typeof env.BREVO_QA_RECIPIENT==='string'?env.BREVO_QA_RECIPIENT.trim().toLowerCase():'';
 liveNeed(uadavLiveMailCore.brevoStagingAddress(recipient)===recipient&&!!recipient,'RECOVERY_QA_RECIPIENT');
 const native=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB,db=liveDB(native);
 liveNeed((await db.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first())?.value==='true','RECOVERY_QA_MIGRATION');
 const recipientHash=await liveHash(recipient),keyHash=await liveHash('uadav-live-qa-key-v1:'+encryptionKey),now=Date.now();
 const read=async key=>{const x=await db.prepare('SELECT value FROM job_store_meta WHERE key=?').bind(key).first();if(!x)return null;try{return JSON.parse(x.value)}catch{liveFail('RECOVERY_QA_METADATA')}};
 const marker=await read(LIVE_SCHEMA_KEY);
 const tables=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('job_recovery_outbox','job_mail_live_qa')").all()).results.map(x=>x.name);
 if(marker){liveNeed(marker.version===1&&marker.schema_sha256===UADAV_LIVE_MAIL_SCHEMA_SHA&&tables.length===2,'RECOVERY_QA_SCHEMA');const cols=(await db.prepare('PRAGMA table_info(job_recovery_outbox)').all()).results.map(x=>x.name);liveNeed(cols.includes('redeemed_secret_hash')&&cols.includes('redeemed_at'),'RECOVERY_QA_SCHEMA');}
 else liveNeed(tables.length===0,'RECOVERY_QA_FOREIGN_SCHEMA',423);
 const delivery=(await db.prepare("SELECT value FROM job_store_meta WHERE key LIKE 'brevo:delivery:request:%' AND json_valid(value) AND json_extract(value,'$.recipient_hash')=? AND json_extract(value,'$.verified_at')>=? ORDER BY json_extract(value,'$.verified_at') DESC LIMIT 1").bind(recipientHash,now-7*86400000).first());
 let diagnostic;try{diagnostic=delivery&&JSON.parse(delivery.value)}catch{}
 const received=!!diagnostic&&diagnostic.version===1&&Number.isSafeInteger(diagnostic.verified_at)&&diagnostic.verified_at<=now&&diagnostic.verification_hash===null&&liveUUID.test(diagnostic.verification_owner||'');
 let adapter;
 if(withProvider)adapter=uadavLiveMailCore.createBrevoStagingMail({mode:'staging-only',apiKey:env.BREVO_API_KEY,senderEmail:'acceso@correo-staging.uadavstream.com.ar',allowedRecipients:[recipient]});
 const engine=(extra={})=>uadavLiveMailCore.createJobRecoveryOutbox({db,encryptionKey,mode:'staging-only',...extra,...(adapter?{prepareDelivery:adapter.prepare}:{})});
 const latest=()=>db.prepare('SELECT * FROM job_mail_live_qa WHERE recipient_hash=? ORDER BY (completed_at IS NULL AND expires_at>?) DESC,created_at DESC,id DESC LIMIT 1').bind(recipientHash,Date.now()).first();
 return{db,read,marker,received,diagnostic,now,recipient,recipientHash,keyHash,encryptionKey,adapter,engine,latest};
}
async function liveFixture(c,row){
 liveNeed(row&&liveUUID.test(row.id)&&liveJob.test(row.job_id)&&row.job_id==='JOB-QA-MAIL-LIVE-'+row.id.replaceAll('-','').toUpperCase()&&row.recipient_hash===c.recipientHash&&row.key_hash===c.keyHash&&row.expires_at===row.created_at+900000,'RECOVERY_QA_FIXTURE',400);
 const record=await c.db.prepare("SELECT r.data_json,c.secret_hash,c.revision FROM job_store_records r JOIN job_owner_credentials c ON c.job_id=r.id WHERE r.collection='bolsa_trabajo' AND r.id=?").bind(row.job_id).first();let item;try{item=JSON.parse(record?.data_json)}catch{}
 liveNeed(item?.id===row.job_id&&item.titulo==='QA11767 · Recuperación por correo · NO CONTRATAR'&&item.activo===false&&item.estado==='cerrada_por_contratante'&&item.contacto_email===c.recipient&&record.revision>=1&&record.revision<=2,'RECOVERY_QA_FIXTURE',400);
 return record;
}
async function liveStatus(c,row){
 const result={result:'status',ready:c.received,initialized:!!c.marker,diagnostic_received:c.received,encryption_key_configured:true,provider_configured:!!c.adapter,complete:false,can_start:!row||row.expires_at<=c.now||!!row.completed_at};
 if(!row)return result;
 await liveFixture(c,row);const outbox=await c.db.prepare('SELECT state,provider_id,attempts,expires_at FROM job_recovery_outbox WHERE request_id=? AND job_id=?').bind(row.id,row.job_id).first();
 return{...result,request_id:row.id,job_id:row.job_id,expires_at:row.expires_at,expired:row.expires_at<=c.now,dispatch_reserved:!!row.dispatch_at,provider_accepted:!!outbox?.provider_id,email_attempts:outbox?.attempts||0,link_redeemed:outbox?.state==='redeemed',complete:!!row.completed_at,result:row.completed_at?'complete':'status',checks:row.completed_at?LIVE_LABELS.map(x=>x+': aprobado'):[]};
}
async function uadavJobMailLiveRoute(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=[LIVE_SITE,LIVE_PAGES];
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Pragma:'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{})};
 const reply=(body,status=200)=>new Response(JSON.stringify({build:BUILD,scope:LIVE_SCOPE,recovery_enabled:false,...body}),{status,headers});
 try{
  liveNeed(url.origin===LIVE_SITE,'RECOVERY_QA_STAGING_ONLY',403);
  if(url.pathname==='/qa/recuperacion-oferta'){
   liveNeed(request.method==='GET'&&!url.search,'RECOVERY_QA_METHOD',405);const nonce=crypto.randomUUID().replaceAll('-','');
   return new Response(UADAV_LIVE_MAIL_HTML.replaceAll('%%NONCE%%',nonce),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
  }
  const publicRedeem=url.pathname===LIVE_REDEEM;
  liveNeed(publicRedeem||url.pathname===LIVE_ADMIN,'RECOVERY_QA_ROUTE',404);
  liveNeed(!url.search,'RECOVERY_QA_INPUT',400);
  if(publicRedeem&&request.method==='OPTIONS'){
   liveNeed(allowed.includes(origin),'RECOVERY_QA_ORIGIN',403);return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'0'}});
  }
  if(!publicRedeem){const admin=env.ADMIN_KEY;liveNeed(typeof admin==='string'&&!!admin.trim()&&request.headers.get('Authorization')==='Bearer '+admin.trim(),'RECOVERY_QA_AUTH',401);liveNeed(!origin||origin===LIVE_SITE,'RECOVERY_QA_ORIGIN',403)}
  else liveNeed(allowed.includes(origin),'RECOVERY_QA_ORIGIN',403);
  liveNeed(request.method==='POST'||!publicRedeem&&request.method==='GET','RECOVERY_QA_METHOD',405);
  let body;
  if(request.method==='POST'){liveNeed(/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''),'RECOVERY_QA_INPUT',400);body=await uadavSecurityJSON(request,768).catch(()=>null);liveNeed(body&&typeof body==='object'&&!Array.isArray(body),'RECOVERY_QA_INPUT',400)}
  if(!publicRedeem&&request.method==='GET'){
   // Missing configuration is readable by Admin without creating schema or mail.
   if(!liveHex(env.JOB_RECOVERY_ENCRYPTION_KEY))return reply({result:'status',ready:false,encryption_key_configured:false,complete:false,checks:[]});
   const c=await liveContext(env);return reply(await liveStatus(c,c.marker?await c.latest():null));
  }
  if(publicRedeem){
   liveNeed(liveExact(body,['job_id','token','new_secret','confirm'])&&typeof body.job_id==='string'&&liveJob.test(body.job_id)&&liveHex(body.token)&&liveHex(body.new_secret)&&body.confirm==='RECUPERAR_OFERTA','RECOVERY_QA_LINK',400);
   const peer=request.headers.get('CF-Connecting-IP');liveNeed(typeof peer==='string'&&peer.length<=64&&/^[a-fA-F0-9:.]+$/.test(peer),'RECOVERY_QA_ORIGIN',403);
   const c=await liveContext(env,false);liveNeed(c.marker,'RECOVERY_QA_STORAGE');
   liveNeed(await uadavJobRate({DB:c.db},'mail-live-redeem:'+await liveHash(peer),12,600000),'RECOVERY_QA_RATE',429);
   const row=await c.db.prepare('SELECT * FROM job_mail_live_qa WHERE job_id=?').bind(body.job_id).first();await liveFixture(c,row);
   liveNeed(row.expires_at>Date.now()&&!!row.dispatch_at,'RECOVERY_QA_LINK',400);
   const newHash=await liveHash(body.new_secret);await c.engine().redeem({jobId:row.job_id,token:body.token,newSecretHash:newHash});
   const call=secret=>uadavJobD1Inbox(new Request(LIVE_SITE+'/api/bolsa_trabajo/mis-postulantes',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':peer},body:JSON.stringify({job_id:row.job_id,clave:secret})}),{...env,DB:c.db},{});
   const old=await call(await liveOldSecret(c.encryptionKey,row.job_id)),fresh=await call(body.new_secret);
   liveNeed(old.status===404&&fresh.status===200,'RECOVERY_QA_INBOX');
   const written=await c.db.prepare("UPDATE job_mail_live_qa SET completed_at=COALESCE(completed_at,?),new_hash=? WHERE id=? AND key_hash=? AND EXISTS(SELECT 1 FROM job_owner_credentials WHERE job_id=? AND secret_hash=? AND revision=2)").bind(Date.now(),newHash,row.id,c.keyHash,row.job_id,newHash).run();liveNeed(written.meta?.changes===1,'RECOVERY_QA_COMMIT');
   return reply({success:true,job_id:row.job_id,revision:2,result:'recovered'});
  }
  liveNeed(typeof body.action==='string','RECOVERY_QA_INPUT',400);
  if(body.action==='start')liveNeed(liveExact(body,['action','request_id','confirm'])&&typeof body.request_id==='string'&&liveUUID.test(body.request_id)&&body.confirm==='OFERTA_FICTICIA_Y_CORREO_PROPIO','RECOVERY_QA_INPUT',400);
  else liveNeed(['request','send'].includes(body.action)&&liveExact(body,['action','request_id','confirm'])&&typeof body.request_id==='string'&&liveUUID.test(body.request_id)&&body.confirm==='ENVIAR_ENLACE_A_CORREO_PROPIO','RECOVERY_QA_INPUT',400);
  const c=await liveContext(env);liveNeed(c.received,'RECOVERY_QA_RECEIPT_REQUIRED',409);if(body.action==='start'||body.action==='send')await liveReceiverReady();
  if(!c.marker){
   liveNeed(body.action==='start','RECOVERY_QA_NOT_INITIALIZED',409);
   const d=c.diagnostic,guard="EXISTS(SELECT 1 FROM job_store_meta WHERE key='migration_ready' AND value='true') AND EXISTS(SELECT 1 FROM job_store_meta WHERE key LIKE 'brevo:delivery:request:%' AND json_extract(value,'$.recipient_hash')=? AND json_extract(value,'$.verified_at')=? AND json_extract(value,'$.verification_hash') IS NULL) AND NOT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name IN ('job_recovery_outbox','job_mail_live_qa'))";
   await c.db.batch([...uadavJobGuard(c.db,guard,[c.recipientHash,d.verified_at]),...UADAV_LIVE_MAIL_SCHEMA.map(sql=>c.db.prepare(sql)),c.db.prepare("CREATE TABLE job_mail_live_qa(id TEXT PRIMARY KEY,job_id TEXT NOT NULL UNIQUE,recipient_hash TEXT NOT NULL,key_hash TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,dispatch_at INTEGER,completed_at INTEGER,new_hash TEXT)"),c.db.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?)').bind(LIVE_SCHEMA_KEY,JSON.stringify({version:1,schema_sha256:UADAV_LIVE_MAIL_SCHEMA_SHA}))]);
   c.marker={version:1,schema_sha256:UADAV_LIVE_MAIL_SCHEMA_SHA};
  }
  if(body.action==='start'){
   const prior=await c.db.prepare('SELECT * FROM job_mail_live_qa WHERE id=?').bind(body.request_id).first();if(prior)return reply(await liveStatus(c,prior));
   const existing=await c.latest();liveNeed(!existing||existing.expires_at<=c.now||!!existing.completed_at,'RECOVERY_QA_ACTIVE',409);
   const id=body.request_id,job='JOB-QA-MAIL-LIVE-'+id.replaceAll('-','').toUpperCase(),day=uadavJobToday(c.now),bucket='mail-live-qa:daily:'+day,reset=Date.parse(day+'T03:00:00Z')+86400000;
   const record={id:job,titulo:'QA11767 · Recuperación por correo · NO CONTRATAR',descripcion:'Prueba privada de recuperación. Oferta ficticia cerrada.',contacto:'Prueba privada de staging',contacto_email:c.recipient,activo:false,estado:'cerrada_por_contratante',fecha_limite:day};
   const oldHash=await liveHash(await liveOldSecret(c.encryptionKey,job));
   try{await c.db.batch([c.db.prepare('INSERT INTO job_store_rates(bucket,hits,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1').bind(bucket,reset),...uadavJobGuard(c.db,'EXISTS(SELECT 1 FROM job_store_rates WHERE bucket=? AND hits<=2) AND NOT EXISTS(SELECT 1 FROM job_mail_live_qa WHERE expires_at>? AND completed_at IS NULL)',[bucket,c.now]),c.db.prepare("INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES('bolsa_trabajo',?,?,?)").bind(job,JSON.stringify(record),new Date(c.now).toISOString()),c.db.prepare('INSERT INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,1,?)').bind(job,oldHash,new Date(c.now).toISOString()),c.db.prepare('INSERT INTO job_mail_live_qa(id,job_id,recipient_hash,key_hash,created_at,expires_at) VALUES(?,?,?,?,?,?)').bind(id,job,c.recipientHash,c.keyHash,c.now,c.now+900000)])}catch{const saved=await c.db.prepare('SELECT * FROM job_mail_live_qa WHERE id=?').bind(id).first();if(saved)return reply(await liveStatus(c,saved));liveFail('RECOVERY_QA_LIMIT_OR_ACTIVE',409)}
   return reply(await liveStatus(c,c.marker?await c.latest():null));
  }
  const row=await c.db.prepare('SELECT * FROM job_mail_live_qa WHERE id=?').bind(body.request_id).first();await liveFixture(c,row);liveNeed(row.expires_at>Date.now()&&!row.completed_at,'RECOVERY_QA_LINK',400);
  if(body.action==='request'){await c.engine({clock:()=>row.created_at}).enqueue({jobId:row.job_id,recipient:c.recipient,requestId:row.id,actorHash:await liveHash('mail-live-qa-admin:'+row.id)});return reply(await liveStatus(c,row));}
  // Exactly one dispatch reservation per fixture. A timeout never sends again.
  const pending=await c.db.prepare('SELECT id FROM job_recovery_outbox WHERE request_id=? AND job_id=?').bind(row.id,row.job_id).first();liveNeed(pending,'RECOVERY_QA_REQUEST_REQUIRED',409);
  const unexpected=await c.db.prepare("SELECT COUNT(*) AS n FROM job_recovery_outbox o WHERE NOT EXISTS(SELECT 1 FROM job_mail_live_qa q WHERE q.job_id=o.job_id AND q.id=o.request_id)").first();liveNeed(unexpected.n===0,'RECOVERY_QA_FOREIGN_OUTBOX',423);
  const reserved=await c.db.prepare('UPDATE job_mail_live_qa SET dispatch_at=? WHERE id=? AND dispatch_at IS NULL AND expires_at>?').bind(Date.now(),row.id,Date.now()).run();
  if(reserved.meta?.changes===1)await c.engine().dispatch(c.adapter);
  return reply(await liveStatus(c,await c.db.prepare('SELECT * FROM job_mail_live_qa WHERE id=?').bind(row.id).first()));
 }catch(error){const code=/^RECOVERY_QA_[A-Z_]{1,60}$/.test(error?.liveCode||'')?error.liveCode:'RECOVERY_QA_UNCONFIRMED';const status=error?.liveStatus||(error?.code==='JOB_RECOVERY_INPUT'?400:503);return reply({result:'error',success:false,code,error:code==='RECOVERY_QA_LINK'||status===400?'Este enlace ya no está disponible. Solicitá uno nuevo.':'No se confirmó la operación. Consultá el estado antes de reintentar.'},status)}
}
