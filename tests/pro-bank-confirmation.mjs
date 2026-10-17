import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHmac,createHash} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),credential='UAC-'+'a'.repeat(64);let failCatalog=false;
const env={DB,ADMIN_KEY:'local-admin',PRO_BANK_CONFIRMATION_SECRET:'local-test-secret-'.repeat(4),PRO_BANK_ACCOUNT_ID:'local-recipient',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>{if(k==='artistas'&&failCatalog){failCatalog=false;throw Error('synthetic KV interruption')}kv.set(k,v)}}};
async function request(route,method='GET',body,headers={}){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...headers},...(body?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:await r.json()};}
async function bank(payload,options={}){const text=JSON.stringify(payload),timestamp=String(options.timestamp??Date.now()),signature=createHmac('sha256',options.secret||env.PRO_BANK_CONFIRMATION_SECRET).update(timestamp+'.'+text).digest('hex');return request('pro/bank-confirmation','POST',text,{'X-UADAV-Timestamp':timestamp,'X-UADAV-Signature':'sha256='+signature});}
try{
 assert.equal((await request('account','POST',{data:{uadav_user_v11:{name:'Synthetic bank test'}}},{Authorization:'Bearer '+credential})).status,200);
 const account=createHash('sha256').update(credential).digest('hex');
 await request('pro/payment-settings');
 const now=new Date().toISOString();
 for(const id of ['QA-BANK-A','QA-BANK-B','QA-BANK-OWNER','QA-BANK-RECOVERY']){
  await DB.prepare('INSERT INTO audience_artist_links(account_id,artist_id,claim_id,expires_at,created_at) VALUES(?,?,NULL,0,?)').bind(account,id,Date.now()).run();
  await DB.prepare("INSERT INTO pro_payment_orders(id,artist_id,account_id,plan_period,duration_days,amount,currency,status,created_at,updated_at) VALUES(?,?,?,'monthly',30,100,'ARS','pending',?,?)").bind(id,id,account,now,now).run();
 }
 const payload={order_id:'QA-BANK-A',transaction_id:'local-tx-1',status:'credited',recipient_account_id:env.PRO_BANK_ACCOUNT_ID,amount:100,currency:'ARS'};
 assert.equal((await bank(payload,{secret:'invalid-secret'})).status,401);
 assert.equal((await bank(payload,{timestamp:Date.now()-600000})).status,401);
 for(const patch of [{amount:99},{currency:'USD'},{recipient_account_id:'wrong'},{status:'pending'}])assert.equal((await bank({...payload,...patch})).status,422);
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM pro_payment_fulfillments').first()).n,0);
 assert.equal((await bank(payload)).status,200);
 const expiry=(await DB.prepare('SELECT pro_expires_at FROM artist_plan_state WHERE artist_id=?').bind('QA-BANK-A').first()).pro_expires_at;
 assert.equal((await bank(payload)).status,200);
 assert.equal((await DB.prepare('SELECT pro_expires_at FROM artist_plan_state WHERE artist_id=?').bind('QA-BANK-A').first()).pro_expires_at,expiry);
 assert.equal((await bank({...payload,order_id:'QA-BANK-B'})).status,409);
 assert.equal(await DB.prepare('SELECT * FROM artist_plan_state WHERE artist_id=?').bind('QA-BANK-B').first(),null);
 assert.equal((await bank({...payload,transaction_id:'local-different-tx'})).status,409);
 await DB.prepare("UPDATE audience_artist_links SET claim_id='changed-owner' WHERE artist_id='QA-BANK-OWNER'").run();
 assert.equal((await bank({...payload,order_id:'QA-BANK-OWNER',transaction_id:'local-owner-tx'})).status,409);
 assert.equal(await DB.prepare('SELECT * FROM artist_plan_state WHERE artist_id=?').bind('QA-BANK-OWNER').first(),null);
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM pro_payment_fulfillments').first()).n,1);
 kv.set('artistas',JSON.stringify([{id:'QA-BANK-RECOVERY',nombre:'Ficticio',visible:false}]));failCatalog=true;
 const recovery={...payload,order_id:'QA-BANK-RECOVERY',transaction_id:'local-recovery-tx'};
 assert.equal((await bank(recovery)).status,503,'KV failure is reported after atomic D1 fulfillment');
 const before=(await DB.prepare("SELECT pro_expires_at FROM artist_plan_state WHERE artist_id='QA-BANK-RECOVERY'").first()).pro_expires_at;
 assert.equal((await bank(recovery)).status,200);
 assert.equal((await DB.prepare("SELECT pro_expires_at FROM artist_plan_state WHERE artist_id='QA-BANK-RECOVERY'").first()).pro_expires_at,before);
 assert.equal(JSON.parse(kv.get('artistas'))[0].pro_active,true);
 assert.equal((await DB.prepare("SELECT COUNT(*) n FROM pro_feature_credits WHERE order_id='QA-BANK-RECOVERY'").first()).n,1);
 console.log('PASS: real Worker + SQLite HMAC adapter: forged/expired signatures and wrong amount/currency/recipient/status denied; valid credit activates once; replay stable; transaction reuse and changed ownership blocked. Local adapter contract only; no bank connected.');
}finally{DB.close()}
