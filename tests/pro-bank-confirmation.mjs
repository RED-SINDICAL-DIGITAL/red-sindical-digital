import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHmac} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map();
const env={DB,ADMIN_KEY:'local-admin',PRO_BANK_CONFIRMATION_SECRET:'local-test-secret-'.repeat(4),PRO_BANK_ACCOUNT_ID:'local-recipient',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function request(route,method='GET',body,headers={}){
 const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...headers},...(body?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}),env,{});
 return {status:r.status,data:await r.json()};
}
async function bank(payload,{secret=env.PRO_BANK_CONFIRMATION_SECRET,timestamp=Date.now()}={}){
 const text=JSON.stringify(payload);
 const signature=createHmac('sha256',secret).update(String(timestamp)+'.'+text).digest('hex');
 return request('pro/bank-confirmation','POST',text,{'X-UADAV-Timestamp':String(timestamp),'X-UADAV-Signature':'sha256='+signature});
}
try{
 const payload={order_id:'QA-RETIRED',transaction_id:'local-test-tx',status:'credited',recipient_account_id:env.PRO_BANK_ACCOUNT_ID,amount:100,currency:'ARS'};
 for(const config of [{},{secret:'invalid-secret'},{timestamp:Date.now()-600000}]){
  const response=await bank(payload,config);
  assert.equal(response.status,410);
  assert.equal(response.data.code,'ARTIST_MEMBERSHIP_RETIRED');
 }
 const plan=await request('pro/payment-settings');
 assert.equal(plan.status,200);assert.equal(plan.data.enabled,false);assert.equal(plan.data.retired,true);
 const rows=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pro_payment_orders'").all();
 assert.equal(rows.results.length,0,'retired payments must not recreate historical order tables');
 console.log('PASS: signed legacy bank callbacks are retired (410), cannot activate PRO and do not create payment tables.');
}finally{DB.close()}
