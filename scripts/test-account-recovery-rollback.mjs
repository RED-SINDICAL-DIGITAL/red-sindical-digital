import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from '../tests/sqlite-d1.mjs';

globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../qa/admin-v2/worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1();
const root='UAC-'+'1'.repeat(64),device='UAD-'+'2'.repeat(64),candidate='UAC-'+'3'.repeat(64);
const env={DB};
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
async function call(secret,route='account/identity',method='GET',payload){
 const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})}),env,{waitUntil(){}});
 return {status:r.status,data:await r.json()};
}
const fails=async promise=>{
 try{const result=await promise;assert.ok(result.status>=500,'Synthetic DB failure must be reported, not accepted');}
 catch(error){assert.match(String(error),/Synthetic insert failure/);}
};
try{
 await call(root);
 const accountId=await digest(root);
 await DB.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,'{}',1,?)").bind(accountId,new Date().toISOString()).run();
 await DB.prepare("INSERT INTO audience_devices(credential_hash,id,account_id,name,created_at,expires_at) VALUES(?,'qa-device',?,'QA',?,0)").bind(await digest(device),accountId,Date.now()).run();
 const broken=()=>DB.prepare("CREATE TRIGGER fail_recovery_insert BEFORE INSERT ON audience_recovery_keys WHEN NEW.revoked_at IS NULL BEGIN SELECT RAISE(ABORT,'Synthetic insert failure'); END").run();
 const restore=()=>DB.prepare('DROP TRIGGER fail_recovery_insert').run();
 const verifyOld=async expected=>{
   assert.equal((await call(root)).status,200,'Original credential still works');
   assert.equal((await call(device)).data.recovery_version,expected,'Version must be unchanged');
   assert.equal((await DB.prepare("SELECT COUNT(*) AS n FROM audience_recovery_keys WHERE revoked_at IS NULL").first()).n,0,'No partial credential');
 };
 await broken();
 await fails(call(device,'account/recovery/atomic','POST',{request_id:'11111111-1111-4111-8111-111111111111',new_secret:candidate,expected_version:0}));
 await verifyOld(0);
 await restore();
 await broken();
 await fails(call(device,'account/recovery','POST',{}));
 await verifyOld(0);
 await restore();
 const committed=await call(device,'account/recovery/atomic','POST',{request_id:'22222222-2222-4222-8222-222222222222',new_secret:candidate,expected_version:0});
 assert.equal(committed.status,200,JSON.stringify(committed));
 assert.equal((await call(candidate)).data.recovery_version,1);
 assert.equal((await call(root)).status,401,'Only a successful transaction revokes original credential');
 console.log('PASS: failed D1 batches roll back both recovery routes, preserve original key/version, and allow later success.');
}finally{DB.close()}
