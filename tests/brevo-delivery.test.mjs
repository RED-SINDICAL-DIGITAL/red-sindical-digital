import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import vm from 'node:vm';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
const {default:worker,uadavJobToday}=await loadWorker();
const site='https://uadav-api-staging.uadavstream.workers.dev',path='/api/admin/jobs/email-delivery-check';
const admin='synthetic-admin',providerKey='synthetic-brevo-key-'+'x'.repeat(40),recipient='operator@example.org';
const prefix='brevo:delivery:request:',rateKey='brevo:delivery:daily';
const send=()=>({request_id:randomUUID(),confirm:'BREVO_ONE_REAL_EMAIL_TO_CONFIGURED_RECIPIENT'});
const accepted=()=>Response.json({messageId:'<synthetic-delivery@relay.example.invalid>'},{status:201});
async function fixture(provider){
 const DB=sqliteD1(),calls=[],original=globalThis.fetch;
 for(const name of ['20261023_job_owner_credentials.sql','20261024_job_store.sql'])for(const sql of (await readFile(new URL('../migrations/staging/'+name,import.meta.url),'utf8')).replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(sql).run();
 await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();
 await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('cron:sentinel','untouched-cron')").run();
 DB.withSession=mode=>{assert.equal(mode,'first-primary');return DB};
 const env={ADMIN_KEY:admin,BREVO_API_KEY:providerKey,BREVO_QA_RECIPIENT:recipient,JOB_STORE_D1:'true',DB,
  UADAV_DB:{get(){throw Error('No KV reads')},put(){throw Error('No KV writes')}}};
 const put=(key,value)=>DB.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(value)).run();
 const get=async key=>{const row=await DB.prepare('SELECT value FROM job_store_meta WHERE key=?').bind(key).first();return row?JSON.parse(row.value):null};
 await put('brevo:sandbox:request:'+randomUUID(),{version:1,state:'accepted',completed_at:Date.now(),receipt:'brevo:'+'a'.repeat(64)});
 globalThis.fetch=async request=>{
  assert.equal(request.url,'https://api.brevo.com/v3/smtp/email');assert.equal(request.redirect,'manual');assert.equal(request.credentials,'omit');assert.equal(request.headers.get('api-key'),providerKey);
  assert.equal(request.headers.get('Authorization'),null);assert.equal(request.headers.get('Cookie'),null);
  const sent=await request.clone().json();assert.deepEqual(sent.to,[{email:recipient}]);assert.equal(sent.sender.email,'acceso@correo-staging.uadavstream.com.ar');
  assert.equal(sent.headers['X-Sib-Sandbox'],undefined);assert.equal(Object.keys(sent.headers).length,1);assert.equal(sent.cc,undefined);assert.equal(sent.bcc,undefined);assert.equal(sent.attachment,undefined);assert.equal(sent.htmlContent,undefined);
  assert.doesNotMatch(sent.textContent,/https?:|acceso-correo|token=/);assert.match(sent.textContent,/No los envíes al chat/);
  const code=sent.textContent.match(/recepción: (\d{6})/)[1];calls.push({request,sent,code});return provider?provider(request,sent,code):accepted();
 };
 const call=async({method='GET',data,raw,host=site,key=admin,origin=site,route=path,contentType='application/json'}={})=>{
  const response=await worker.fetch(new Request(host+route,{method,headers:{...(key?{Authorization:'Bearer '+key}:{}),...(origin?{Origin:origin}:{}),'Content-Type':contentType},...(['GET','HEAD'].includes(method)?{}:{body:raw??JSON.stringify(data??{})})}),env,{});
  return{status:response.status,data:await response.json(),headers:response.headers};
 };
 const verify=(request_id,verification_code)=>call({method:'POST',data:{request_id,verification_code}});
 return{DB,env,calls,call,put,get,verify,close(){globalThis.fetch=original;DB.close()}};
}
test('delivery API gates Admin, exact host and same origin before other bindings; page is public without env data',async()=>{
 const env=new Proxy({ADMIN_KEY:admin},{get(t,k){if(k==='ADMIN_KEY')return t[k];throw Error('private binding read '+String(k))}});
 for(const [host,headers,status]of [[site,{},401],['https://uadav-api.uadavstream.workers.dev',{Authorization:'Bearer '+admin},403],[site,{Authorization:'Bearer '+admin,Origin:'https://evil.example'},403]])assert.equal((await worker.fetch(new Request(host+path,{headers}),env,{})).status,status);
 const response=await worker.fetch(new Request(site+'/qa/correo-real'),env,{}),html=await response.text();assert.equal(response.status,200);assert.match(html,/Enviar un correo de prueba/);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.doesNotMatch(html,/synthetic-admin|<script src=|%%NONCE%%/);
 assert.equal((await worker.fetch(new Request('https://uadav-api.uadavstream.workers.dev/qa/correo-real'),env,{})).status,403);
});
test('readiness is read-only, recipient/key configuration is private and invalid addresses cannot send',async()=>{
 const f=await fixture();try{assert.equal((await f.call()).data.ready,true);assert.equal(f.calls.length,0);assert.equal(await f.get(rateKey),null);
  for(const value of [undefined,'a@example.org\r\nBcc:evil@example.org','bad','a@bad..example','a@-bad.example']){f.env.BREVO_QA_RECIPIENT=value;const r=await f.call();assert.equal(r.data.ready,false);assert.equal(r.data.recipient_configured,false);assert.equal((await f.call({method:'POST',data:send()})).status,503)}
  f.env.BREVO_QA_RECIPIENT=recipient;delete f.env.BREVO_API_KEY;assert.equal((await f.call()).data.api_key_present,false);assert.equal(f.calls.length,0);
 }finally{f.close()}
});
test('maintenance, missing schema/migration and missing sandbox fail closed without writes or provider',async()=>{
 const f=await fixture();try{f.env.JOB_STORE_MAINTENANCE='true';assert.equal((await f.call({method:'POST',data:send()})).status,423);delete f.env.JOB_STORE_MAINTENANCE;f.env.JOB_STORE_D1='false';assert.equal((await f.call()).status,503);f.env.JOB_STORE_D1='true';
  await f.DB.prepare("DELETE FROM job_store_meta WHERE key='migration_ready'").run();assert.equal((await f.call()).status,503);await f.DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();
  await f.DB.prepare("DELETE FROM job_store_meta WHERE key LIKE 'brevo:sandbox:request:%'").run();assert.equal((await f.call()).data.sandbox_verified,false);assert.equal((await f.call({method:'POST',data:send()})).status,409);assert.equal(f.calls.length,0);assert.equal(await f.get(rateKey),null);
 }finally{f.close()}
});
test('client cannot select recipient, message, headers, mode, url or malformed action; explicit fixed confirmation is required',async()=>{
 const f=await fixture();try{for(const extra of [{to:'other@example.org'},{headers:{}},{body:'arbitrary'},{sandbox:true},{url:site},{verification_code:'123456'}])assert.equal((await f.call({method:'POST',data:{...send(),...extra}})).status,400);
  for(const data of [{...send(),confirm:'yes'},{request_id:[randomUUID()],confirm:'BREVO_ONE_REAL_EMAIL_TO_CONFIGURED_RECIPIENT'},{request_id:randomUUID(),verification_code:123456}])assert.equal((await f.call({method:'POST',data})).status,400);
  assert.equal((await f.call({method:'POST',data:send(),contentType:'text/plain'})).status,400);assert.equal((await f.call({method:'POST',raw:'x'.repeat(257)})).status,400);assert.equal((await f.call({route:path+'?to=x',method:'POST',data:send()})).status,400);assert.equal(f.calls.length,0);
 }finally{f.close()}
});
test('one explicit request uses only the configured recipient and stores no address, plaintext code or account token',async()=>{
 const f=await fixture();try{const b=send(),r=await f.call({method:'POST',data:b});assert.equal(r.status,200);assert.equal(r.data.result,'accepted');assert.equal(r.data.delivery_verified,false);assert.equal(r.data.recovery_enabled,false);assert.equal(r.data.remaining_today,1);assert.equal(f.calls.length,1);
  const row=await f.get(prefix+b.request_id),serialized=JSON.stringify(row);assert.doesNotMatch(serialized,/operator@example|synthetic-brevo/);assert(!serialized.includes(JSON.stringify(f.calls[0].code)));assert.match(row.verification_hash,/^[a-f0-9]{64}$/);assert.equal(row.verification_attempts,0);
  assert(!JSON.stringify(r.data).includes(JSON.stringify(f.calls[0].code)));assert(!JSON.stringify(r.data).includes(row.verification_hash));assert(!JSON.stringify(r.data).includes(recipient));
  for(const table of ['job_owner_credentials','job_owner_recovery_v2','job_store_records'])assert.equal((await f.DB.prepare('SELECT COUNT(*) AS count FROM '+table).first()).count,0);
  assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='cron:sentinel'").first()).value,'untouched-cron');
 }finally{f.close()}
});
test('replay, query, reload and concurrent new identifiers cannot resend an active email',async()=>{
 const f=await fixture();try{const b=send();const rs=await Promise.all([f.call({method:'POST',data:b}),f.call({method:'POST',data:b}),f.call({method:'POST',data:send()})]);assert(rs.every(r=>[200,202].includes(r.status)));assert.equal(f.calls.length,1);assert.equal((await f.get(rateKey)).count,1);
  const id=f.calls[0].sent.headers.idempotencyKey;assert.equal((await f.call()).data.active.request_id,id);assert.equal((await f.call({route:path+'?request_id='+id})).data.result,'accepted');await f.call({method:'POST',data:b});assert.equal(f.calls.length,1);
 }finally{f.close()}
});
test('correct email proof confirms once, clears its hash, and does not change any access credential',async()=>{
 const f=await fixture();try{const b=send();await f.call({method:'POST',data:b});const r=await f.verify(b.request_id,f.calls[0].code);assert.equal(r.data.result,'received');assert.equal(r.data.delivery_verified,true);assert.equal(r.data.recovery_enabled,false);assert.equal((await f.get(prefix+b.request_id)).verification_hash,null);assert.equal((await f.verify(b.request_id,f.calls[0].code)).status,409);assert.equal(f.calls.length,1);
 }finally{f.close()}
});
test('simultaneous correct codes consume the diagnostic receipt once',async()=>{
 const f=await fixture();try{const b=send();await f.call({method:'POST',data:b});const rs=await Promise.all([f.verify(b.request_id,f.calls[0].code),f.verify(b.request_id,f.calls[0].code),f.verify(b.request_id,f.calls[0].code)]);assert.equal(rs.filter(r=>r.status===200).length,1);assert.equal(rs.filter(r=>r.status===409).length,2);assert.equal((await f.get(prefix+b.request_id)).verification_attempts,1);
 }finally{f.close()}
});
test('wrong concurrent codes are capped atomically at five and cannot confirm or resend',async()=>{
 const f=await fixture();try{const b=send();await f.call({method:'POST',data:b});const bad=f.calls[0].code==='000000'?'111111':'000000';const rs=await Promise.all(Array.from({length:8},()=>f.verify(b.request_id,bad)));assert(rs.every(r=>r.status>=400));assert.equal((await f.get(prefix+b.request_id)).verification_attempts,5);assert.equal((await f.verify(b.request_id,f.calls[0].code)).status,429);assert.equal((await f.call({route:path+'?request_id='+b.request_id})).data.result,'locked');assert.equal(f.calls.length,1);
 }finally{f.close()}
});
test('real-email daily quota remains two after completed proofs and Argentina date resets without replaying old requests',async()=>{
 const f=await fixture(),realNow=Date.now;try{const b=send();for(let i=0;i<2;i++){const next=i?send():b;await f.call({method:'POST',data:next});assert.equal((await f.verify(next.request_id,f.calls[i].code)).data.result,'received')}assert.equal((await f.call({method:'POST',data:send()})).status,429);assert.equal(f.calls.length,2);
  const now=realNow();Date.now=()=>now+86400000;assert.equal((await f.call()).data.remaining_today,2);assert.equal((await f.call({method:'POST',data:b})).data.result,'received');assert.equal(f.calls.length,2);
 }finally{Date.now=realNow;f.close()}
});
test('expired proof, changed recipient and corrupted stored record cannot validate delivery',async()=>{
 const f=await fixture(),realNow=Date.now;try{const b=send();await f.call({method:'POST',data:b});f.env.BREVO_QA_RECIPIENT='another@example.org';assert.equal((await f.verify(b.request_id,f.calls[0].code)).status,409);f.env.BREVO_QA_RECIPIENT=recipient;
  const now=realNow();Date.now=()=>now+900001;assert.equal((await f.verify(b.request_id,f.calls[0].code)).status,410);Date.now=realNow;
  const row=await f.get(prefix+b.request_id);row.verification_hash='corrupt';await f.put(prefix+b.request_id,row);assert.equal((await f.call({route:path+'?request_id='+b.request_id})).status,503);assert.equal(f.calls.length,1);
 }finally{Date.now=realNow;f.close()}
});
test('provider error or lost response is sanitized and a received email can still prove reception without a retry',async()=>{
 const f=await fixture(()=>{throw Error('private raw '+providerKey+' '+recipient)});try{const b=send(),r=await f.call({method:'POST',data:b});assert.equal(r.data.result,'unconfirmed');assert.equal(r.data.delivery_verified,false);assert.equal(r.data.code,'MAIL_UNAVAILABLE');assert(!JSON.stringify(r.data).includes(providerKey));assert.equal((await f.verify(b.request_id,f.calls[0].code)).data.delivery_verified,true);assert.equal((await f.call({route:path+'?request_id='+b.request_id})).data.provider_accepted,false);assert.equal(f.calls.length,1);
 }finally{f.close()}
});
test('reservation rollback prevents sending and a lost reservation acknowledgement stays pending without sending',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{const batch=f.DB.batch;f.DB.batch=async statements=>{if(lost)await batch.call(f.DB,statements);throw Error('private reserve failure')};const b=send(),r=await f.call({method:'POST',data:b});assert.equal(r.status,lost?202:503);assert.equal(f.calls.length,0);assert.equal((await f.get(prefix+b.request_id))?.state,lost?'pending':undefined);assert.equal((await f.get(rateKey))?.count,lost?1:undefined);
 }finally{f.close()}}
});
test('lost provider-result acknowledgement reconciles persisted state; pre-commit failure never resends',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{const prepare=f.DB.prepare;f.DB.prepare=function(sql){const s=prepare.call(this,sql);if(sql.startsWith('UPDATE job_store_meta SET value=json_set(value,\'$.state\'')){const run=s.run;s.run=async function(){if(lost)await run.call(this);throw Error('private result failure')}}return s};const b=send(),r=await f.call({method:'POST',data:b});assert.equal(r.status,lost?200:503);assert.equal((await f.call({route:path+'?request_id='+b.request_id})).data.result,lost?'accepted':'pending');assert.equal(f.calls.length,1);await f.call({method:'POST',data:b});assert.equal(f.calls.length,1);
 }finally{f.close()}}
});
test('receipt can be confirmed while provider response is pending, and final provider write preserves confirmation',async()=>{
 let f,id;f=await fixture(async(_request,sent,code)=>{const proof=await f.verify(id,code);assert.equal(proof.data.result,'received');return accepted()});try{const b=send();id=b.request_id;const r=await f.call({method:'POST',data:b});assert.equal(r.data.result,'received');assert.equal(r.data.provider_accepted,true);assert.equal(r.data.delivery_verified,true);assert.equal((await f.get(prefix+id)).verification_hash,null);
 }finally{f.close()}
});
test('provider-result write cannot overwrite a changed reservation owner or invent acceptance',async()=>{
 let f,id;f=await fixture(async()=>{const row=await f.get(prefix+id);row.owner=randomUUID();await f.put(prefix+id,row);return accepted()});try{const b=send();id=b.request_id;const r=await f.call({method:'POST',data:b});assert.equal(r.status,503);assert.equal((await f.get(prefix+id)).state,'pending');assert.equal(f.calls.length,1);await f.call({method:'POST',data:b});assert.equal(f.calls.length,1)}finally{f.close()}
});
test('lost receipt acknowledgement is reconciled by its own nonce and failed SQL leaves the proof usable',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{const b=send();await f.call({method:'POST',data:b});const prepare=f.DB.prepare;f.DB.prepare=function(sql){const s=prepare.call(this,sql);if(sql.includes("'$.verification_owner'")){const first=s.first;s.first=async function(){if(lost)await first.call(this);throw Error('private verify failure')}}return s};const r=await f.verify(b.request_id,f.calls[0].code);assert.equal(r.status,lost?200:503);f.DB.prepare=prepare;assert.equal((await f.call({route:path+'?request_id='+b.request_id})).data.delivery_verified,lost);if(!lost)assert.equal((await f.verify(b.request_id,f.calls[0].code)).data.result,'received');assert.equal(f.calls.length,1);
 }finally{f.close()}}
});
test('retention deletes only old delivery records; malformed/future counters fail before provider',async()=>{
 const f=await fixture();try{const old=prefix+randomUUID();await f.put(old,{created_at:Date.now()-8*86400000});await f.call({method:'POST',data:send()});assert.equal(await f.get(old),null);assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='cron:sentinel'").first()).value,'untouched-cron');
  await f.put(rateKey,{version:1,day:'9999-01-01',count:1,request_id:randomUUID(),owner:randomUUID()});assert.equal((await f.call()).status,503);assert.equal(f.calls.length,1);
 }finally{f.close()}
});
test('public recovery remains503 with both email secrets present and draft outbox absent',async()=>{
 const f=await fixture();try{for(const name of ['solicitar','restablecer'])assert.equal((await f.call({method:'POST',key:'',route:'/api/bolsa_trabajo/acceso/'+name,data:{}})).status,503);assert.equal(f.calls.length,0)}finally{f.close()}
});
const html=await readFile(new URL('../scripts/brevo-delivery-page.html',import.meta.url),'utf8'),ui=html.match(/<script nonce="%%NONCE%%">([\s\S]*?)<\/script>/)[1];
const reply=data=>Response.json({build:'11766',scope:'brevo-delivery-staging',sandbox:false,recovery_enabled:false,delivery_verified:false,...data});
function page(fetchImpl){const nodes=new Map(),events={},requests=[],copied=[];const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',hidden:false,disabled:false,checked:false,focus(){this.focused=true},addEventListener(k,fn){this[k]=fn}});return nodes.get(id)};
 vm.runInNewContext(ui,{document:{getElementById:node},window:{addEventListener:(n,fn)=>events[n]=fn},fetch:async(url,options)=>{requests.push({url,options});return fetchImpl?fetchImpl(url,options):reply({result:'status',ready:true,recipient_configured:true,api_key_present:true,sandbox_verified:true,remaining_today:2})},navigator:{clipboard:{writeText:async text=>copied.push(text)}},crypto,Date,AbortController,setTimeout,clearTimeout,encodeURIComponent});
 const login=async()=>{node('adminKey').value=admin;await node('loginForm').submit({preventDefault(){}})};return{node,events,requests,copied,login};}
