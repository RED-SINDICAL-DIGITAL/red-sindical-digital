import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),values=new Map();
const item={id:'OLD-1',type:'tv',status:'approved',name:'Synthetic TV',stream_url:'https://stream.example/test.m3u8',rights_confirmed:true,created_at:'2026-10-14T00:00:00Z'};
const legacy=[item,{...item,id:'INVALID',rights_confirmed:false,stream_url:'https://stream.example/invalid'},{...item,id:'OTHER',stream_url:'https://stream.example/other',status:'publishing'}];
const original=JSON.stringify(legacy);values.set('signal_onboarding_applications',original);
const env={DB,ADMIN_KEY:'isolated-admin',UADAV_DB:{get:async k=>values.get(k)||null,put:async(k,v)=>values.set(k,v)}};
async function call(body={},admin=true){return worker.fetch(new Request('https://isolated.example/api/signal-onboarding/migrate',{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},body:JSON.stringify(body)}),env,{})}
try{
 assert.equal((await call({},false)).status,401);
 let result=await (await call()).json();assert.equal(result.dry_run,true);assert.equal(result.results[0].status,'ready');assert.equal(result.results[1].status,'needs_review');
 assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM signal_onboarding_applications').first()).n,0);
 result=await (await call({execute:true})).json();assert.equal(result.results[0].status,'migrated');
 assert.equal(JSON.parse((await DB.prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(item.id).first()).data_json).status,'approved');
 result=await (await call({execute:true})).json();assert.equal(result.results[0].status,'already_migrated');
 assert.equal(values.get('signal_onboarding_applications'),original);assert.equal(values.has('senales_oficiales'),false);
 values.set('signal_onboarding_applications',JSON.stringify([{...item,id:'URL-CONFLICT'}]));
 result=await (await call({execute:true})).json();assert.equal(result.results[0].status,'conflict');
 values.set('signal_onboarding_applications',JSON.stringify([{...item,id:'DUP-1'},{...item,id:'DUP-2'}]));
 result=await (await call()).json();assert.ok(result.results.every(x=>x.status==='needs_review'));
 assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM signal_onboarding_applications').first()).n,1);
 values.set('signal_onboarding_applications',original);
 // A failure while acquiring the catalog lock must not leave a publication stuck.
 const prepare=DB.prepare.bind(DB);DB.prepare=sql=>{const q=prepare(sql);if(sql.startsWith('CREATE TABLE IF NOT EXISTS signal_onboarding_catalog_locks'))q.run=async()=>{throw Error('injected lock storage failure')};return q;};
 const response=await worker.fetch(new Request('https://isolated.example/api/signal-onboarding/publish',{method:'POST',headers:{Authorization:'Bearer '+env.ADMIN_KEY,'Content-Type':'application/json'},body:JSON.stringify({id:item.id})}),env,{});
 assert.equal(response.status,503);
 assert.equal(JSON.parse((await prepare('SELECT data_json FROM signal_onboarding_applications WHERE id=?').bind(item.id).first()).data_json).status,'approved');
 console.log('PASS: Worker + SQLite migration preview, explicit execution, idempotency, legacy preservation and pre-lock failure recovery');
}finally{DB.close()}
