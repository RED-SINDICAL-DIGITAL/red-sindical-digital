import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from '../tests/sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url))).toString('base64'));
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
async function scenario(kind,index){
 const DB=sqliteD1();
 const root='UAC-'+String(index).repeat(64),device='UAD-'+String(index+3).repeat(64);
 const secrets=['UAC-'+String(index+5).repeat(64),'UAC-'+String(index+6).repeat(64)];
 const env={DB};
 async function call(key,route='account/identity',method='GET',body){
  const response=await worker.fetch(new Request('https://isolated.example/api/'+route,{
   method,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   ...(body?{body:JSON.stringify(body)}:{})
  }),env,{waitUntil(){}});
  return {status:response.status,data:await response.json()};
 }
 try{
  // Initiate schema creation before racing two separate requests.
  await call(root);
  const accountId=await digest(root);
  await DB.prepare("INSERT INTO audience_accounts(id,data_json,revision,updated_at) VALUES(?,'{}',1,?)").bind(accountId,new Date().toISOString()).run();
  await DB.prepare("INSERT INTO audience_devices(credential_hash,id,account_id,name,created_at,expires_at) VALUES(?,'qa-device',?,'QA',?,0)").bind(await digest(device),accountId,Date.now()).run();
  const run=(mode,n)=>mode==='atomic'
   ?call(device,'account/recovery/atomic','POST',{request_id:['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'][n],new_secret:secrets[n],expected_version:0})
   :call(device,'account/recovery','POST',{});
  const results=await Promise.all([run(kind[0],0),run(kind[1],1)]);
  const statuses=results.map(x=>x.status).sort((a,b)=>a-b);
  assert.deepEqual(statuses,[200,409],kind.join('-')+' must have exactly one winner: '+JSON.stringify(results));
  const winner=results.find(x=>x.status===200);
  const successfulSecret=winner.data.secret;
  assert.match(successfulSecret,/^UAC-[a-f0-9]{64}$/);
  assert.equal((await call(successfulSecret)).data.recovery_version,1,'Only one version increment');
  assert.equal((await call(root)).status,401,'Original key was revoked');
  const active=await DB.prepare('SELECT credential_hash FROM audience_recovery_keys WHERE account_id=? AND revoked_at IS NULL').bind(accountId).all();
  assert.equal(active.results.length,1,'Exactly one active recovery secret');
  assert.equal(active.results[0].credential_hash,await digest(successfulSecret));
  const losing=results.findIndex(x=>x.status===409);
  if(kind[losing]==='atomic')assert.notEqual((await call(secrets[losing])).status,200,'Loser must not activate its requested credential');
  assert.equal((await call(device)).data.recovery_version,1,'Existing device must keep access');
  console.log('PASS '+kind.join(' vs ')+': one successful renewal, one conflict, one active recovery key, device preserved.');
 }finally{DB.close()}
}
await scenario(['atomic','atomic'],1);
await scenario(['legacy','atomic'],2);
await scenario(['legacy','legacy'],3);