test('real-mail UI never sends on load/login and requires a fresh explicit checked authorization',async()=>{const p=page();assert.equal(p.requests.length,0);await p.login();assert.equal(p.node('adminKey').value,'');assert.equal(p.node('sendButton').disabled,true);await p.node('sendButton').onclick();assert.equal(p.requests.length,1);p.node('consent').checked=true;p.node('consent').change();assert.equal(p.node('sendButton').disabled,false)});
test('real-mail UI clears the code and copies only safe delivery flags without recipient, code or credentials',async()=>{
 const id=randomUUID();const p=page(async(_url,o)=>o.method==='GET'?reply({result:'status',ready:true,recipient_configured:true,api_key_present:true,sandbox_verified:true,remaining_today:2}):JSON.parse(o.body).verification_code?reply({result:'received',request_id:id,provider_accepted:true,delivery_verified:true,private_secret:providerKey,recipient}):reply({result:'accepted',request_id:id,provider_accepted:true,remaining_today:1}));await p.login();p.node('consent').checked=true;await p.node('sendButton').onclick();assert.equal(p.node('consent').checked,false);assert.equal(p.node('sendButton').disabled,true);assert.equal(p.node('receiptPanel').hidden,false);p.node('receiptCode').value='123456';await p.node('receiptForm').submit({preventDefault(){}});assert.equal(p.node('receiptCode').value,'');await p.node('copyButton').onclick();assert.equal(JSON.parse(p.copied[0]).delivery_verified,true);for(const secret of [admin,providerKey,recipient,'123456'])assert(!p.copied[0].includes(secret));
});
test('UI restores active request with GET without a resend and clears state on pagehide/logout',async()=>{
 const id=randomUUID();const p=page(async()=>reply({result:'status',ready:false,recipient_configured:true,api_key_present:true,sandbox_verified:true,remaining_today:1,active:{build:'11766',scope:'brevo-delivery-staging',sandbox:false,recovery_enabled:false,delivery_verified:false,result:'pending',request_id:id}}));await p.login();assert.equal(p.requests.length,1);assert.equal(p.node('receiptPanel').hidden,false);assert.equal(p.node('sendButton').disabled,true);p.node('receiptCode').value='123456';p.events.pagehide();assert.equal(p.node('receiptCode').value,'');assert.equal(p.node('loginPanel').hidden,false);assert.equal(p.node('copyButton').disabled,true);
});
test('UI rejects wrong scope or impossible received flags and clears reports after a failed confirmation',async()=>{
 for(const patch of [{scope:'production'},{sandbox:true},{recovery_enabled:true},{build:'11765'},{delivery_verified:true}]){const p=page(async(_url,o)=>o.method==='GET'?reply({result:'status',ready:true,recipient_configured:true,api_key_present:true,sandbox_verified:true,remaining_today:2}):reply({result:'accepted',request_id:randomUUID(),...patch}));await p.login();p.node('consent').checked=true;await p.node('sendButton').onclick();assert.equal(p.node('copyButton').disabled,true)}
 const p=page(async(_url,o)=>o.method==='GET'?reply({result:'status',ready:true,recipient_configured:true,api_key_present:true,sandbox_verified:true,remaining_today:2}):JSON.parse(o.body).verification_code?Response.json({error:'No coincide',code:'BREVO_RECEIPT_INVALID'},{status:400}):reply({result:'accepted',request_id:randomUUID()}));await p.login();p.node('consent').checked=true;await p.node('sendButton').onclick();p.node('receiptCode').value='123456';await p.node('receiptForm').submit({preventDefault(){}});assert.equal(p.node('copyButton').disabled,true);assert.equal(p.node('receiptCode').value,'');
});
test('logout while email request is pending prevents a late response from displaying or reopening the session',async()=>{let release;const p=page(async(_url,o)=>o.method==='GET'?reply({result:'status',ready:true,recipient_configured:true,api_key_present:true,sandbox_verified:true,remaining_today:2}):new Promise(resolve=>release=()=>resolve(reply({result:'accepted',request_id:randomUUID()}))));await p.login();p.node('consent').checked=true;const pending=p.node('sendButton').onclick();p.node('logoutButton').onclick();release();await pending;assert.equal(p.node('loginPanel').hidden,false);assert.equal(p.node('receiptPanel').hidden,true);assert.equal(p.node('copyButton').disabled,true);assert.equal(p.node('resultText').textContent,'')});
