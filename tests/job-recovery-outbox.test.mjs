import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomUUID} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
import {createJobRecoveryOutbox,JOB_RECOVERY_MIN_IDEMPOTENCY_MS} from '../scripts/job-recovery-outbox.mjs';
import {createBrevoStagingMail} from '../scripts/brevo-staging-mail.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker,uadavJobRedeemRecovery}=await loadWorker();
const digest=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
const job='JOB-OUTBOX-QA',recipient='owner@example.invalid',actor='a'.repeat(64),sealKey='b'.repeat(64),oldSecret='c'.repeat(64),newSecret='d'.repeat(64),account='e'.repeat(64);
async function fixture(){
 const DB=sqliteD1();let now=Date.now(),sessions=0;DB.withSession=mode=>{assert.equal(mode,'first-primary');sessions++;return DB};await DB.prepare('PRAGMA foreign_keys=ON').run();
 for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql','20261026_job_recovery_outbox.sql']){const s=await readFile(new URL('../migrations/staging/'+file,import.meta.url),'utf8');for(const sql of s.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await DB.prepare(sql).run()}
 // Actual account entry path installs its original schema; no external service.
 const env={DB,UADAV_DB:{get:async()=>null,put:async()=>{}},ACCOUNT_ALLOWED_ORIGINS:'https://uadav-stream-staging.pages.dev'};
 const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/account',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://uadav-stream-staging.pages.dev',Authorization:'Bearer UAC-'+account},body:JSON.stringify({data:{uadav_user_v11:{name:'LAB ficticio'}}})}),env,{});assert.equal(r.status,200);
 const schema=await readFile(new URL('../migrations/staging/20261024_job_accounts.sql',import.meta.url),'utf8');for(const sql of schema.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await DB.prepare(sql).run();
 const accountId=await digest('UAC-'+account);
 await DB.prepare("INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES('bolsa_trabajo',?,?,?)").bind(job,JSON.stringify({id:job,titulo:'LAB recuperación ficticia',contacto:recipient,activo:true}),new Date(now).toISOString()).run();
 await DB.prepare('INSERT INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,1,?)').bind(job,await digest(oldSecret),new Date(now).toISOString()).run();
 await DB.prepare("INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(job,accountId,new Date(now).toISOString()).run();
 const create=extra=>createJobRecoveryOutbox({db:DB,mode:'staging-only',encryptionKey:sealKey,clock:()=>now,...extra}),engine=create();
 const request=(extra={})=>({jobId:job,recipient,requestId:randomUUID(),actorHash:actor,...extra});
 const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
 const outbox=()=>DB.prepare('SELECT * FROM job_recovery_outbox ORDER BY created_at,id').all().then(x=>x.results);
 const provider=send=>({idempotencyWindowMs:86400000,send:send||(async()=>({id:'qa-provider-receipt'}))});
 return {DB,engine,env,create,request,count,outbox,provider,now:()=>now,advance:ms=>now+=ms,sessions:()=>sessions,close:()=>DB.close()};
}
test('staging mode, encryption key and provider retry contract fail before database access',async()=>{
 const db={prepare(){throw Error('DB must not be read')},withSession(){throw Error('DB must not be read')}};
 for(const extra of [{mode:undefined},{mode:'production'},{encryptionKey:'short'},{timeoutMs:6000}])assert.throws(()=>createJobRecoveryOutbox({db,mode:'staging-only',encryptionKey:sealKey,...extra}),{code:'JOB_RECOVERY_CONFIGURATION'});
 const f=await fixture();try{for(const adapter of [null,{send:async()=>{},idempotencyWindowMs:1000}])await assert.rejects(f.engine.dispatch(adapter),{code:'JOB_RECOVERY_PROVIDER'});assert.equal(await f.count('job_recovery_outbox'),0)}finally{f.close()}
});
test('enqueue stores a sealed payload and hash without activating a token or changing the old credential',async()=>{
 const f=await fixture();try{
  assert.deepEqual(await f.engine.enqueue(f.request()),{accepted:true});const rows=await f.outbox();assert.equal(rows.length,1);assert.equal(rows[0].state,'queued');
  assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_account_links'),1);assert.equal((await f.DB.prepare('SELECT secret_hash,revision FROM job_owner_credentials').first()).revision,1);
  const stored=JSON.stringify(rows);for(const secret of [recipient,oldSecret,newSecret,sealKey])assert(!stored.includes(secret));assert.match(rows[0].token_hash,/^[a-f0-9]{64}$/);assert(!stored.includes('"token":'));
  await assert.rejects(uadavJobRedeemRecovery(f.DB,{jobId:job,tokenHash:rows[0].token_hash,newSecretHash:await digest(newSecret),now:f.now()}),{jobCode:'JOB_RECOVERY_INVALID'});assert(f.sessions()>0);
 }finally{f.close()}
});
test('unknown job, wrong recipient and valid request have the same public-facing enqueue result',async()=>{
 const f=await fixture();try{
  for(const extra of [{jobId:'JOB-DOES-NOT-EXIST'},{recipient:'other@example.invalid'},{}])assert.deepEqual(await f.engine.enqueue(f.request(extra)),{accepted:true});assert.equal(await f.count('job_recovery_outbox'),1);
  for(const extra of [{recipient:'name\r\nInjected@example.invalid'},{requestId:'bad'},{actorHash:'bad'},{jobId:'../job'}])await assert.rejects(f.engine.enqueue(f.request(extra)),{code:'JOB_RECOVERY_INPUT'});
 }finally{f.close()}
});
test('repeated and simultaneous requests create one intent and no usable token',async()=>{
 const f=await fixture();try{
  const request=f.request();for(const r of await Promise.all([f.engine.enqueue(request),f.engine.enqueue(request),f.engine.enqueue(f.request({actorHash:'f'.repeat(64)}))]))assert.deepEqual(r,{accepted:true});
  assert.equal(await f.count('job_recovery_outbox'),1);assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_store_checks'),0);
  assert.deepEqual(await f.engine.enqueue(request),{accepted:true});assert.equal(await f.count('job_recovery_outbox'),1);
 }finally{f.close()}
});
test('an issuance SQL failure rolls back the whole intent; lost acknowledgement is idempotent',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{
  const batch=f.DB.batch;let once=true;f.DB.batch=async statements=>{if(once&&statements.some(s=>s.sql.startsWith('INSERT INTO job_recovery_outbox'))){once=false;if(lost){await batch(statements);throw Error('Synthetic lost acknowledgement')}return batch([...statements,f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('failure',0)")])}return batch(statements)};
  const request=f.request();if(lost)assert.deepEqual(await f.engine.enqueue(request),{accepted:true});else await assert.rejects(f.engine.enqueue(request),{code:'JOB_RECOVERY_STORAGE'});
  assert.equal(await f.count('job_recovery_outbox'),lost?1:0);assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);
  assert.deepEqual(await f.engine.enqueue(request),{accepted:true});assert.equal(await f.count('job_recovery_outbox'),1);
 }finally{f.close()}}
});
test('address or credential changes between reading and enqueue transaction cannot create stale recovery',async()=>{
 for(const kind of ['address','credential','deleted']){const f=await fixture();try{
  const batch=f.DB.batch;let once=true;f.DB.batch=async statements=>{if(once&&statements.some(s=>s.sql.startsWith('INSERT INTO job_recovery_outbox'))){once=false;if(kind==='address')await f.DB.prepare("UPDATE job_store_records SET revision=revision+1,data_json=json_set(data_json,'$.contacto','other@example.invalid')").run();if(kind==='credential')await f.DB.prepare('UPDATE job_owner_credentials SET revision=revision+1').run();if(kind==='deleted')await f.DB.prepare('DELETE FROM job_store_records').run()}return batch(statements)};
  assert.deepEqual(await f.engine.enqueue(f.request()),{accepted:true});assert.equal(await f.count('job_recovery_outbox'),0);assert.equal(await f.count('job_owner_recovery_v2'),0);
 }finally{f.close()}}
});
test('provider receipt records acceptance without changing access; possession consumes the new token once',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());let payload;const result=await f.engine.dispatch(f.provider(async request=>{payload=request.payload;assert.match(request.idempotencyKey,/^uadav-job-recovery\//);assert(request.signal instanceof AbortSignal);return {id:'provider-qa-1'}}));assert.deepEqual(result,{state:'accepted'});
  const [row]=await f.outbox();assert.equal(row.sealed_payload,null);assert.equal(row.provider_id,'provider-qa-1');assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);assert.equal(await f.count('job_account_links'),1);
  assert.equal(payload.to,recipient);assert.equal(await digest(payload.token),row.token_hash);
  const redeem=value=>f.engine.redeem({jobId:job,token:payload.token,newSecretHash:value.repeat(64)});const outcomes=await Promise.allSettled([redeem('1'),redeem('2')]);assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,2);assert.equal(await f.count('job_account_links'),0);
  assert.deepEqual(await f.engine.dispatch(f.provider(()=>{throw Error('Must not send again')})),{state:'idle'});
 }finally{f.close()}
});
test('simultaneous dispatchers lease one intent and send only once',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());let sent=0;const adapter=f.provider(async()=>{sent++;return{id:'one-receipt'}});const results=await Promise.all([f.engine.dispatch(adapter),f.engine.dispatch(adapter)]);assert.equal(results.filter(x=>x.state==='accepted').length,1);assert.equal(sent,1);assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_store_checks'),0);
 }finally{f.close()}
});
test('ambiguous provider failure retries the identical payload and key, without activating a token early',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());const delivered=new Map(),calls=[];const adapter=f.provider(async request=>{const value=JSON.stringify(request.payload);calls.push({key:request.idempotencyKey,value});if(!delivered.has(request.idempotencyKey)){delivered.set(request.idempotencyKey,value);throw Error('synthetic-private-transport-with-token-'+request.payload.token)}assert.equal(delivered.get(request.idempotencyKey),value);return{id:'same-receipt'}});
  const first=await f.engine.dispatch(adapter);assert.deepEqual(first,{state:'unconfirmed',error:'JOB_RECOVERY_SEND'});assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_account_links'),1);
  assert.deepEqual(await f.engine.dispatch(adapter),{state:'idle'});f.advance(5000);assert.deepEqual(await f.engine.dispatch(adapter),{state:'accepted'});assert.equal(delivered.size,1);assert.deepEqual(calls[0],calls[1]);assert.equal((await f.outbox())[0].last_error,null);
 }finally{f.close()}
});
test('missing or malformed provider receipts never activate tokens or leak provider details',async()=>{
 for(const receipt of [undefined,{}, {id:'private@example.invalid\r\nSQL'}]){const f=await fixture();try{
  await f.engine.enqueue(f.request());assert.deepEqual(await f.engine.dispatch(f.provider(async()=>receipt)),{state:'unconfirmed',error:'JOB_RECOVERY_RECEIPT'});assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal((await f.outbox())[0].last_error,'JOB_RECOVERY_RECEIPT');
 }finally{f.close()}}
});
test('provider timeout covers ignored cancellation, and exhausted attempts fail closed',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());const engine=f.create({timeoutMs:5});let signal;const adapter=f.provider(request=>{signal=request.signal;return new Promise(()=>{})});
  for(let attempt=1;attempt<=5;attempt++){assert.deepEqual(await engine.dispatch(adapter),{state:'unconfirmed',error:'JOB_RECOVERY_SEND'});assert(signal.aborted);f.advance(60000)}
  assert.equal((await f.outbox())[0].state,'failed');assert.equal((await f.outbox())[0].sealed_payload,null);assert.equal(await f.count('job_owner_recovery_v2'),0);assert.deepEqual(await engine.dispatch(adapter),{state:'idle'});
 }finally{f.close()}
});
test('provider-result acknowledgement loss reconciles audit state without changing credentials',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{
  await f.engine.enqueue(f.request());const batch=f.DB.batch;let once=true;f.DB.batch=async statements=>{if(once&&statements.some(s=>s.sql.startsWith("UPDATE job_recovery_outbox SET state='accepted'"))){once=false;if(lost){await batch(statements);throw Error('Synthetic lost acknowledgement')}return batch([...statements,f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('failure',0)")])}return batch(statements)};
  const accepted=new Set(),adapter=f.provider(async r=>{accepted.add(r.idempotencyKey);return{id:'accepted-before-db-ack'}});
  const first=await f.engine.dispatch(adapter);assert.equal(first.state,lost?'accepted':'unconfirmed');assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_account_links'),1);
  f.advance(5000);assert.equal((await f.engine.dispatch(adapter)).state,lost?'idle':'accepted');assert.equal(accepted.size,1);assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal((await f.outbox())[0].sealed_payload,null);
 }finally{f.close()}}
});
test('expired, modified or deleted sources cancel before sending; changes during sending cannot activate a token',async()=>{
 for(const scenario of ['expiry','edit','deleted','credential','during-send']){const f=await fixture();try{
  await f.engine.enqueue(f.request());let sent=0;
  if(scenario==='expiry')f.advance(15*60000);
  if(scenario==='edit')await f.DB.prepare('UPDATE job_store_records SET revision=revision+1').run();
  if(scenario==='deleted')await f.DB.prepare('DELETE FROM job_store_records').run();
  if(scenario==='credential')await f.DB.prepare('UPDATE job_owner_credentials SET revision=revision+1').run();
  const r=await f.engine.dispatch(f.provider(async()=>{sent++;await f.DB.prepare('UPDATE job_owner_credentials SET revision=revision+1').run();return{id:'already-sent-stale'}}));assert.equal(sent,scenario==='during-send'?1:0);assert.equal(r.state,scenario==='during-send'?'unconfirmed':'idle');assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_account_links'),scenario==='deleted'?0:1);
 }finally{f.close()}}
});
test('AES authentication binds pending payloads to their metadata and a wrong key never creates a token',async()=>{
 for(const scenario of ['cipher','metadata','key']){const f=await fixture();try{
  await f.engine.enqueue(f.request());if(scenario==='cipher')await f.DB.prepare("UPDATE job_recovery_outbox SET sealed_payload='{}'").run();if(scenario==='metadata')await f.DB.prepare('UPDATE job_recovery_outbox SET recipient_hash=?').bind('f'.repeat(64)).run();let sent=0;const engine=scenario==='key'?f.create({encryptionKey:'f'.repeat(64)}):f.engine;
  assert.deepEqual(await engine.dispatch(f.provider(async()=>{sent++;return{id:'must-not-send'}})),{state:'unconfirmed',error:'JOB_RECOVERY_PAYLOAD'});assert.equal(sent,0);assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal(await f.count('job_account_links'),1);
 }finally{f.close()}}
});
test('one dispatcher cannot release or overwrite another lease after its own authority changes',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());const result=await f.engine.dispatch(f.provider(async()=>{await f.DB.prepare("UPDATE job_recovery_outbox SET lease_owner='other-dispatcher',lease_until=?").bind(f.now()+30000).run();return{id:'stale-owner'}}));assert.equal(result.state,'unconfirmed');const [row]=await f.outbox();assert.equal(row.lease_owner,'other-dispatcher');assert.equal(row.state,'sending');assert.equal(await f.count('job_owner_recovery_v2'),0);
 }finally{f.close()}
});
test('the actor and per-job issuance limits are atomic and return the same accepted shape',async()=>{
 const f=await fixture();try{
  for(let i=0;i<5;i++)assert.deepEqual(await f.engine.enqueue(f.request({jobId:'JOB-UNKNOWN'})),{accepted:true});assert.deepEqual(await f.engine.enqueue(f.request()),{accepted:true});assert.equal(await f.count('job_recovery_outbox'),0);f.advance(10*60000);
  for(let i=0;i<3;i++){assert.deepEqual(await f.engine.enqueue(f.request()),{accepted:true});await f.DB.prepare("UPDATE job_recovery_outbox SET state='failed',sealed_payload=NULL").run()}
  const before=await f.count('job_recovery_outbox');for(const result of await Promise.all([f.engine.enqueue(f.request()),f.engine.enqueue(f.request({actorHash:'f'.repeat(64)}))]))assert.deepEqual(result,{accepted:true});assert.equal(await f.count('job_recovery_outbox'),before);assert.equal(await f.count('job_owner_recovery_v2'),0);
 }finally{f.close()}
});
test('an abandoned lease can retry; the draft is idempotent and the public recovery routes remain disabled',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());await f.DB.prepare("UPDATE job_recovery_outbox SET state='sending',attempts=1,lease_until=?,lease_owner='abandoned'").bind(f.now()+30000).run();assert.deepEqual(await f.engine.dispatch(f.provider()),{state:'idle'});f.advance(30001);assert.deepEqual(await f.engine.dispatch(f.provider()),{state:'accepted'});
  const schema=await readFile(new URL('../migrations/staging/20261026_job_recovery_outbox.sql',import.meta.url),'utf8');for(const sql of schema.replace(/--[^\n]*/g,'').split(';').filter(s=>s.trim()))await f.DB.prepare(sql).run();assert.equal(await f.count('job_recovery_outbox'),1);assert.equal((await f.DB.prepare('PRAGMA foreign_key_check').all()).results.length,0);
  for(const route of ['solicitar','restablecer']){const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/bolsa_trabajo/acceso/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),f.env,{});assert.equal(r.status,503)}
  assert(!await readFile(new URL('../worker.js',import.meta.url),'utf8').then(s=>s.includes('createJobRecoveryOutbox')));
 }finally{f.close()}
});
test('older recovery links are invalidated only in the successful possession-based redemption transaction',async()=>{
 const f=await fixture();try{
  const oldToken='5'.repeat(64);await f.DB.prepare('INSERT INTO job_owner_recovery_v2(token_hash,job_id,credential_revision,expires_at,created_at) VALUES(?,?,1,?,?)').bind(oldToken,job,f.now()+3600000,f.now()).run();await f.engine.enqueue(f.request());let token;
  await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}));assert.equal((await f.DB.prepare('SELECT consumed_at FROM job_owner_recovery_v2 WHERE token_hash=?').bind(oldToken).first()).consumed_at,null);
  const batch=f.DB.batch;let once=true;f.DB.batch=statements=>{if(once&&statements.some(s=>s.sql.startsWith("UPDATE job_recovery_outbox SET state='redeemed'"))){once=false;return batch([...statements,f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('redemption-failure',0)")])}return batch(statements)};
  await assert.rejects(f.engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)}),{code:'JOB_RECOVERY_COMMIT'});assert.equal((await f.DB.prepare('SELECT consumed_at FROM job_owner_recovery_v2 WHERE token_hash=?').bind(oldToken).first()).consumed_at,null);assert.equal(await f.count('job_owner_recovery_v2'),1);
  await f.engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)});assert.equal(await f.count('job_owner_recovery_v2'),1);assert.equal((await f.DB.prepare('SELECT consumed_at FROM job_owner_recovery_v2 WHERE token_hash=?').bind(oldToken).first()).consumed_at,f.now());
  await assert.rejects(uadavJobRedeemRecovery(f.DB,{jobId:job,tokenHash:oldToken,newSecretHash:'6'.repeat(64),now:f.now()}),{jobCode:'JOB_RECOVERY_INVALID'});assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,2);assert.equal(await f.count('job_account_links'),0);
 }finally{f.close()}
});
test('simultaneous requests for different jobs share an atomic actor limit of five',async()=>{
 const f=await fixture();try{
  const requests=[];for(let i=0;i<6;i++){const id='JOB-OUTBOX-LIMIT-'+i;await f.DB.prepare("INSERT INTO job_store_records(collection,id,data_json,updated_at) SELECT collection,?,json_set(data_json,'$.id',?),updated_at FROM job_store_records WHERE id=?").bind(id,id,job).run();await f.DB.prepare('INSERT INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) SELECT ?,secret_hash,revision,updated_at FROM job_owner_credentials WHERE job_id=?').bind(id,job).run();requests.push(f.request({jobId:id}))}
  for(const r of await Promise.all(requests.map(r=>f.engine.enqueue(r))))assert.deepEqual(r,{accepted:true});assert.equal(await f.count('job_recovery_outbox'),5);assert.equal(await f.count('job_owner_recovery_v2'),0);
 }finally{f.close()}
});
test('an accepted link expires without rotating access, and database errors never expose raw details',async()=>{
 const f=await fixture();try{
  await f.engine.enqueue(f.request());let token;assert.equal((await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}))).state,'accepted');f.advance(15*60000);
  await assert.rejects(f.engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)}),{code:'JOB_RECOVERY_INPUT'});assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);assert.equal(await f.count('job_account_links'),1);
  const broken={prepare(){throw Object.assign(Error('synthetic-private-SQL-details'),{code:123})}};const engine=createJobRecoveryOutbox({db:broken,encryptionKey:sealKey,mode:'staging-only'});await assert.rejects(engine.enqueue(f.request()),error=>error.code==='JOB_RECOVERY_STORAGE'&&!error.message.includes('private'));
 }finally{f.close()}
});

