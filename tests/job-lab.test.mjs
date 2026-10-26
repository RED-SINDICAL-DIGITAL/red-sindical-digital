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
const temp=await mkdtemp(join(tmpdir(),'uadav-bolsa-lab-test-'));
let module;
try{const path=join(temp,'lab.mjs');await writeFile(path,await readFile(new URL('../releases/uadav-bolsa-lab-11764.js',import.meta.url)));module=await import(pathToFileURL(path).href)}finally{await rm(temp,{recursive:true,force:true})}
const worker=module.default,key='synthetic-lab-key-'+'x'.repeat(48),url='https://uadav-bolsa-lab.uadavstream.workers.dev';
const counts=[0,2,2,9,2,2,2,1,6],parallel=new Set([1,2,4,5,6,8]);
async function fixture(){
 const DB=sqliteD1();await DB.prepare('PRAGMA foreign_keys=ON').run();let sessions=0;
 DB.withSession=mode=>{assert.equal(mode,'first-primary');sessions++;return DB};
 const env={DB,QA_BOLSA_ONLY:'true',QA_BOLSA_KEY:key};
 const call=async(path,body={},options={})=>{
  const method=options.method||'POST',r=await worker.fetch(new Request((options.host||url)+path,{method,headers:{'Content-Type':'application/json',...(options.credential===null?{}:{Authorization:'Bearer '+(options.credential||key)}),...(options.origin?{Origin:options.origin}:{})},...(method==='POST'?{body:options.raw??JSON.stringify(body)}:{})}),options.env||env,{});
  return {status:r.status,data:(r.headers.get('content-type')||'').includes('application/json')?await r.json():await r.text(),headers:r.headers};
 };
 const initialize=()=>call('/initialize',{confirm:'PREPARAR_BASE_FICTICIA_NUEVA'});
 const probe=(phase,slot)=>call('/probe',{phase,slot,confirm:'EJECUTAR_SOLO_DATOS_FICTICIOS'});
 const finish=phase=>call('/finish',{phase,confirm:'EJECUTAR_SOLO_DATOS_FICTICIOS'});
 const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
 const phase=async phase=>{const slots=Array.from({length:counts[phase]},(_,i)=>i);const results=[];if(parallel.has(phase))results.push(...await Promise.all(slots.map(slot=>probe(phase,slot))));else for(const slot of slots)results.push(await probe(phase,slot));for(let i=0;i<results.length;i++)assert.equal(results[i].status,200,JSON.stringify({phase,slot:i,...results[i]}));const r=await finish(phase);assert.equal(r.status,200,JSON.stringify({phase,...r}));return r};
 return {DB,env,call,initialize,probe,finish,phase,count,sessions:()=>sessions,close:()=>DB.close()};
}
test('the lab exports only its isolated entrypoint, rejects platform hosts, and serves a valid private UI',async()=>{
 assert.deepEqual(Object.keys(module),['default']);const f=await fixture();try{
  for(const host of ['https://uadav-api-staging.uadavstream.workers.dev','https://uadav-restore-qa.uadavstream.workers.dev','https://uadav-bolsa-lab.evil.example','http://uadav-bolsa-lab.uadavstream.workers.dev'])assert.equal((await f.call('/health',{}, {method:'GET',host})).status,403);
  for(const path of ['/api/bolsa_trabajo','/api/admin/backup/jobs/restore-missing','/step'])assert.equal((await f.call(path)).status,404);
  const page=await f.call('/',{}, {method:'GET',credential:null});assert.equal(page.status,200);assert.match(page.data,/SOLO DATOS FICTICIOS/);assert.match(page.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.equal(page.headers.get('Cache-Control'),'no-store');
  const script=page.data.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(script);assert.doesNotThrow(()=>new Script(script));assert(!/localStorage|sessionStorage|innerHTML/.test(script));
  const health=await f.call('/health',{}, {method:'GET',credential:null});assert.equal(health.data.purpose,'isolated-synthetic-bolsa');assert.equal(health.data.version,'11764-bolsa-lab-1');assert.equal(health.data.core_sha256,'c98d9c5bcffec76beb68fb4075f8b967c019667923c425081d794191f0cff90f');
 }finally{f.close()}
});
test('flag, dedicated key, origin and authentication are checked before accessing a database',async()=>{
 const f=await fixture();try{
  f.env.DB={prepare(){throw Error('DB must not be touched')},withSession(){throw Error('Session must not be opened')}};
  for(const credential of [null,'incorrect'])assert.equal((await f.call('/status',{}, {credential})).status,401);
  assert.equal((await f.call('/status',{}, {origin:'https://untrusted.invalid'})).status,403);
  f.env.QA_BOLSA_ONLY='false';assert.equal((await f.initialize()).status,503);
  f.env.QA_BOLSA_ONLY='true';f.env.QA_BOLSA_KEY='short';assert.equal((await f.call('/status')).status,503);
 }finally{f.close()}
});
test('nonempty databases and a table created during initialization are preserved and refused',async()=>{
 for(const concurrent of [false,true]){const f=await fixture();try{
  const foreign=async()=>{await f.DB.prepare('CREATE TABLE unrelated(value TEXT)').run();await f.DB.prepare("INSERT INTO unrelated VALUES('preserved')").run()};
  if(concurrent){const batch=f.DB.batch;let injected=false;f.DB.batch=async statements=>{if(!injected&&statements.some(s=>s.sql.startsWith('CREATE TABLE qa_bolsa_guard'))){injected=true;await foreign()}return batch(statements)}}else await foreign();
  assert.equal((await f.initialize()).status,concurrent?409:423);
  assert.deepEqual((await f.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name),['unrelated']);assert.equal((await f.DB.prepare('SELECT value FROM unrelated').first()).value,'preserved');
 }finally{f.close()}}
});
test('eight phases exercise atomic publication, application, account and artist isolation, revocation, redemption, rollback and rate limits',async()=>{
 const f=await fixture(),nativeFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('External network must not be used')};
 try{
  assert.equal((await f.initialize()).status,200);assert.equal((await f.initialize()).status,200);
  for(let phase=1;phase<=8;phase++){
   const result=await f.phase(phase);assert.equal(result.data.phase,phase);assert.equal(result.data.messages.length,phase);assert.equal(result.data.complete,phase===8);
   assert(!JSON.stringify(result.data).includes(key));assert(!JSON.stringify(result.data).includes('@example.invalid'));
   assert.equal((await f.finish(phase)).data.phase,phase);
  }
  assert.equal(await f.count('audience_accounts'),2);assert.equal(await f.count('job_owner_credentials'),3);assert.equal(await f.count('job_store_checks'),0);
  assert.equal((await f.DB.prepare("SELECT COUNT(*) AS n FROM job_store_records WHERE collection='bolsa_trabajo'").first()).n,3);
  assert.equal((await f.DB.prepare("SELECT revision FROM job_owner_credentials WHERE job_id='JOB-QA-LAB-RECOVERY'").first()).revision,3);
  assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM audience_devices WHERE revoked_at IS NOT NULL').first()).n,1);
  assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_owner_recovery_v2 WHERE consumed_at IS NOT NULL').first()).n,2);
  assert.equal((await f.DB.prepare('SELECT lease_until,lock_owner FROM qa_bolsa_guard').first()).lease_until,0);assert(f.sessions()>0);
 }finally{globalThis.fetch=nativeFetch;f.close()}
});
test('foreign accounts, records, schema and a different laboratory secret cannot repurpose initialized data',async()=>{
 for(const kind of ['account','record','table','key']){const f=await fixture();try{
  assert.equal((await f.initialize()).status,200);
  if(kind==='account')await f.DB.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES('foreign','{}',1,'2026-10-26')").run();
  if(kind==='record')await f.DB.prepare("INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES('bolsa_trabajo','JOB-FOREIGN','{}','2026-10-26')").run();
  if(kind==='table')await f.DB.prepare('CREATE TABLE unrelated(value TEXT)').run();
  if(kind==='key')f.env.QA_BOLSA_KEY='different-lab-key-'+'z'.repeat(48);
  const r=await f.call('/status',{}, {credential:f.env.QA_BOLSA_KEY});assert.equal(r.status,423,kind);assert.equal(await f.count('job_owner_credentials'),2);
 }finally{f.close()}}
});
test('invalid phases, malformed input, missing confirmations and held probe leases cannot perform work',async()=>{
 const f=await fixture();try{
  assert.equal((await f.call('/initialize',{confirm:'wrong'})).status,412);assert.equal((await f.initialize()).status,200);
  assert.equal((await f.call('/probe',{phase:1,slot:0})).status,412);
  for(const phase of [0,9,'1',null])assert.equal((await f.probe(phase,0)).status,400);
  for(const slot of [-1,2,'0',null])assert.equal((await f.probe(1,slot)).status,400);
  for(const raw of ['{','[]',JSON.stringify({pad:'x'.repeat(3000)})])assert.equal((await f.call('/probe',{}, {raw})).status,400);
  assert.equal((await f.probe(2,0)).status,409);assert.equal((await f.finish(1)).status,409);
  await f.DB.prepare("INSERT INTO qa_bolsa_attempts(phase,slot,state,lease_until,owner) VALUES(1,0,'pending',?,'other-probe')").bind(Date.now()+60000).run();
  assert.equal((await f.probe(1,0)).status,409);assert.equal((await f.DB.prepare('SELECT owner FROM qa_bolsa_attempts').first()).owner,'other-probe');assert.equal(await f.count('job_store_records'),2);
 }finally{f.close()}
});
test('completed probes replay without duplicate records and cannot release another finish lease',async()=>{
 const f=await fixture();try{
  assert.equal((await f.initialize()).status,200);const probes=await Promise.all([f.probe(1,0),f.probe(1,1)]);for(const r of probes)assert.equal(r.status,200,JSON.stringify(r.data));
  const before=await f.count('job_store_records');for(let slot=0;slot<2;slot++)assert.deepEqual((await f.probe(1,slot)).data,probes[slot].data);assert.equal(await f.count('job_store_records'),before);
  await f.DB.prepare("UPDATE qa_bolsa_guard SET lease_until=?,lock_owner='other-finish'").bind(Date.now()+60000).run();assert.equal((await f.finish(1)).status,409);assert.equal((await f.DB.prepare('SELECT lock_owner FROM qa_bolsa_guard').first()).lock_owner,'other-finish');
 }finally{f.close()}
});
test('a lost phase acknowledgement resumes from completed probes without rerunning the underlying mutation',async()=>{
 const f=await fixture();try{
  assert.equal((await f.initialize()).status,200);for(const r of await Promise.all([f.probe(1,0),f.probe(1,1)]))assert.equal(r.status,200,JSON.stringify(r.data));
  const prepare=f.DB.prepare;let fail=true;f.DB.prepare=sql=>{const s=prepare(sql);if(sql.startsWith('UPDATE qa_bolsa_guard SET phase=')){const run=s.run;s.run=()=>{if(fail){fail=false;throw Error('Synthetic lost acknowledgement')}return run.call(s)}}return s};
  assert.equal((await f.finish(1)).status,503);assert.equal((await f.call('/status')).data.phase,0);assert.equal(await f.count('job_store_records'),3);
  assert.equal((await f.finish(1)).status,200);assert.equal((await f.call('/status')).data.phase,1);assert.equal(await f.count('job_store_records'),3);
 }finally{f.close()}
});
