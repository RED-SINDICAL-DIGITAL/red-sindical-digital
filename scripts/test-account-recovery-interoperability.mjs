import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from '../tests/sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url))).toString('base64'));
const DB=sqliteD1(),root='UAC-'+'9'.repeat(64),device='UAD-'+'8'.repeat(64),atomicSecret='UAC-'+'7'.repeat(64);
const env={DB};
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
async function request(secret,path='account/identity',method='GET',body){
 const response=await worker.fetch(new Request('https://isolated.example/api/'+path,{method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,{waitUntil(){}});
 return {status:response.status,data:await response.json()};
}
try{
 await request(root);
 const accountId=await hash(root);
 await DB.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,'{}',1,?)").bind(accountId,new Date().toISOString()).run();
 await DB.prepare("INSERT INTO audience_devices(credential_hash,id,account_id,name,created_at,expires_at) VALUES(?,'qa-device',?,'QA',?,0)").bind(await hash(device),accountId,Date.now()).run();
 assert.equal((await request(root)).data.recovery_version,0);
 const legacy=await request(device,'account/recovery','POST',{});
 assert.equal(legacy.status,200,JSON.stringify(legacy));
 assert.equal((await request(legacy.data.secret)).data.recovery_version,1);
 const stale=await request(device,'account/recovery/atomic','POST',{request_id:'11111111-1111-4111-8111-111111111111',new_secret:atomicSecret,expected_version:0});
 assert.equal(stale.status,409,'Stale atomic request must not overwrite a legacy rotation');
 assert.equal((await request(legacy.data.secret)).status,200);
 const fresh=await request(device,'account/recovery/atomic','POST',{request_id:'22222222-2222-4222-8222-222222222222',new_secret:atomicSecret,expected_version:1});
 assert.equal(fresh.status,200,JSON.stringify(fresh));
 assert.equal((await request(atomicSecret)).data.recovery_version,2);
 assert.equal((await request(legacy.data.secret)).status,401,'Atomic rotation must revoke prior legacy key');
 const secondLegacy=await request(device,'account/recovery','POST',{});
 assert.equal(secondLegacy.status,200,JSON.stringify(secondLegacy));
 assert.equal((await request(secondLegacy.data.secret)).data.recovery_version,3);
 assert.equal((await request(atomicSecret)).status,401,'Legacy rotation must revoke prior atomic key');
 const late=await request(device,'account/recovery/atomic','POST',{request_id:'33333333-3333-4333-8333-333333333333',new_secret:'UAC-'+'6'.repeat(64),expected_version:2});
 assert.equal(late.status,409,'Late atomic request must respect legacy version increments');
 console.log('PASS: legacy and atomic recovery use one version; both revoke old credentials; stale requests cannot supersede newer keys.');
}finally{DB.close()}
