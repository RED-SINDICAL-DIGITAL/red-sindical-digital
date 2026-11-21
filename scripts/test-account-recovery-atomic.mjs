import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from '../tests/sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url))).toString('base64'));
const DB=sqliteD1();
const kv=new Map(),root='UAC-'+'a'.repeat(64),replacement='UAC-'+'b'.repeat(64),next='UAC-'+'c'.repeat(64),device='UAD-'+'d'.repeat(64);
const env={DB,UADAV_DB:{get:async key=>kv.get(key)||null,put:async(key,value)=>{kv.set(key,value)}}};
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
async function call(path,credential=root,method='GET',body){
 const response=await worker.fetch(new Request('https://isolated.example/api/'+path,{method,headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,{waitUntil(){}});
 return {status:response.status,data:await response.json()};
}
try{
 assert.equal((await call('account/identity')).status,404);
 const accountId=await digest(root);
 await DB.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,'{}',1,?)").bind(accountId,new Date().toISOString()).run();
 await DB.prepare("INSERT INTO audience_devices(credential_hash,id,account_id,name,created_at,expires_at) VALUES(?,'device-one',?,'Prueba',?,0)").bind(await digest(device),accountId,Date.now()).run();
 const initial=await call('account/identity');
 assert.equal(initial.status,200);
 assert.equal(initial.data.recovery_version,0);
 const requestId='12345678-1234-4123-8123-123456789abc';
 const first=await call('account/recovery/atomic',device,'POST',{request_id:requestId,new_secret:replacement,expected_version:0});
 assert.equal(first.status,200,JSON.stringify(first));
 assert.equal(first.data.recovery_version,1);
 assert.equal((await call('account/identity',replacement)).data.recovery_version,1);
 assert.equal((await call('account/identity',root)).status,401,'Old root token must be revoked');
 const repeat=await call('account/recovery/atomic',device,'POST',{request_id:requestId,new_secret:replacement,expected_version:0});
 assert.equal(repeat.status,200,'Idempotent retry with device credential');
 const wrong=await call('account/recovery/atomic',device,'POST',{request_id:'12345678-1234-4123-8123-123456789abd',new_secret:next,expected_version:0});
 assert.equal(wrong.status,409,'Stale renewal must not revoke current backup');
 assert.equal((await call('account/identity',replacement)).status,200);
 const second=await call('account/recovery/atomic',replacement,'POST',{request_id:'12345678-1234-4123-8123-123456789abe',new_secret:next,expected_version:1});
 assert.equal(second.status,200,JSON.stringify(second));
 assert.equal((await call('account/identity',replacement)).status,401);
 assert.equal((await call('account/identity',next)).data.recovery_version,2);
 const reused=await call('account/recovery/atomic',device,'POST',{request_id:'12345678-1234-4123-8123-123456789abf',new_secret:replacement,expected_version:2});
 assert.equal(reused.status,409,'A previously revoked code must not be reused');
 assert.equal((await call('account/identity',next)).data.recovery_version,2);
 const bad=await call('account/recovery/atomic',device,'POST',{request_id:'bad',new_secret:'UAC-invalid',expected_version:2});
 assert.equal(bad.status,429,'After five rotation attempts in one hour, further attempts must be rate-limited');
 console.log('PASS: atomic recovery, account version, root revocation, idempotency and stale conflicts (SQLite D1 adapter).');
}finally{DB.close()}
