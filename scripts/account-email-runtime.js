/* Exact-host staging HTTP boundary. Installation/activation is Admin-only;
 * until a real verification + login completes, only the configured QA mailbox
 * is eligible for mail. General access remains disabled by default. */
const AE_SITE='https://uadav-api-staging.uadavstream.workers.dev',AE_PAGES='https://uadav-stream-staging.pages.dev';
function aeError(code='ACCESS_UNAVAILABLE',status=503){return Object.assign(Error(code),{aeCode:code,status})}
function aeRequire(ok,code,status){if(!ok)throw aeError(code,status)}
async function aeReceiver(){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);try{const r=await fetch(AE_PAGES+'/account-email-version.json',{redirect:'manual',cache:'no-store',credentials:'omit',signal:controller.signal});aeRequire(r.status===200&&/^application\/json/.test(r.headers.get('content-type')||''),'ACCESS_RECEIVER');const text=await uadavExternalRead(r,1024,controller.signal),v=JSON.parse(text);aeRequire(v.version==='11769.1'&&v.purpose==='account_email_access'&&v.confirmation==='explicit-post','ACCESS_RECEIVER');}finally{clearTimeout(timer)}}
async function aeContext(env){
 aeRequire(env.JOB_STORE_D1==='true'&&env.DB&&/^[a-f0-9]{64}$/.test(env.JOB_RECOVERY_ENCRYPTION_KEY||'')&&/^[A-Za-z0-9._-]{32,512}$/.test(env.BREVO_API_KEY||''),'ACCESS_CONFIGURATION');
 const recipient=uadavAccountEmail.accountEmailAddress(env.BREVO_QA_RECIPIENT);aeRequire(recipient,'ACCESS_CONFIGURATION');
 const db=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB,keyHash=await uadavDigest('uadav-account-email-key-v1:'+env.JOB_RECOVERY_ENCRYPTION_KEY),providerContext=await uadavDigest('uadav-account-mail-provider-v1:'+env.BREVO_API_KEY);
 const tables=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'access_email_%'").all()).results.map(x=>x.name);
 let setting=null;if(tables.length){
  aeRequire(tables.every(t=>AE_TABLES.includes(t)),'ACCESS_FOREIGN_SCHEMA',423);if(tables.includes('access_email_settings'))setting=await db.prepare('SELECT * FROM access_email_settings WHERE id=1').first();
  if(setting)aeRequire(AE_TABLES.every(t=>tables.includes(t))&&setting.schema_hash===AE_SCHEMA_HASH&&setting.key_hash===keyHash,'ACCESS_FOREIGN_SCHEMA',423);
  else{
   // Explicit Admin prepare may reinitialize an exact, quiescent schema after
   // restoring permanent email identities. Never replay activation or proofs.
   aeRequire(tables.includes('access_email_identities'),'ACCESS_FOREIGN_SCHEMA',423);const normalize=s=>s.replace(/IF NOT EXISTS /g,'').replace(/\s+/g,' ').trim();
   const actual=(await db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name LIKE 'access_email_%'").all()).results;
   for(const row of actual){const expected=AE_SCHEMA.find(s=>s.startsWith('CREATE TABLE IF NOT EXISTS '+row.name+' '));aeRequire(expected&&normalize(expected)===normalize(row.sql),'ACCESS_FOREIGN_SCHEMA',423);if(row.name!=='access_email_identities')aeRequire(Number((await db.prepare('SELECT COUNT(*) n FROM '+row.name).first()).n)===0,'ACCESS_FOREIGN_SCHEMA',423)}
   const keys=(await db.prepare('SELECT DISTINCT key_hash FROM access_email_identities').all()).results;aeRequire(keys.every(x=>x.key_hash===keyHash)&&(await db.prepare('PRAGMA foreign_key_check(access_email_identities)').all()).results.length===0,'ACCESS_FOREIGN_SCHEMA',423);
  }
 }
 const core=uadavAccountEmail.createAccountEmailCore({db,encryptionKey:env.JOB_RECOVERY_ENCRYPTION_KEY,providerContext,prepareMessage:uadavAccountEmail.prepareAccountEmailMessage});
 return{db,setting,core,keyHash,qaHash:await core.emailHash(recipient)};
}
async function aeIdentity(request,env){const r=await uadavAccountRoute(new Request(AE_SITE+'/api/account/identity',{headers:request.headers}),env,true);aeRequire(r.status===200,'ACCESS_AUTH',401);const value=await r.json(),secret=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');return{accountId:value.account_id,credentialHash:await uadavDigest(secret),device:secret.startsWith('UAD-')}}
async function aeDispatch(c,id,env){for(let n=0;n<3;n++){const r=await c.core.dispatch(id,async({body,expiresAt})=>{aeRequire(expiresAt>Date.now(),'ACCESS_EXPIRED',400);return uadavAccountEmail.uadavBrevoRequest({mode:'staging-only',apiKey:env.BREVO_API_KEY,body})});if(r.state!=='unconfirmed')return;if(n<2)await new Promise(resolve=>setTimeout(resolve,1000*(n+1)))}}
async function uadavAccountEmailRoute(request,env,ctx){
 const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=[AE_SITE,AE_PAGES],admin=url.pathname==='/api/admin/access-email';
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{})},reply=(d,status=200)=>new Response(JSON.stringify(d),{status,headers});
 const started=Date.now(),uniform=async()=>{const jitter=new Uint8Array(1);crypto.getRandomValues(jitter);const remaining=800+jitter[0]%101-(Date.now()-started);if(remaining>0)await new Promise(r=>setTimeout(r,remaining));return reply({accepted:true,message:'Revisá tu correo. Si corresponde, vas a recibir un enlace para continuar.'},202)};
 try{
  aeRequire(url.origin===AE_SITE,'ACCESS_STAGING_ONLY',403);aeRequire(!origin||allowed.includes(origin),'ACCESS_ORIGIN',403);aeRequire(!url.search,'ACCESS_METHOD',405);
  if(request.method==='OPTIONS'){aeRequire(allowed.includes(origin),'ACCESS_ORIGIN',403);return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'0'}})}
  aeRequire(['GET','POST'].includes(request.method),'ACCESS_METHOD',405);if(request.method==='GET')aeRequire(admin||url.pathname==='/api/access/email/status','ACCESS_METHOD',405);
  if(admin)aeRequire(typeof env.ADMIN_KEY==='string'&&request.headers.get('Authorization')==='Bearer '+env.ADMIN_KEY.trim(),'ACCESS_ADMIN',401);
  if(env.JOB_STORE_MAINTENANCE==='true')throw aeError('ACCESS_MAINTENANCE',423);
  const c=await aeContext(env);
  const status=()=>({build:BUILD,checked_at:new Date().toISOString(),scope:'account-email-staging',installed:!!c.setting,enabled:c.setting?.enabled===1,qa_verification:!!c.setting?.qa_verified_at,qa_login:!!c.setting?.qa_login_at,daily_budget:240,public_job_key_recovery_enabled:false});
  if(admin){
   if(request.method==='GET')return reply(status());
   const b=await uadavSecurityJSON(request,2000);aeRequire(b&&Object.keys(b).length===2&&typeof b.action==='string'&&typeof b.confirm==='string','ACCESS_INPUT',400);
   if(b.action==='prepare'){
    aeRequire(b.confirm==='PREPARAR ACCESO POR CORREO','ACCESS_CONFIRM',400);await aeReceiver();if(!c.setting){
     const ready=await c.db.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first();aeRequire(ready?.value==='true','ACCESS_STORAGE');
     await c.db.batch([...AE_SCHEMA.map(sql=>c.db.prepare(sql)),c.db.prepare('INSERT INTO access_email_settings(id,schema_hash,key_hash,enabled) VALUES(1,?,?,0)').bind(AE_SCHEMA_HASH,c.keyHash)]);
    }return reply({success:true,installed:true,enabled:c.setting?.enabled===1});
   }
   aeRequire(c.setting,'ACCESS_NOT_PREPARED');
   if(b.action==='enable'){aeRequire(b.confirm==='HABILITAR CORREO EN STAGING'&&c.setting.qa_verified_at&&c.setting.qa_login_at,'ACCESS_QA_PENDING',409);await aeReceiver();const enabled=await c.db.prepare('UPDATE access_email_settings SET enabled=1 WHERE id=1 AND qa_verified_at IS NOT NULL AND qa_login_at IS NOT NULL AND EXISTS(SELECT 1 FROM access_email_identities e JOIN audience_accounts a ON a.id=e.account_id WHERE e.account_id=access_email_settings.qa_account_id AND e.revision=access_email_settings.qa_identity_revision AND e.email_hash=? AND e.key_hash=? AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=a.id))').bind(c.qaHash,c.keyHash).run();aeRequire(enabled.meta?.changes===1,'ACCESS_QA_PENDING',409);return reply({success:true,enabled:true})}
   if(b.action==='disable'){aeRequire(b.confirm==='PAUSAR CORREO EN STAGING','ACCESS_CONFIRM',400);await c.db.batch([c.db.prepare('UPDATE access_email_settings SET enabled=0 WHERE id=1'),c.db.prepare("UPDATE access_email_outbox SET state='cancelled',sealed_payload=NULL,sealed_address=NULL,lease_owner=NULL,lease_until=0 WHERE state IN ('queued','sending','accepted','failed')")]);return reply({success:true,enabled:false})}
   throw aeError('ACCESS_INPUT',400);
  }
  aeRequire(c.setting,'ACCESS_NOT_PREPARED');
  if(url.pathname==='/api/access/email/status'&&request.method==='GET')return reply({...status(),...(request.headers.get('Authorization')?{identity:await c.core.status((await aeIdentity(request,env)).accountId)}:{})});
  const peer=request.headers.get('CF-Connecting-IP');aeRequire(typeof peer==='string'&&/^[A-Fa-f0-9:.]{3,64}$/.test(peer),'ACCESS_PEER',403);const actorHash=await uadavDigest(peer);
  if(['/api/access/email/request','/api/access/email/verify'].includes(url.pathname)&&request.method==='POST'){
   const b=await uadavSecurityJSON(request,2000);aeRequire(b&&Object.keys(b).length===3&&b.consent===true&&typeof b.email==='string'&&typeof b.request_id==='string','ACCESS_INPUT',400);
   const email=uadavAccountEmail.accountEmailAddress(b.email);aeRequire(email,'ACCESS_INPUT',400);const identity=url.pathname.endsWith('/verify')?await aeIdentity(request,env):null;
   if(c.setting.enabled!==1&&await c.core.emailHash(email)!==c.qaHash)return uniform();
   aeRequire(ctx&&typeof ctx.waitUntil==='function','ACCESS_CONTEXT');const queued=await c.core.request({email,requestId:b.request_id,actorHash,identity});
   if(queued.dispatchId){aeRequire(ctx&&typeof ctx.waitUntil==='function','ACCESS_CONTEXT');ctx.waitUntil(aeDispatch(c,queued.dispatchId,env).catch(()=>{}))}
   return uniform();
  }
  if(url.pathname==='/api/access/email/redeem'&&request.method==='POST'){
   const b=await uadavSecurityJSON(request,2000);aeRequire(b&&Object.keys(b).length===4&&['id','token','new_device_secret','device_name'].every(k=>typeof b[k]==='string'),'ACCESS_INPUT',400);
   aeRequire(await c.core.rate('redeem:'+actorHash,12,600000),'ACCESS_RATE',429);
   const row=await c.db.prepare('SELECT purpose,email_hash,account_id FROM access_email_outbox WHERE id=?').bind(b.id).first();aeRequire(row&&(c.setting.enabled===1||row.email_hash===c.qaHash),'ACCESS_INVALID',400);
   const readerIdentity=row.purpose==='verify'?await aeIdentity(request,env):null;aeRequire(!readerIdentity||readerIdentity.accountId===row.account_id,'ACCESS_AUTH',401);
   const result=await c.core.redeem({id:b.id,token:b.token,newDeviceSecret:b.new_device_secret,deviceName:b.device_name,readerIdentity});
   if(row.email_hash===c.qaHash){const identity=await c.db.prepare('SELECT revision FROM access_email_identities WHERE account_id=?').bind(result.account_id).first();if(row.purpose==='verify')await c.db.prepare('UPDATE access_email_settings SET qa_verified_at=?,qa_login_at=NULL,qa_account_id=?,qa_identity_revision=? WHERE id=1').bind(Date.now(),result.account_id,identity.revision).run();else await c.db.prepare('UPDATE access_email_settings SET qa_login_at=COALESCE(qa_login_at,?) WHERE id=1 AND qa_account_id=? AND qa_identity_revision=?').bind(Date.now(),result.account_id,identity.revision).run()}
   return reply({success:true,verified:true,new_account:result.new_account===true,replayed:result.replayed===true});
  }
  throw aeError('ACCESS_METHOD',405);
 }catch(error){const candidate=error.aeCode||error.code,known=typeof candidate==='string'&&/^ACCESS_[A-Z_]{1,60}$/.test(candidate)?candidate:'ACCESS_UNAVAILABLE';return reply({error:known==='ACCESS_QA_PENDING'?'Primero completá la confirmación y el ingreso de prueba.':known==='ACCESS_AUTH'?'Volvé a entrar a Mi Perfil.':known==='ACCESS_INVALID'?'Este enlace ya no está disponible. Pedí uno nuevo.':'No se pudo confirmar la operación. Tus accesos actuales se conservan.',code:known||'ACCESS_UNAVAILABLE'},[400,401,403,405,409,423,429].includes(error.status)?error.status:503)}
}
async function uadavAccountEmailRetention(env){
 if(!env.DB)return;const db=typeof env.DB.withSession==='function'?env.DB.withSession('first-primary'):env.DB;
 if(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audience_recovery_rotations'").first())await db.prepare('DELETE FROM audience_recovery_rotations WHERE request_id IN (SELECT request_id FROM audience_recovery_rotations WHERE expires_at<? LIMIT 25)').bind(Date.now()).run();
 if(!await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='access_email_outbox'").first())return;
 const marker=await db.prepare('SELECT schema_hash FROM access_email_settings WHERE id=1').first();aeRequire(marker?.schema_hash===AE_SCHEMA_HASH,'ACCESS_FOREIGN_SCHEMA',423);
 const now=Date.now();await db.batch([db.prepare("UPDATE access_email_outbox SET state='expired',sealed_payload=NULL,sealed_address=NULL,lease_owner=NULL,lease_until=0 WHERE id IN (SELECT id FROM access_email_outbox WHERE expires_at<=? AND state IN ('queued','sending','accepted','failed') LIMIT 25)").bind(now),db.prepare('DELETE FROM access_email_outbox WHERE id IN (SELECT id FROM access_email_outbox WHERE expires_at<? LIMIT 25)').bind(now-7*86400000),db.prepare('DELETE FROM access_email_rates WHERE bucket IN (SELECT bucket FROM access_email_rates WHERE resets_at<? LIMIT 25)').bind(now)]);
}