test('provider deduplication must cover token lifetime plus an in-flight lease and bounded request',async()=>{
 let reads=0;const engine=createJobRecoveryOutbox({db:{prepare(){reads++;throw Error('synthetic')}},mode:'staging-only',encryptionKey:sealKey});
 for(const window of [15*60000,JOB_RECOVERY_MIN_IDEMPOTENCY_MS-1])await assert.rejects(engine.dispatch({send:async()=>({id:'unused'}),idempotencyWindowMs:window}),{code:'JOB_RECOVERY_PROVIDER'});
 assert.equal(reads,0);
 const f=await fixture();try{await f.engine.enqueue(f.request());assert.equal((await f.engine.dispatch({...f.provider(),idempotencyWindowMs:30*60000})).state,'accepted')}finally{f.close()}
});

test('Brevo transport acceptance and existing D1 redemption compose without changing access before use',async()=>{
 const f=await fixture();let body;
 try{
  const adapter=createBrevoStagingMail({mode:'staging-only',apiKey:'synthetic-brevo-key-'+'x'.repeat(40),senderEmail:'acceso@correo-staging.uadavstream.com.ar',allowedRecipients:[recipient],clock:f.now,fetchImpl:async request=>{body=await request.json();return Response.json({messageId:'<synthetic-123@relay.example.invalid>'},{status:201})}});
  const engine=f.create({prepareDelivery:adapter.prepare});await engine.enqueue(f.request());assert.deepEqual(await engine.dispatch(adapter),{state:'accepted'});
  assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);assert.equal(await f.count('job_account_links'),1);
  const url=new URL(body.textContent.match(/https:\/\/uadav-stream-staging\.pages\.dev\/acceso-correo\.html#[^\s]+/)[0]),rawToken=new URLSearchParams(url.hash.slice(1)).get('token');
  const [row]=await f.outbox();assert.equal(await digest(rawToken),row.token_hash);assert.match(row.provider_id,/^brevo:[a-f0-9]{64}$/);assert.equal(row.sealed_payload,null);
  const attempt=value=>engine.redeem({jobId:job,token:rawToken,newSecretHash:value.repeat(64)});
  const results=await Promise.allSettled([attempt('6'),attempt('7')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,2);assert.equal(await f.count('job_account_links'),0);
 }finally{f.close()}
});

test('Brevo lost response and exhausted duplicate retries preserve access until the received token is redeemed',async()=>{
 const f=await fixture(),bodies=[];
 try{
  const adapter=createBrevoStagingMail({mode:'staging-only',apiKey:'synthetic-brevo-key-'+'x'.repeat(40),senderEmail:'acceso@correo-staging.uadavstream.com.ar',allowedRecipients:[recipient],clock:f.now,fetchImpl:async request=>{bodies.push(await request.text());if(bodies.length===1)throw Error('synthetic provider accepted but receipt lost');return Response.json({code:'duplicate_parameter',message:'synthetic private provider detail'},{status:400})}});
  const engine=f.create({prepareDelivery:adapter.prepare});await engine.enqueue(f.request());
  for(let i=0;i<5;i++){
   assert.equal((await engine.dispatch(adapter)).state,'unconfirmed');
   assert.equal(await f.count('job_owner_recovery_v2'),0);assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);assert.equal(await f.count('job_account_links'),1);
   f.advance(60000);
  }
  assert.equal(bodies.length,5);assert(bodies.every(body=>body===bodies[0]));const [row]=await f.outbox();assert.equal(row.state,'failed');assert.equal(row.sealed_payload,null);assert.equal(row.provider_id,null);
  const token=new URLSearchParams(new URL(JSON.parse(bodies[0]).textContent.match(/https:[^\s]+/)[0]).hash.slice(1)).get('token');
  assert.equal((await engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)})).revision,2);assert.equal((await f.outbox())[0].state,'redeemed');assert.equal(await f.count('job_account_links'),0);
  f.advance(30*60000);assert.equal((await engine.dispatch(adapter)).state,'idle');assert.equal(bodies.length,5);
 }finally{f.close()}
});

