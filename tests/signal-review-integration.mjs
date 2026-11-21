import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),values=new Map();
const env={DB,ADMIN_KEY:'staging-test-admin-only',UADAV_DB:{get:async key=>values.get(key)||null,put:async(key,value)=>values.set(key,value)}};
const request=(body,authorized=true)=>worker.fetch(new Request('https://isolated.example/api/signal-onboarding/applications',{method:body?'PATCH':'GET',headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});
const item={id:'TEST-1',stream_url:'https://streams.example/live',type:'radio',status:'pending',created_at:'2026-10-14T00:00:00Z'};
const reset=()=>DB.prepare('UPDATE signal_onboarding_applications SET data_json=? WHERE id=?').bind(JSON.stringify(item),item.id).run();
try{
 assert.equal((await request(null,false)).status,401);
 assert.equal((await request({id:item.id,status:'approved'},false)).status,401);
 assert.equal((await request()).status,200);
 await DB.prepare('INSERT INTO signal_onboarding_applications(id,stream_key,data_json,created_at) VALUES(?,?,?,?)').bind(item.id,item.stream_url,JSON.stringify(item),item.created_at).run();
 assert.equal((await request({id:item.id,status:'approved'})).status,200);
 assert.equal(values.has('radios'),false,'approval must not publish a signal');
 const prepare=DB.prepare.bind(DB);
 for(const mutation of [{status:'publishing'}, {status:'pending',review_note:'another administrator'}]){
  await reset();let injected=false;
  DB.prepare=sql=>{const statement=prepare(sql);if(sql.includes("data_json=? AND json_extract(data_json,'$.status') NOT IN")){
   const first=statement.first.bind(statement);statement.first=async()=>{injected=true;await prepare('UPDATE signal_onboarding_applications SET data_json=? WHERE id=?').bind(JSON.stringify({...item,...mutation}),item.id).run();return first();};
  }return statement;};
  assert.equal((await request({id:item.id,status:'rejected'})).status,409);
  assert.equal(injected,true);
  const saved=JSON.parse((await prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(item.id).first()).data_json);
  assert.equal(saved.status,mutation.status);
  if(mutation.review_note)assert.equal(saved.review_note,mutation.review_note);
  DB.prepare=prepare;
 }
 values.set('signal_onboarding_applications',JSON.stringify([{...item,id:'LEGACY'}]));
 assert.equal((await request({id:'LEGACY',status:'approved'})).status,409);
 assert.equal(JSON.parse(values.get('signal_onboarding_applications'))[0].status,'pending');
 console.log('PASS: actual Worker review routes + SQLite: authorization, approval without publication, concurrent publish/edit rejection, legacy preservation');
}finally{DB.close()}
