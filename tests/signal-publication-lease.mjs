import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const realNow=Date.now;
for(const signalType of ['tv','radio']){
 const catalogKey=signalType==='radio'?'radios':'senales_oficiales';
for(const scenario of ['normal','expired-before-write','newer-attempt','recovery-changed','stale-catalog-snapshot','kv-ack-lost','d1-finalize-failed']){
 const DB=sqliteD1(),values=new Map();let writes=0,staleSnapshot=true,faultActive=true;
 const item={id:'LEASE-TEST',type:signalType,status:'approved',name:'Synthetic TV',stream_url:'https://stream.example/test.m3u8',created_at:'2026-10-14T00:00:00Z'};
 const env={DB,ADMIN_KEY:'isolated-admin',UADAV_DB:{get:async key=>{
  if(key===catalogKey&&scenario==='expired-before-write')Date.now=()=>realNow()+121000;
  if(key===catalogKey&&scenario==='stale-catalog-snapshot'&&writes>0&&staleSnapshot)return '[]';
  return values.get(key)||null;
 },put:async(key,value)=>{
  values.set(key,value);
  if(key===catalogKey){
   writes++;
   if(scenario==='kv-ack-lost'&&faultActive){faultActive=false;throw Error('Injected lost KV acknowledgement after storing catalog')}
   if(scenario==='newer-attempt'){
    await DB.prepare('UPDATE signal_onboarding_applications SET data_json=? WHERE id=?').bind(JSON.stringify({...item,status:'publishing',publication_token:'NEWER-ATTEMPT'}),item.id).run();
    await DB.prepare('UPDATE signal_onboarding_catalog_locks SET token=?,expires_at=? WHERE id=?').bind('NEWER-LOCK',realNow()+120000,'signal-catalog:'+signalType).run();
   }
  }
 }}};
 const call=(route,body)=>worker.fetch(new Request('https://isolated.example/api/'+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.ADMIN_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,{});
 try{
  await call('signal-onboarding/applications');
  await DB.prepare('INSERT INTO signal_onboarding_applications(id,stream_key,data_json,created_at) VALUES(?,?,?,?)').bind(item.id,item.stream_url,JSON.stringify(item),item.created_at).run();
  if(scenario==='recovery-changed'){
   const old={...item,status:'publishing',publication_token:'OLD-ATTEMPT',publication_attempt_at:new Date(realNow()-360000).toISOString()};
   await DB.prepare('UPDATE signal_onboarding_applications SET data_json=? WHERE id=?').bind(JSON.stringify(old),item.id).run();
   const prepare=DB.prepare.bind(DB);DB.prepare=sql=>{const q=prepare(sql);if(sql.includes('AND NOT EXISTS (SELECT 1 FROM signal_onboarding_catalog_locks')){const first=q.first.bind(q);q.first=async()=>{await prepare('UPDATE signal_onboarding_applications SET data_json=? WHERE id=?').bind(JSON.stringify({...old,publication_token:'NEWER-ATTEMPT'}),item.id).run();return first()}}return q};
   assert.equal((await call('signal-onboarding/recover',{id:item.id})).status,409);
   assert.equal(JSON.parse((await prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(item.id).first()).data_json).publication_token,'NEWER-ATTEMPT');
   continue;
  }
  if(scenario==='d1-finalize-failed'){
   const prepare=DB.prepare.bind(DB);DB.prepare=sql=>{const q=prepare(sql);if(sql.startsWith('UPDATE signal_onboarding_applications SET data_json=?')&&sql.includes('RETURNING id')){const first=q.first.bind(q);q.first=async()=>{if(writes>0&&faultActive){faultActive=false;throw Error('Injected D1 finalization failure')}return first()}}return q};
  }
  const response=await call('signal-onboarding/publish',{id:item.id});
  const current=JSON.parse((await DB.prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(item.id).first()).data_json);
  if(scenario==='kv-ack-lost'||scenario==='d1-finalize-failed'){
   assert.equal(response.status,503);assert.equal(current.status,'approved');assert.equal(writes,1);
   const saved=JSON.parse(values.get(catalogKey));assert.equal(saved.length,1);assert.equal(saved[0].onboarding_id,item.id);
   const retry=await call('signal-onboarding/publish',{id:item.id});assert.equal(retry.status,200);assert.equal((await retry.json()).reconciled,true);
   assert.equal(writes,1,'reconciliation must not append or rewrite catalog');
   const final=JSON.parse((await DB.prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(item.id).first()).data_json);assert.equal(final.status,'published');assert.equal(final.published_id,saved[0].id);
   assert.equal((await call('signal-onboarding/publish',{id:item.id})).status,409);
   assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM signal_onboarding_catalog_locks').first()).n,0,'lock must be released');
  }
  if(scenario==='normal'){assert.equal(response.status,200);assert.equal(current.status,'published');assert.equal(writes,1)}
  if(scenario==='stale-catalog-snapshot'){
   assert.equal(response.status,200);
   const next={...item,id:'SECOND-LEASE-TEST',stream_url:'https://stream.example/second.m3u8'};
   await DB.prepare('INSERT INTO signal_onboarding_applications(id,stream_key,data_json,created_at) VALUES(?,?,?,?)').bind(next.id,next.stream_url,JSON.stringify(next),next.created_at).run();
   const second=await call('signal-onboarding/publish',{id:next.id});assert.equal(second.status,503,'stale KV snapshot must not overwrite a committed publication');
   assert.equal((await second.json()).code,'CATALOG_SNAPSHOT_STALE');
   assert.equal(writes,1);assert.equal(JSON.parse(values.get(catalogKey))[0].onboarding_id,item.id);
   const retryable=JSON.parse((await DB.prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(next.id).first()).data_json);assert.equal(retryable.status,'approved');
   staleSnapshot=false;assert.equal((await call('signal-onboarding/publish',{id:next.id})).status,200);
   assert.equal(writes,2);assert.equal(JSON.parse(values.get(catalogKey)).length,2,'fresh retry must preserve both catalog entries');
  }
  if(scenario==='expired-before-write'){assert.equal(response.status,503);assert.equal(current.status,'approved');assert.equal(writes,0,'expired operation must not start a KV write')}
  if(scenario==='newer-attempt'){
   assert.equal(response.status,503);assert.equal(current.status,'publishing');assert.equal(current.publication_token,'NEWER-ATTEMPT');
   assert.equal((await DB.prepare('SELECT token FROM signal_onboarding_catalog_locks WHERE id=?').bind('signal-catalog:'+signalType).first()).token,'NEWER-LOCK');
  }
 }finally{Date.now=realNow;DB.close()}
}
}
console.log('PASS: radio and TV actual Worker + SQLite: normal publication, expired lease, newer ownership, recovery race, stale KV rejection, successful fresh retry, lost KV acknowledgement and interrupted D1 finalization');