test('a queued token cannot be redeemed before a dispatch reservation; diagnostic codes and stored hashes are not email proof',async()=>{
 const f=await fixture();let token;try{const engine=f.create({prepareDelivery:async p=>{token=p.token;return {synthetic:true}}});await engine.enqueue(f.request());
  for(const candidate of [token,(await f.outbox())[0].token_hash,'123456','f'.repeat(64)])await assert.rejects(engine.redeem({jobId:job,token:candidate,newSecretHash:'6'.repeat(64)}),{code:'JOB_RECOVERY_INPUT'});
  assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);assert.equal(await f.count('job_account_links'),1);
 }finally{f.close()}
});
test('proof can be redeemed before the provider responds, including a subsequent lost response',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{await f.engine.enqueue(f.request());const result=await f.engine.dispatch(f.provider(async r=>{await f.engine.redeem({jobId:job,token:r.payload.token,newSecretHash:'6'.repeat(64)});if(lost)throw Error('synthetic lost response');return{id:'late-receipt'}}));assert.equal(result.state,'redeemed');assert.equal((await f.outbox())[0].state,'redeemed');assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,2);assert.equal(await f.count('job_account_links'),0);
 }finally{f.close()}}
});
test('lost redemption acknowledgement retries the same new credential without a second rotation; a different credential is rejected',async()=>{
 const f=await fixture();let token;try{await f.engine.enqueue(f.request());await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}));const batch=f.DB.batch;let once=true;f.DB.batch=async statements=>{const result=await batch(statements);if(once&&statements.some(s=>s.sql.startsWith("UPDATE job_recovery_outbox SET state='redeemed'"))){once=false;throw Error('synthetic lost redemption acknowledgement')}return result};
  const request={jobId:job,token,newSecretHash:'6'.repeat(64)};assert.equal((await f.engine.redeem(request)).replayed,true);assert.equal((await f.engine.redeem(request)).replayed,true);assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,2);await assert.rejects(f.engine.redeem({...request,newSecretHash:'7'.repeat(64)}),{code:'JOB_RECOVERY_INPUT'});assert.equal((await f.DB.prepare('SELECT secret_hash FROM job_owner_credentials').first()).secret_hash,'6'.repeat(64));
 }finally{f.close()}
});
test('accepted or uncertain mail cannot recover after a record/contact or credential revision changes',async()=>{
 for(const kind of ['record','credential','deleted']){const f=await fixture();let token;try{await f.engine.enqueue(f.request());await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}));
  if(kind==='record')await f.DB.prepare("UPDATE job_store_records SET revision=revision+1,data_json=json_set(data_json,'$.contacto','changed@example.invalid')").run();
  if(kind==='credential')await f.DB.prepare('UPDATE job_owner_credentials SET revision=revision+1').run();
  if(kind==='deleted')await f.DB.prepare('DELETE FROM job_store_records').run();
  await assert.rejects(f.engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)}),{code:'JOB_RECOVERY_INPUT'});assert.equal(await f.count('job_account_links'),kind==='deleted'?0:1);assert.equal((await f.DB.prepare('SELECT secret_hash FROM job_owner_credentials').first()).secret_hash,await digest(oldSecret));
 }finally{f.close()}}
});
test('source changes between proof lookup and commit roll back redemption and preserve the existing link',async()=>{
 const f=await fixture();let token;try{await f.engine.enqueue(f.request());await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}));const batch=f.DB.batch;let once=true;f.DB.batch=async statements=>{if(once&&statements.some(s=>s.sql.startsWith("UPDATE job_recovery_outbox SET state='redeemed'"))){once=false;await f.DB.prepare('UPDATE job_store_records SET revision=revision+1').run()}return batch(statements)};
  await assert.rejects(f.engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)}),{code:'JOB_RECOVERY_INPUT'});assert.equal((await f.outbox())[0].state,'accepted');assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1);assert.equal(await f.count('job_account_links'),1);
 }finally{f.close()}
});
test('the received token needs a new credential and a correct job; removing the account-link table does not create a migration',async()=>{
 const f=await fixture();let token;try{await f.engine.enqueue(f.request());await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}));for(const request of [{jobId:'JOB-OTHER',token,newSecretHash:'6'.repeat(64)},{jobId:job,token,newSecretHash:await digest(oldSecret)}])await assert.rejects(f.engine.redeem(request),{code:'JOB_RECOVERY_INPUT'});
  await f.DB.prepare('DROP TABLE job_account_links').run();assert.equal((await f.engine.redeem({jobId:job,token,newSecretHash:'6'.repeat(64)})).revision,2);assert.equal(await f.DB.prepare("SELECT name FROM sqlite_master WHERE name='job_account_links'").first(),null);
 }finally{f.close()}
});
test('invalid preparers, oversized envelopes and broken storage fail without exposing tokens or creating a recovery intent',async()=>{
 assert.throws(()=>createJobRecoveryOutbox({db:{},mode:'staging-only',encryptionKey:sealKey,prepareDelivery:'client-input'}),{code:'JOB_RECOVERY_CONFIGURATION'});
 for(const prepareDelivery of [async()=>null,async()=>{throw Error('private-email-token')},async()=>({body:'x'.repeat(9000)})]){const f=await fixture();try{await assert.rejects(f.create({prepareDelivery}).enqueue(f.request()),e=>e.code==='JOB_RECOVERY_PAYLOAD'&&!e.message.includes('private-email'));assert.equal(await f.count('job_recovery_outbox'),0);assert.equal((await f.DB.prepare('SELECT revision FROM job_owner_credentials').first()).revision,1)}finally{f.close()}}
});
test('a queued message retries identical bytes after a template/sender change; key rotation prevents sending it under another context',async()=>{
 for(const rotate of [false,true]){const f=await fixture(),bodies=[];try{const old=createBrevoStagingMail({mode:'staging-only',apiKey:'synthetic-brevo-key-'+'x'.repeat(40),senderEmail:'acceso@correo-staging.uadavstream.com.ar',allowedRecipients:[recipient],clock:f.now,fetchImpl:async request=>{bodies.push(await request.text());throw Error('synthetic lost response')}});
  const engine=f.create({prepareDelivery:async p=>{const snapshot=await old.prepare(p),body=JSON.parse(snapshot.body);body.subject='Plantilla anterior · recuperar oferta';const text=JSON.stringify(body);return {...snapshot,body:text,body_hash:await digest(text)}}});await engine.enqueue(f.request());await engine.dispatch(old);f.advance(5000);
  let nextCalls=0;const next=createBrevoStagingMail({mode:'staging-only',apiKey:'synthetic-brevo-key-'+(rotate?'z':'x').repeat(40),senderEmail:'nuevo@correo-staging.uadavstream.com.ar',allowedRecipients:[recipient],clock:f.now,fetchImpl:async request=>{nextCalls++;bodies.push(await request.text());return Response.json({messageId:'<snapshot-retry@relay.example.invalid>'},{status:201})}});
  const result=await f.create({prepareDelivery:next.prepare}).dispatch(next);assert.equal(result.state,rotate?'unconfirmed':'accepted');assert.equal(nextCalls,rotate?0:1);if(!rotate){assert.equal(bodies[1],bodies[0]);assert.equal(JSON.parse(bodies[1]).sender.email,'acceso@correo-staging.uadavstream.com.ar');assert.equal(JSON.parse(bodies[1]).subject,'Plantilla anterior · recuperar oferta')}
 }finally{f.close()}}
});

test('redemption changes the real private-inbox authority: old proof fails, the new proof works and the former account is not relinked',async()=>{
 const f=await fixture();let token;try{f.env.JOB_STORE_D1='true';await f.DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true') ON CONFLICT(key) DO UPDATE SET value='true'").run();
  const inbox=async secret=>{const r=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/bolsa_trabajo/mis-postulantes',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://uadav-stream-staging.pages.dev','CF-Connecting-IP':'203.0.113.117'},body:JSON.stringify({job_id:job,clave:secret})}),f.env,{});return{status:r.status,data:await r.json()}};
  const before=await inbox(oldSecret);assert.equal(before.status,200,JSON.stringify(before.data));await f.engine.enqueue(f.request());await f.engine.dispatch(f.provider(async r=>{token=r.payload.token;return{id:'audit-receipt'}}));
  await f.engine.redeem({jobId:job,token,newSecretHash:await digest(newSecret)});assert.notEqual((await inbox(oldSecret)).status,200);assert.equal((await inbox(newSecret)).status,200);assert.equal(await f.count('job_account_links'),0);
 }finally{f.close()}
});
