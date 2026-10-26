import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker,uadavJobToday}=await loadWorker();
const ORIGIN='https://uadav-stream-staging.pages.dev',ACCOUNT='UAC-'+'c'.repeat(64),SCHEDULE='*/15 * * * *';
const hash=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
const event=()=>({cron:SCHEDULE,scheduledTime:Date.now()});
const yesterday=()=>new Date(Date.parse(uadavJobToday()+'T12:00:00Z')-86400000).toISOString().slice(0,10);
async function fixture(){
  const DB=sqliteD1(),kv=new Map(),reads=[],writes=[],env={DB,ADMIN_KEY:'synthetic-admin',ACCOUNT_ALLOWED_ORIGINS:ORIGIN,JOB_STAGING_CRON:'bolsa-only',UADAV_DB:{get:async key=>{reads.push(key);return kv.get(key)||null},put:async(key,value)=>{writes.push(key);kv.set(key,value)}}};
  const call=async({method='GET',credential=env.ADMIN_KEY,host='uadav-api-staging.uadavstream.workers.dev',route='admin/jobs/cron',body}={})=>{
    const response=await worker.fetch(new Request('https://'+host+'/api/'+route,{method,headers:{Origin:ORIGIN,'Content-Type':'application/json',...(credential?{Authorization:'Bearer '+credential}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
    return {status:response.status,data:await response.json(),headers:response.headers};
  };
  await DB.prepare('PRAGMA foreign_keys=ON').run();
  assert.equal((await call({route:'account',method:'POST',credential:ACCOUNT,body:{data:{uadav_user_v11:{name:'QA ficticia'}}}})).status,200);
  for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql','20261024_job_accounts.sql','20261024_job_expiry_notices.sql']){
    const sql=await readFile(new URL('../migrations/staging/'+file,import.meta.url),'utf8');
    for(const statement of sql.replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(statement).run();
  }
  await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();
  env.JOB_STORE_D1='true';reads.length=0;writes.length=0;
  const accountId=await hash(ACCOUNT);
  async function seed(id='JOB-CRON-A',patch={}){
    const job={id,titulo:'QA privada ficticia',activo:true,fecha_limite:yesterday(),contacto_email:'private@example.invalid',...patch};
    await DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,JSON.stringify(job),new Date().toISOString()).run();
    await DB.prepare("INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,accountId,new Date().toISOString()).run();return job;
  }
  const count=async table=>(await DB.prepare('SELECT COUNT(*) AS n FROM '+table).first()).n;
  const meta=async key=>{const row=await DB.prepare('SELECT value FROM job_store_meta WHERE key=?').bind(key).first();return row?JSON.parse(row.value):null};
  return {DB,env,reads,writes,call,seed,count,meta,accountId,close:()=>DB.close()};
}

test('default staging scheduled handler is disabled and cannot reach other modules or bindings',async()=>{
  const inaccessible=new Proxy({},{get(_target,name){if(name==='JOB_STAGING_CRON')return undefined;throw Error('Unexpected binding: '+String(name))}});
  assert.equal((await worker.scheduled(event(),inaccessible,{})).reason,'disabled');
  for(const [patch,reason] of [[{JOB_STAGING_CRON:'true'},'disabled'],[{JOB_STAGING_CRON:'bolsa-only',JOB_STORE_D1:'false'},'storage'],[{JOB_STAGING_CRON:'bolsa-only',JOB_STORE_D1:'true',JOB_STORE_MAINTENANCE:'true'},'maintenance']]){
    Object.defineProperty(patch,'DB',{get(){throw Error('DB must not be reached')}});assert.equal((await worker.scheduled(event(),patch,{})).reason,reason);
  }
  assert.equal((await worker.scheduled({...event(),cron:'* * * * *'},{JOB_STAGING_CRON:'bolsa-only'},{})).reason,'schedule');
  for(const scheduledTime of [undefined,NaN,Infinity,-1,'2026-10-25',1.5])assert.equal((await worker.scheduled({...event(),scheduledTime},{JOB_STAGING_CRON:'bolsa-only'},{})).reason,'event');
  for(const DB of [undefined,{withSession(){throw Error('private-session-detail')}}])await assert.rejects(()=>worker.scheduled(event(),{JOB_STAGING_CRON:'bolsa-only',JOB_STORE_D1:'true',DB},{}),e=>e.jobCode==='JOB_CRON_FAILED'&&!e.message.includes('private-session-detail'));
});

test('cron status authenticates before D1, rejects other hosts and has no execution endpoint',async()=>{
  const env={ADMIN_KEY:'synthetic-admin',JOB_STORE_D1:'false'};Object.defineProperty(env,'DB',{get(){throw Error('No database access')}});
  const call=async(method='GET',key='',host='uadav-api-staging.uadavstream.workers.dev')=>worker.fetch(new Request('https://'+host+'/api/admin/jobs/cron',{method,headers:key?{Authorization:'Bearer '+key}:{}}),env,{});
  assert.equal((await call()).status,401);assert.equal((await call('GET',env.ADMIN_KEY,'uadav-api.uadavstream.workers.dev')).status,403);
  for(const method of ['POST','PUT','DELETE']){const response=await call(method,env.ADMIN_KEY);assert.equal(response.status,405);assert.equal(response.headers.get('Allow'),'GET')}
  const response=await call('GET',env.ADMIN_KEY);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal((await response.json()).ready,false);
  const f=await fixture();try{
    const before=(await f.DB.prepare('SELECT total_changes() AS n').first()).n;
    f.env.JOB_STAGING_CRON='off';const status=await f.call();assert.equal(status.data.enabled,false);assert.equal(status.data.ready,true);
    assert.equal((await f.DB.prepare('SELECT total_changes() AS n').first()).n,before,'status is read-only');
    for(const route of ['acceso/solicitar','acceso/restablecer'])assert.equal((await f.call({route:'bolsa_trabajo/'+route,method:'POST',credential:'',body:{}})).status,503);
  }finally{f.close()}
});

test('scheduled maintenance expires only eligible offers, retains candidates and records private bounded outcomes',async()=>{
  const f=await fixture();try{
    await f.seed();
    await f.seed('JOB-CRON-HIDDEN',{estado:'oculta'});await f.seed('JOB-CRON-CLOSED',{estado:'cerrada_por_contratante'});await f.seed('JOB-CRON-ZERO',{activo:0});await f.seed('JOB-CRON-BAD-DATE',{fecha_limite:'2026-02-30'});
    const app={id:'POST-CRON-A',job_id:'JOB-CRON-A',estado:'recibida',email:'private-app@example.invalid',consent_scope:'job_application_v1'};
    await f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('postulaciones_trabajo',app.id,JSON.stringify(app),new Date().toISOString()).run();
    const source=(await f.DB.prepare("SELECT id,data_json FROM job_store_records WHERE id<>'JOB-CRON-A' ORDER BY id").all()).results;
    const sessions=[];f.DB.withSession=mode=>{sessions.push(mode);return f.DB};
    const tick=event(),result=await worker.scheduled(tick,f.env,{});assert.equal(result.executed,true);assert.equal(result.processed,1);assert.equal(result.emitted,1);assert.equal(await f.count('job_expiry_notices'),1);
    assert.deepEqual((await f.DB.prepare("SELECT id,data_json FROM job_store_records WHERE id<>'JOB-CRON-A' ORDER BY id").all()).results,source);
    const row=await f.DB.prepare("SELECT data_json FROM job_store_records WHERE id='JOB-CRON-A'").first();assert.equal(JSON.parse(row.data_json).estado,'vencida');
    const status=await f.call();assert.equal(status.data.last_run.status,'success');assert.equal(status.data.running,false);assert.equal(status.data.last_success.processed,1);assert.equal(await f.meta('cron:lease'),null);
    const wire=JSON.stringify(status.data);for(const value of [ACCOUNT,f.accountId,app.email,'private@example.invalid','JOB-CRON-A','QA privada ficticia'])assert(!wire.includes(value));
    assert(sessions.length>0&&sessions.every(mode=>mode==='first-primary'));assert.deepEqual(f.reads,[]);assert.deepEqual(f.writes,[]);
    assert.equal((await worker.scheduled(tick,f.env,{})).reason,'completed');assert.equal((await worker.scheduled({...tick,scheduledTime:tick.scheduledTime+900000},f.env,{})).emitted,0);assert.equal(await f.count('audience_announcements'),1);
  }finally{f.close()}
});

test('overlapping scheduled invocations are serialized by a database lease',async()=>{
  const f=await fixture();try{
    await f.seed();const prepare=f.DB.prepare;let resume,started,held=false;const gate=new Promise(resolve=>resume=resolve),waiting=new Promise(resolve=>started=resolve);
    f.DB.prepare=sql=>{const statement=prepare(sql),all=statement.all;if(sql.startsWith('SELECT r.*,c.secret_hash'))statement.all=async function(){if(!held){held=true;started();await gate}return all.call(this)};return statement};
    const tick=event(),first=worker.scheduled(tick,f.env,{});await waiting;
    assert.equal((await worker.scheduled(tick,f.env,{})).reason,'running');assert.equal((await f.call()).data.running,true);
    resume();assert.equal((await first).executed,true);f.DB.prepare=prepare;
    assert.equal(await f.count('audience_announcements'),1);assert.equal((await worker.scheduled(tick,f.env,{})).reason,'completed');
  }finally{f.close()}
});

test('failed notices roll back, scheduled errors stay generic and the same event can safely retry',async()=>{
  const f=await fixture();try{
    await f.seed();const batch=f.DB.batch;f.DB.batch=statements=>batch(statements.map(s=>s.sql.startsWith('INSERT OR IGNORE INTO audience_announcements')?f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('synthetic-error',0)"):s));
    const tick=event();await assert.rejects(()=>worker.scheduled(tick,f.env,{}),e=>e.jobCode==='JOB_CRON_FAILED'&&!/CHECK|synthetic-error|example.invalid/.test(e.message));
    assert.equal(await f.count('job_expiry_notices'),0);assert.equal(await f.count('audience_announcements'),0);assert.equal((await f.meta('cron:last_run')).status,'error');assert.equal(await f.meta('cron:last_success'),null);assert.equal(await f.meta('cron:lease'),null);
    f.DB.batch=batch;const retried=await worker.scheduled(tick,f.env,{});assert.equal(retried.processed,0,'expiry write already completed before the notice failure');assert.equal(retried.emitted,1);assert.equal(await f.count('audience_announcements'),1);
  }finally{f.close()}
});

test('lost acknowledgement after committing the run cannot overwrite its success or duplicate notices',async()=>{
  const f=await fixture();try{
    await f.seed();const batch=f.DB.batch;let lost=false;f.DB.batch=async statements=>{const result=await batch(statements);if(!lost&&statements.some(s=>s.sql.startsWith('INSERT INTO job_store_meta')&&s.args[0]==='cron:last_success')){lost=true;throw Error('Lost synthetic response')}return result};
    const tick=event();await assert.rejects(()=>worker.scheduled(tick,f.env,{}),e=>e.jobCode==='JOB_CRON_FAILED');f.DB.batch=batch;
    assert.equal((await f.meta('cron:last_run')).status,'success');assert.equal((await worker.scheduled(tick,f.env,{})).reason,'completed');assert.equal(await f.count('job_expiry_notices'),1);assert.equal(await f.count('audience_announcements'),1);
  }finally{f.close()}
});

test('expired leases recover; missing schemas and corrupt history fail before job changes',async()=>{
  const f=await fixture();try{
    await f.seed();await f.DB.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?)').bind('cron:lease',JSON.stringify({owner:crypto.randomUUID(),until:Date.now()-1,scheduled_time:Date.now()-900000,started_at:new Date(Date.now()-1000000).toISOString()})).run();
    assert.equal((await worker.scheduled(event(),f.env,{})).executed,true);assert.equal(await f.meta('cron:lease'),null);
  }finally{f.close()}
  for(const scenario of ['schema','null','invalid']){
    const x=await fixture();try{
      await x.seed();if(scenario==='schema')await x.DB.prepare('DROP TABLE job_expiry_notices').run();else await x.DB.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?)').bind('cron:last_success',scenario==='null'?'null':'{"private":"do-not-return"}').run();
      await assert.rejects(()=>worker.scheduled(event(),x.env,{}),e=>e.jobCode==='JOB_CRON_FAILED'&&!e.message.includes('do-not-return'));
      assert.equal(JSON.parse((await x.DB.prepare("SELECT data_json FROM job_store_records WHERE id='JOB-CRON-A'").first()).data_json).activo,true);
    }finally{x.close()}
  }
});

test('full cron at the 2000-offer bound stays under 50 D1 requests and progresses in small batches',async()=>{
  const f=await fixture();try{
    const statements=[],iso=new Date().toISOString(),deadline=yesterday();
    for(let i=0;i<2000;i++){const id='JOB-CRON-PAGE-'+String(i).padStart(4,'0');statements.push(f.DB.prepare('INSERT INTO job_store_records(collection,id,data_json,updated_at) VALUES(?,?,?,?)').bind('bolsa_trabajo',id,JSON.stringify({id,titulo:'QA',activo:true,fecha_limite:deadline}),iso),f.DB.prepare("INSERT INTO job_account_links(collection,record_id,account_id,linked_at) VALUES('bolsa_trabajo',?,?,?)").bind(id,f.accountId,iso))}
    for(let i=0;i<statements.length;i+=40)await f.DB.batch(statements.slice(i,i+40));
    const prepare=f.DB.prepare,batch=f.DB.batch;let requests=0;f.DB.prepare=sql=>{const statement=prepare(sql),run=statement.run;statement.run=function(...args){requests++;return run.apply(this,args)};return statement};f.DB.batch=statements=>{requests++;return batch(statements)};
    const result=await worker.scheduled(event(),f.env,{});assert.equal(result.processed,5);assert.equal(result.emitted,5);assert(requests<=50,'D1 requests: '+requests);
    f.DB.prepare=prepare;f.DB.batch=batch;assert.equal(await f.count('audience_announcements'),5);assert.equal(await f.count('job_store_records'),2000);
  }finally{f.close()}
});
