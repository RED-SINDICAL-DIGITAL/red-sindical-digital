import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {webcrypto} from 'node:crypto';
import {Script} from 'node:vm';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const temp=await mkdtemp(join(tmpdir(),'uadav-restore-qa-test-'));
let module;
try{const path=join(temp,'qa.mjs');await writeFile(path,await readFile(new URL('../releases/uadav-bolsa-restore-qa-11762.js',import.meta.url)));module=await import(pathToFileURL(path).href)}finally{await rm(temp,{recursive:true,force:true})}
const worker=module.default,key='synthetic-qa-key-'+'x'.repeat(48),url='https://uadav-restore-qa.uadavstream.workers.dev';
async function fixture(){
 const DB=sqliteD1();await DB.prepare('PRAGMA foreign_keys=ON').run();let sessions=0;DB.withSession=mode=>{assert.equal(mode,'first-primary');sessions++;return DB};
 const env={DB,QA_RESTORE_ONLY:'true',QA_RESTORE_KEY:key};
 const call=async(path,body={},options={})=>{
  const r=await worker.fetch(new Request((options.origin||url)+path,{method:options.method||'POST',headers:{'Content-Type':'application/json',...(options.credential===null?{}:{Authorization:'Bearer '+(options.credential||key)})},...((options.method||'POST')==='POST'?{body:JSON.stringify(body)}:{})}),options.env||env,{});
  const type=r.headers.get('content-type')||'';return {status:r.status,data:type.includes('application/json')?await r.json():await r.text(),headers:r.headers};
 };
 const initialize=()=>call('/initialize',{confirm:'PREPARAR_BASE_QA_VACIA'});
 const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
 return {DB,env,call,initialize,count,sessions:()=>sessions,close:()=>DB.close()};
}
test('the isolated adapter exports no platform entrypoints, rejects existing Worker hosts and exposes only its own UI/health',async()=>{
 assert.deepEqual(Object.keys(module),['default']);const f=await fixture();try{
  const health=await f.call('/health',{}, {method:'GET',credential:null});assert.equal(health.status,200);assert.equal(health.data.purpose,'disposable-d1-rehearsal');assert.match(health.data.core_sha256,/^[a-f0-9]{64}$/);
  for(const origin of ['https://uadav-api-staging.uadavstream.workers.dev','https://uadav-api.uadavstream.workers.dev','https://uadavstream.com.ar'])assert.equal((await f.call('/initialize',{}, {origin})).status,403);
  for(const path of ['/api/v7/export','/api/admin/backup/jobs/restore-missing','/api/bolsa_trabajo'])assert.equal((await f.call(path)).status,404);
  const page=await f.call('/',{}, {method:'GET',credential:null});assert.equal(page.status,200);assert.match(page.data,/SOLO BASE NUEVA DE QA/);assert.match(page.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
  const browserScript=page.data.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(browserScript);assert.doesNotThrow(()=>new Script(browserScript));
 }finally{f.close()}
});
test('explicit QA mode, a dedicated strong key and valid authentication are required before database access',async()=>{
 const f=await fixture();try{
  f.env.DB={prepare(){throw Error('Database must not be touched')}};
  assert.equal((await f.call('/status',{}, {credential:null})).status,401);
  assert.equal((await f.call('/status',{}, {credential:'incorrect'})).status,401);
  f.env.QA_RESTORE_ONLY='false';assert.equal((await f.call('/initialize')).status,503);
  f.env.QA_RESTORE_ONLY='true';f.env.QA_RESTORE_KEY='short';assert.equal((await f.call('/status')).status,503);
 }finally{f.close()}
});
test('a nonempty database is refused without altering its existing data or schema',async()=>{
 const f=await fixture();try{
  await f.DB.prepare('CREATE TABLE real_data(id INTEGER PRIMARY KEY,value TEXT)').run();await f.DB.prepare("INSERT INTO real_data VALUES(1,'preserved')").run();
  assert.equal((await f.initialize()).status,423);assert.equal((await f.DB.prepare('SELECT value FROM real_data WHERE id=1').first()).value,'preserved');
  assert.deepEqual((await f.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name),['real_data']);
 }finally{f.close()}
});
test('the empty database guard is rechecked inside the schema transaction when a table appears concurrently',async()=>{
 const f=await fixture();try{
  const batch=f.DB.batch;let injected=false;
  f.DB.batch=async statements=>{if(!injected&&statements.some(s=>s.sql.startsWith('CREATE TABLE qa_restore_guard'))){injected=true;await f.DB.prepare('CREATE TABLE concurrent_data(value TEXT)').run();await f.DB.prepare("INSERT INTO concurrent_data VALUES('preserved')").run()}return batch(statements)};
  assert.equal((await f.initialize()).status,409);
  assert.deepEqual((await f.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name),['concurrent_data']);
  assert.equal((await f.DB.prepare('SELECT value FROM concurrent_data').first()).value,'preserved');
 }finally{f.close()}
});
test('all six phases use the original restore route, preserve guards and credentials, roll back failures, retry and remain idempotent',async()=>{
 const f=await fixture(),nativeFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('External network must not be used')};
 try{
  assert.equal((await f.initialize()).status,200);assert.equal((await f.initialize()).status,200);
  assert.equal((await f.call('/step',{phase:2})).status,409);
  for(let phase=1;phase<=6;phase++){
   const r=await f.call('/step',{phase});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.phase,phase);assert.equal(r.data.messages.length,phase);assert.equal(r.data.complete,phase===6);
   assert(!JSON.stringify(r.data).includes(key));assert(!JSON.stringify(r.data).includes('@example.invalid'));
  }
  assert.equal(await f.count('job_store_records'),4);assert.equal(await f.count('job_owner_credentials'),2);assert.equal(await f.count('job_account_links'),4);assert.equal(await f.count('job_expiry_notices'),2);
  for(const phase of [1,2,3,4,5,6])assert.equal((await f.call('/step',{phase})).data.phase,6);
  assert.equal(await f.count('job_store_records'),4);assert(f.sessions()>0);
  const row=await f.DB.prepare('SELECT lease_until,lock_owner FROM qa_restore_guard').first();assert.equal(row.lease_until,0);assert.equal(row.lock_owner,null);
 }finally{globalThis.fetch=nativeFetch;f.close()}
});
test('foreign data added after preparation and another key cannot repurpose a marked QA database',async()=>{
 const f=await fixture();try{
  assert.equal((await f.initialize()).status,200);
  await f.DB.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES('unrelated','{}',1,'2026-10-25')").run();
  assert.equal((await f.call('/step',{phase:1})).status,423);assert.equal(await f.count('job_store_records'),0);
  f.env.QA_RESTORE_KEY='different-key-'+'z'.repeat(40);assert.equal((await f.call('/status',{}, {credential:f.env.QA_RESTORE_KEY})).status,423);
 }finally{f.close()}
});
test('leases serialize requests and malformed steps cannot trigger restoration or unlock another run',async()=>{
 const f=await fixture();try{
  assert.equal((await f.call('/initialize',{confirm:'wrong'})).status,412);assert.equal((await f.initialize()).status,200);
  for(const phase of [0,7,'bad',null])assert.equal((await f.call('/step',{phase})).status,400);
  await f.DB.prepare('UPDATE qa_restore_guard SET lease_until=?,lock_owner=?').bind(Date.now()+60000,'other-run').run();
  assert.equal((await f.call('/step',{phase:1})).status,409);assert.equal((await f.DB.prepare('SELECT lock_owner FROM qa_restore_guard').first()).lock_owner,'other-run');
  assert.equal(await f.count('job_store_records'),0);
 }finally{f.close()}
});
test('a committed restore can resume safely when its phase acknowledgement is lost',async()=>{
 const f=await fixture();try{
  assert.equal((await f.initialize()).status,200);
  for(let phase=1;phase<=4;phase++)assert.equal((await f.call('/step',{phase})).status,200);
  const prepare=f.DB.prepare;let fail=true;
  f.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('UPDATE qa_restore_guard SET phase=')){const run=statement.run;statement.run=()=>{if(fail&&statement.args[0]===5){fail=false;throw Error('Synthetic lost acknowledgement')}return run.call(statement)}}return statement};
  assert.equal((await f.call('/step',{phase:5})).status,503);assert.equal(await f.count('job_store_records'),4);
  assert.equal((await f.call('/status')).data.phase,4);
  assert.equal((await f.call('/step',{phase:5})).status,200);
  const final=await f.call('/step',{phase:6});assert.equal(final.status,200);assert.equal(final.data.complete,true);assert.deepEqual(final.data.counts,{offers:2,applications:2,credentials:2,links:4,notices:2});
  assert.equal(await f.count('job_store_records'),4);
 }finally{f.close()}
});
