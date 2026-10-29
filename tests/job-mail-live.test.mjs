import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID,webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await loadWorker();
const SITE='https://uadav-api-staging.uadavstream.workers.dev',PAGES='https://uadav-stream-staging.pages.dev',ADMIN='/api/admin/jobs/email-recovery-qa',REDEEM='/api/qa/bolsa/email-recovery/redeem';
const key='synthetic-admin',seal='b'.repeat(64),apiKey='synthetic-brevo-key-'+'x'.repeat(40),recipient='operator@example.org';
const hash=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
const start=()=>({action:'start',request_id:randomUUID(),confirm:'OFERTA_FICTICIA_Y_CORREO_PROPIO'});
const action=(id,kind)=>({action:kind,request_id:id,confirm:'ENVIAR_ENLACE_A_CORREO_PROPIO'});
async function fixture(provider){
 const DB=sqliteD1(),calls=[],original=globalThis.fetch;
 for(const name of ['20261023_job_owner_credentials.sql','20261024_job_store.sql'])for(const sql of (await readFile(new URL('../migrations/staging/'+name,import.meta.url),'utf8')).replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(sql).run();
 await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();
 await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('cron:sentinel','unchanged')").run();
 const diagnostic={version:1,recipient_hash:await hash(recipient),verified_at:Date.now(),verification_hash:null,verification_owner:randomUUID()};
 await DB.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?)').bind('brevo:delivery:request:'+randomUUID(),JSON.stringify(diagnostic)).run();
 await DB.prepare("INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES('bolsa_trabajo','JOB-EXISTING-EXPIRY-QA',?,'unchanged')").bind(JSON.stringify({id:'JOB-EXISTING-EXPIRY-QA',titulo:'Existing synthetic expiry sentinel',activo:true,fecha_limite:'2026-10-26'})).run();
 const env={ADMIN_KEY:key,JOB_RECOVERY_ENCRYPTION_KEY:seal,BREVO_API_KEY:apiKey,BREVO_QA_RECIPIENT:recipient,JOB_STORE_D1:'true',DB,UADAV_DB:{get:async()=>null,put(){throw Error('KV writes forbidden')}}};
 DB.withSession=mode=>{assert.equal(mode,'first-primary');return DB};
 globalThis.fetch=async request=>{if(request.url===PAGES+'/email-access-version.json'){assert.equal(request.headers.get('Authorization'),null);assert.equal(request.headers.get('api-key'),null);return Response.json({scope:'email-recovery-receiver-staging',version:'11767.1',api_origin:SITE})}assert.equal(request.url,'https://api.brevo.com/v3/smtp/email');assert.equal(request.redirect,'manual');assert.equal(request.headers.get('api-key'),apiKey);assert.equal(request.headers.get('Authorization'),null);const body=await request.json();assert.deepEqual(body.to,[{email:recipient}]);assert.equal(body.sender.email,'acceso@correo-staging.uadavstream.com.ar');assert(!body.cc&&!body.bcc&&!body.attachment);const link=new URL(body.textContent.match(/https:\/\/[^\s]+/)[0]),fragment=new URLSearchParams(link.hash.slice(1));assert.equal(link.origin,PAGES);assert.equal(link.pathname,'/acceso-correo.html');calls.push({body,token:fragment.get('token'),job:fragment.get('job')});return provider?provider(request,body):Response.json({messageId:'<live-qa@relay.example.invalid>'},{status:201})};
 const call=async({route=ADMIN,method='GET',data,raw,host=SITE,origin=SITE,admin=key,peer='203.0.113.67',contentType='application/json'}={})=>{const response=await worker.fetch(new Request(host+route,{method,headers:{...(admin?{Authorization:'Bearer '+admin}:{}),...(origin?{Origin:origin}:{}),...(peer?{'CF-Connecting-IP':peer}:{}),'Content-Type':contentType},...(['GET','HEAD','OPTIONS'].includes(method)?{}:{body:raw??JSON.stringify(data??{})})}),env,{});return{status:response.status,headers:response.headers,data:response.status===204?null:await response.json()}};
 const post=data=>call({method:'POST',data});
 const seed=async()=>{const request=start(),r=await post(request);assert.equal(r.status,200,JSON.stringify(r.data));return{request,id:request.request_id,job:r.data.job_id}};
 const send=async()=>{const row=await seed();assert.equal((await post(action(row.id,'request'))).status,200);assert.equal((await post(action(row.id,'send'))).status,200);return row};
 const redeem=(row,extra={})=>call({route:REDEEM,method:'POST',origin:PAGES,admin:null,data:{job_id:row.job,token:calls.at(-1)?.token,new_secret:'c'.repeat(64),confirm:'RECUPERAR_OFERTA',...extra}});
 const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
 const credential=job=>DB.prepare('SELECT * FROM job_owner_credentials WHERE job_id=?').bind(job).first();
 const proof=()=>calls.at(-1);
 return{DB,env,calls,call,post,seed,send,redeem,count,credential,proof,close(){globalThis.fetch=original;DB.close()}};
}
test('private API rejects auth/origin/host before bindings; public confirmation has strict CORS and does not read Admin',async()=>{
 const env=new Proxy({ADMIN_KEY:key},{get(o,k){if(k==='ADMIN_KEY')return key;throw Error('Unexpected binding '+String(k))}});
 for(const [host,headers,status]of [[SITE,{},401],['https://uadav-api.uadavstream.workers.dev',{Authorization:'Bearer '+key},403],[SITE,{Authorization:'Bearer '+key,Origin:'https://evil.invalid'},403]])assert.equal((await worker.fetch(new Request(host+ADMIN,{headers}),env,{})).status,status);
 const noBindings=new Proxy({},{get(){throw Error('No binding access')}});
 for(const [origin,status]of [[PAGES,204],['https://evil.invalid',403]]){const r=await worker.fetch(new Request(SITE+REDEEM,{method:'OPTIONS',headers:{Origin:origin}}),noBindings,{});assert.equal(r.status,status);assert.notEqual(r.headers.get('Access-Control-Allow-Origin'),'*')}
 const page=await worker.fetch(new Request(SITE+'/qa/recuperacion-oferta'),noBindings,{});assert.equal(page.status,200);assert.equal(page.headers.get('Cache-Control'),'no-store');assert.match(page.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.match(await page.text(),/Generar y copiar clave privada/);
});
test('Admin missing-key readiness is read-only and never discloses a secret or creates schema',async()=>{
 const f=await fixture();try{delete f.env.JOB_RECOVERY_ENCRYPTION_KEY;const r=await f.call();assert.equal(r.status,200);assert.equal(r.data.ready,false);assert.equal(r.data.encryption_key_configured,false);assert.equal(f.calls.length,0);assert.equal(await f.DB.prepare("SELECT name FROM sqlite_master WHERE name='job_recovery_outbox'").first(),null);assert(!JSON.stringify(r.data).includes(recipient))}finally{f.close()}
});
test('maintenance, missing D1, migration, diagnostic or valid provider configuration cannot prepare or send',async()=>{
 const f=await fixture();try{for(const [name,value]of [['JOB_STORE_MAINTENANCE','true'],['JOB_STORE_D1','false'],['BREVO_QA_RECIPIENT','invalid'],['BREVO_API_KEY','short']]){const old=f.env[name];f.env[name]=value;assert.notEqual((await f.post(start())).status,200);f.env[name]=old}
 await f.DB.prepare("DELETE FROM job_store_meta WHERE key='migration_ready'").run();assert.equal((await f.call()).status,503);await f.DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();await f.DB.prepare("DELETE FROM job_store_meta WHERE key LIKE 'brevo:delivery:request:%'").run();assert.equal((await f.call()).data.ready,false);assert.equal((await f.post(start())).status,409);assert.equal(f.calls.length,0);
 }finally{f.close()}
});
test('strict JSON actions cannot select a recipient, URL, message, arbitrary offer or encryption key',async()=>{
 const f=await fixture();try{for(const extra of [{recipient:'evil@example.org'},{job_id:'JOB-EXISTING-EXPIRY-QA'},{url:SITE},{key:seal},{body:'text'},{headers:{}}])assert.equal((await f.post({...start(),...extra})).status,400);for(const data of [{...start(),confirm:'yes'},{...start(),request_id:[randomUUID()]},{action:'send'},[]])assert.equal((await f.post(data)).status,400);assert.equal((await f.call({method:'POST',raw:'x'.repeat(769)})).status,400);assert.equal((await f.call({method:'POST',data:start(),contentType:'text/plain'})).status,400);assert.equal((await f.call({method:'POST',data:start(),route:ADMIN+'?email=x'})).status,400);assert.equal(f.calls.length,0)}finally{f.close()}
});
test('preparing once creates only a closed synthetic offer, preserves existing records and returns no credential',async()=>{
 const f=await fixture();try{const sentinel=await f.DB.prepare("SELECT * FROM job_store_records WHERE id='JOB-EXISTING-EXPIRY-QA'").first(),x=await f.seed();assert.equal((await f.post(x.request)).data.job_id,x.job);assert.equal(await f.count('job_mail_live_qa'),1);assert.equal(await f.count('job_owner_credentials'),1);const row=await f.DB.prepare('SELECT data_json FROM job_store_records WHERE id=?').bind(x.job).first();assert.equal(JSON.parse(row.data_json).activo,false);const catalog=await f.call({route:'/api/bolsa_trabajo',admin:null});assert(!JSON.stringify(catalog.data).includes(x.job));assert.deepEqual(await f.DB.prepare("SELECT * FROM job_store_records WHERE id='JOB-EXISTING-EXPIRY-QA'").first(),sentinel);assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='cron:sentinel'").first()).value,'unchanged');const status=await f.call();for(const privateValue of [seal,apiKey,recipient,(await f.credential(x.job)).secret_hash])assert(!JSON.stringify(status.data).includes(privateValue));assert.equal(f.calls.length,0)}finally{f.close()}
});
test('schema installation SQL failure rolls back all new tables and a retry can prepare',async()=>{
 const f=await fixture();try{const batch=f.DB.batch;let fail=true;f.DB.batch=statements=>{if(fail&&statements.some(s=>s.sql.startsWith('CREATE TABLE job_mail_live_qa'))){fail=false;return batch([...statements,f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('synthetic-error',0)")])}return batch(statements)};const input=start();assert.equal((await f.post(input)).status,503);assert.equal(await f.DB.prepare("SELECT name FROM sqlite_master WHERE name='job_recovery_outbox'").first(),null);assert.equal((await f.post(input)).status,200);assert.equal(f.calls.length,0)}finally{f.close()}
});
test('an existing foreign outbox table is refused without attempting to migrate it',async()=>{
 const f=await fixture();try{await f.DB.prepare('CREATE TABLE job_recovery_outbox(private TEXT)').run();assert.equal((await f.post(start())).status,423);assert.equal(await f.DB.prepare("SELECT name FROM sqlite_master WHERE name='job_mail_live_qa'").first(),null);assert.equal(f.calls.length,0)}finally{f.close()}
});
test('request snapshots are encrypted and concurrent requests/dispatches issue only one mail',async()=>{
 const f=await fixture();try{const x=await f.seed();for(const r of await Promise.all([f.post(action(x.id,'request')),f.post(action(x.id,'request'))]))assert.equal(r.status,200);assert.equal(await f.count('job_recovery_outbox'),1);const before=await f.credential(x.job);for(const r of await Promise.all([f.post(action(x.id,'send')),f.post(action(x.id,'send'))]))assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(f.calls.length,1);assert.equal((await f.credential(x.job)).secret_hash,before.secret_hash);const stored=JSON.stringify((await f.DB.prepare('SELECT * FROM job_recovery_outbox').all()).results);for(const value of [f.proof().token,seal,apiKey,recipient])assert(!stored.includes(value));assert.equal((await f.call()).data.complete,false)}finally{f.close()}
});
test('a real received proof rotates access, validates both real inbox paths and records a safe completed report',async()=>{
 const f=await fixture();try{const x=await f.send(),before=await f.credential(x.job),r=await f.redeem(x);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.success,true);const after=await f.credential(x.job);assert.notEqual(after.secret_hash,before.secret_hash);assert.equal(after.revision,2);assert.equal(after.secret_hash,await hash('c'.repeat(64)));assert.equal((await f.DB.prepare('SELECT state FROM job_recovery_outbox').first()).state,'redeemed');const status=await f.call();assert.equal(status.data.complete,true);assert.equal(status.data.checks.length,4);assert.equal(status.data.recovery_enabled,false);for(const secret of [seal,apiKey,recipient,f.proof().token,'c'.repeat(64)])assert(!JSON.stringify(status.data).includes(secret));assert.equal((await f.redeem(x)).status,200);assert.equal((await f.credential(x.job)).revision,2);assert.equal((await f.redeem(x,{new_secret:'d'.repeat(64)})).status,400)}finally{f.close()}
});
test('the response-lost mail still works, and consulting or repeating send never calls the provider twice',async()=>{
 const f=await fixture(()=>{throw Error('Private synthetic response loss')});try{const x=await f.send();assert.equal(f.calls.length,1);const status=await f.call();assert.equal(status.data.provider_accepted,false);assert.equal(status.data.dispatch_reserved,true);await f.post(action(x.id,'send'));await f.call();assert.equal(f.calls.length,1);assert.equal((await f.redeem(x)).status,200);assert.equal((await f.call()).data.complete,true);assert.equal((await f.call()).data.provider_accepted,false)}finally{f.close()}
});
test('bad origins, missing peer, wrong job, diagnostic code and stored token hash cannot redeem',async()=>{
 const f=await fixture();try{const x=await f.send(),before=await f.credential(x.job),tokenHash=(await f.DB.prepare('SELECT token_hash FROM job_recovery_outbox').first()).token_hash;
 for(const data of [{job_id:'JOB-EXISTING-EXPIRY-QA'},{job_id:'JOB-QA-MAIL-LIVE-'+'0'.repeat(32)},{token:'123456'},{token:tokenHash},{new_secret:'invalid'},{confirm:'yes'},{recipient}])assert.equal((await f.redeem(x,data)).status,400);
 const body={job_id:x.job,token:f.proof().token,new_secret:'c'.repeat(64),confirm:'RECUPERAR_OFERTA'};for(const extra of [{origin:'https://evil.invalid'},{origin:null},{peer:null}])assert.equal((await f.call({route:REDEEM,method:'POST',data:body,admin:null,...extra})).status,403);assert.deepEqual(await f.credential(x.job),before);
 }finally{f.close()}
});
test('lost confirmation after the atomic rotation can be retried with the same browser-generated credential',async()=>{
 const f=await fixture();try{const x=await f.send(),prepare=f.DB.prepare;let fail=true;f.DB.prepare=sql=>{const s=prepare(sql);if(sql.startsWith('UPDATE job_mail_live_qa SET completed_at')){const run=s.run;s.run=async()=>{if(fail){fail=false;throw Error('Synthetic journal unavailable')}return run.call(s)}}return s};assert.equal((await f.redeem(x)).status,503);assert.equal((await f.credential(x.job)).revision,2);assert.equal((await f.redeem(x)).status,200);assert.equal((await f.credential(x.job)).revision,2);assert.equal((await f.call()).data.complete,true)}finally{f.close()}
});
test('contact, credential revision, token expiry and encryption context changes stop recovery',async()=>{
 for(const kind of ['contact','revision','expires','key']){const f=await fixture();try{const x=await f.send(),before=await f.credential(x.job);if(kind==='contact')await f.DB.prepare("UPDATE job_store_records SET data_json=json_set(data_json,'$.contacto_email','changed@example.org'),revision=revision+1 WHERE id=?").bind(x.job).run();if(kind==='revision')await f.DB.prepare('UPDATE job_owner_credentials SET revision=revision+1 WHERE job_id=?').bind(x.job).run();if(kind==='expires')await f.DB.prepare('UPDATE job_recovery_outbox SET expires_at=? WHERE job_id=?').bind(Date.now()-1,x.job).run();if(kind==='key')f.env.JOB_RECOVERY_ENCRYPTION_KEY='e'.repeat(64);assert.notEqual((await f.redeem(x)).status,200);assert.equal((await f.credential(x.job)).secret_hash,before.secret_hash)}finally{f.close()}}
});
test('a changed provider key blocks the queued immutable message before network access',async()=>{
 const f=await fixture();try{const x=await f.seed();await f.post(action(x.id,'request'));f.env.BREVO_API_KEY='synthetic-brevo-key-'+'z'.repeat(40);const r=await f.post(action(x.id,'send'));assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(f.calls.length,0);assert.equal((await f.credential(x.job)).revision,1);assert.equal(r.data.dispatch_reserved,true);assert.equal(r.data.provider_accepted,false)}finally{f.close()}
});
test('an uncertain dispatch reservation never authorizes a second provider call',async()=>{
 const f=await fixture();try{const x=await f.seed();await f.post(action(x.id,'request'));const prepare=f.DB.prepare;let lose=true;f.DB.prepare=sql=>{const s=prepare(sql);if(sql.startsWith('UPDATE job_mail_live_qa SET dispatch_at')){const run=s.run;s.run=async()=>{const result=await run.call(s);if(lose){lose=false;throw Error('Synthetic lost reservation acknowledgement')}return result}}return s};assert.equal((await f.post(action(x.id,'send'))).status,503);assert.equal(f.calls.length,0);assert.equal((await f.call()).data.dispatch_reserved,true);assert.equal((await f.post(action(x.id,'send'))).status,200);assert.equal(f.calls.length,0)}finally{f.close()}
});
test('two completed fixtures consume the daily quota atomically; the third cannot create another job',async()=>{
 const f=await fixture();try{const a=await f.send();assert.equal((await f.redeem(a)).status,200);const b=await f.send();assert.equal((await f.redeem(b,{new_secret:'d'.repeat(64)})).status,200);const rejected=await f.post(start());assert.equal(rejected.status,409);assert.equal(await f.count('job_mail_live_qa'),2);assert.equal(f.calls.length,2);assert.equal((await f.DB.prepare("SELECT hits FROM job_store_rates WHERE bucket LIKE 'mail-live-qa:daily:%'").first()).hits,2)}finally{f.close()}
});
test('public proof guessing is rate-limited from Cloudflare peer data and cannot change the original credential',async()=>{
 const f=await fixture();try{const x=await f.send(),before=await f.credential(x.job);for(let i=0;i<12;i++)assert.equal((await f.redeem(x,{token:'0'.repeat(64)})).status,400);assert.equal((await f.redeem(x,{token:'0'.repeat(64)})).status,429);assert.deepEqual(await f.credential(x.job),before)}finally{f.close()}
});
test('public operational recovery stays503 even after the private QA schema, provider and fixture are configured',async()=>{
 const f=await fixture();try{await f.send();for(const route of ['solicitar','restablecer'])assert.equal((await f.call({route:'/api/bolsa_trabajo/acceso/'+route,method:'POST',admin:null,data:{job_id:'JOB-EXISTING-EXPIRY-QA',email:recipient,token:'a'.repeat(64)}})).status,503)}finally{f.close()}
});
test('missing, redirected, oversized or foreign Pages receiver metadata prevents even fixture initialization',async()=>{
 for(const response of [()=>new Response('',{status:302,headers:{Location:'https://evil.invalid'}}),()=>Response.json({scope:'email-recovery-receiver-staging',version:'older',api_origin:SITE}),()=>Response.json({scope:'email-recovery-receiver-staging',version:'11767.1',api_origin:'https://evil.invalid'}),()=>Response.json({scope:'email-recovery-receiver-staging',version:'11767.1',api_origin:SITE,extra:'not allowed'}),()=>new Response('x'.repeat(1025),{headers:{'Content-Type':'application/json'}})]){const f=await fixture();try{const transport=globalThis.fetch;globalThis.fetch=r=>r.url===PAGES+'/email-access-version.json'?Promise.resolve(response()):transport(r);assert.equal((await f.post(start())).status,409);assert.equal(f.calls.length,0);assert.equal(await f.DB.prepare("SELECT name FROM sqlite_master WHERE name='job_mail_live_qa'").first(),null)}finally{f.close()}}
});
test('a removed receiver blocks dispatch without consuming its single reservation',async()=>{
 const f=await fixture();try{const x=await f.seed();await f.post(action(x.id,'request'));const transport=globalThis.fetch;globalThis.fetch=r=>r.url===PAGES+'/email-access-version.json'?Promise.resolve(new Response('',{status:404})):transport(r);assert.equal((await f.post(action(x.id,'send'))).status,409);assert.equal(f.calls.length,0);assert.equal((await f.call()).data.dispatch_reserved,false);globalThis.fetch=transport;assert.equal((await f.post(action(x.id,'send'))).status,200);assert.equal(f.calls.length,1)}finally{f.close()}
});
test('possession can complete recovery before the provider response; a late response preserves the completed result',async()=>{
 let release,notify;const observed=new Promise(r=>notify=r),f=await fixture(()=>{notify();return new Promise(r=>release=r)});try{const x=await f.seed();await f.post(action(x.id,'request'));const pending=f.post(action(x.id,'send'));await observed;assert.equal((await f.redeem(x)).status,200);release(Response.json({messageId:'<late-qa@relay.example.invalid>'},{status:201}));assert.equal((await pending).status,200);assert.equal((await f.call()).data.complete,true);assert.equal((await f.DB.prepare('SELECT state FROM job_recovery_outbox').first()).state,'redeemed');assert.equal((await f.credential(x.job)).revision,2)}finally{release?.(Response.json({messageId:'<late-qa@relay.example.invalid>'},{status:201}));f.close()}
});
test('recovered proof can be linked to Mi Perfil only by an explicit authenticated operation',async()=>{
 const f=await fixture();try{f.env.ACCOUNT_ALLOWED_ORIGINS=PAGES;const credential='UAC-'+'f'.repeat(64),created=await f.call({route:'/api/account',method:'POST',origin:PAGES,admin:credential,data:{data:{uadav_user_v11:{name:'Synthetic QA account'}}}});assert.equal(created.status,200);for(const sql of (await readFile(new URL('../migrations/staging/20261024_job_accounts.sql',import.meta.url),'utf8')).replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await f.DB.prepare(sql).run();const x=await f.send();assert.equal((await f.redeem(x)).status,200);assert.equal(await f.count('job_account_links'),0);const linked=await f.call({route:'/api/bolsa_trabajo/cuenta/vincular',method:'POST',origin:PAGES,admin:credential,data:{tipo:'oferta',id:x.job,clave:'c'.repeat(64),confirm:'VINCULAR_A_MI_CUENTA'}});assert.equal(linked.status,200,JSON.stringify(linked.data));assert.equal(await f.count('job_account_links'),1);const jobs=await f.call({route:'/api/bolsa_trabajo/cuenta',origin:PAGES,admin:credential});assert(jobs.data.items.some(x=>x.id===f.proof().job));assert.equal(f.calls.length,1)}finally{f.close()}
});
test('shared private inbox checks authority again when a credential changes during the candidate read',async()=>{
 const f=await fixture();try{const x=await f.send();assert.equal((await f.redeem(x)).status,200);const prepare=f.DB.prepare;let revoked=false;f.DB.prepare=sql=>{const s=prepare(sql);if(sql.startsWith('SELECT r.*,c.secret_hash FROM job_store_records')){const all=s.all;s.all=async()=>{const result=await all.call(s);if(s.args?.[0]==='postulaciones_trabajo'&&!revoked){revoked=true;await prepare('UPDATE job_owner_credentials SET secret_hash=?,revision=revision+1 WHERE job_id=?').bind('0'.repeat(64),x.job).run()}return result}}return s};const r=await f.call({route:'/api/bolsa_trabajo/mis-postulantes',method:'POST',admin:null,data:{job_id:x.job,clave:'c'.repeat(64)}});assert.equal(r.status,404);assert.equal(r.data.items,undefined);assert.equal(revoked,true)}finally{f.close()}
});
test('HTTP QA routes use private synthetic fixture, immutable dispatch and verified private inbox',async()=>{const f=await fixture();try{
 const caps=await f.call({route:'/api/bolsa_trabajo/acceso/capabilities',origin:PAGES,admin:null});assert.equal(caps.data.http_qa_enabled,false);
 assert.equal((await f.call({route:'/api/bolsa_trabajo/acceso/solicitar',method:'POST',origin:PAGES,admin:null,data:{}})).status,503);
 f.env.JOB_RECOVERY_HTTP_STAGING='qa-only';const row=await f.send();assert.equal(f.calls.length,1);const before=await f.credential(row.job);assert.equal(before.revision,1);
 const candidate='d'.repeat(64),tuple={job_id:row.job,token:f.proof().token,new_secret:candidate};const redeem=()=>f.call({route:'/api/bolsa_trabajo/acceso/restablecer',method:'POST',origin:PAGES,admin:null,data:tuple});const r=await redeem();assert.equal(r.status,200,JSON.stringify(r.data));assert.deepEqual(r.data,{success:true,job_id:row.job,revision:2});assert.equal((await redeem()).status,200);assert.equal((await f.credential(row.job)).secret_hash,await hash(candidate));assert.equal((await f.post({action:'status'})).status,400);const status=await f.call();assert.equal(status.data.complete,true);assert.equal(status.data.http_qa_flow,true);assert.equal(f.calls.length,1);assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='cron:sentinel'").first()).value,'unchanged');
 }finally{f.close()}});

test('embedded live QA selects the reserved offer and request when dispatching',async()=>{
 const f=await fixture();try{
  const x=await f.seed();await f.post(action(x.id,'request'));
  const prepare=f.DB.prepare;let selected=false;
  f.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('SELECT * FROM job_recovery_outbox WHERE state IN')){
   assert(sql.includes('AND job_id=? AND request_id=?'));const bind=statement.bind;
   statement.bind=(...args)=>{assert.deepEqual(args.slice(-2),[x.job,x.id]);selected=true;return bind.apply(statement,args)};
  }return statement};
  assert.equal((await f.post(action(x.id,'send'))).status,200);
  assert.equal(selected,true);assert.equal(f.calls.length,1);assert.equal(f.proof().job,x.job);
  assert.equal((await f.redeem(x)).status,200);assert.equal((await f.call()).data.complete,true);
 }finally{f.close()}
});
