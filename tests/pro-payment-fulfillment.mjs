import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),kv=new Map(),artist='QA-PAYMENT',token='ART-payment-test-123456789';
const env={DB,ADMIN_KEY:'local-payment-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id:artist,nombre:'Prueba pago',visible:false}]));
kv.set('artist_access_'+token,JSON.stringify({artist_id:artist,expires:Date.now()+3600000}));
async function call(route,body,admin=false){
 const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{
  method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 }),env,{});
 return {status:r.status,data:await r.json()};
}
try{
 const settings=await call('pro/payment-settings');
 assert.equal(settings.status,200);assert.equal(settings.data.enabled,false);assert.equal(settings.data.retired,true);
 const destination=await call('pro/payment-destination');
 assert.equal(destination.status,200);assert.equal(destination.data.enabled,false);
 const attempts=[
  ['pro/payment-orders',{artist_id:artist,period:'monthly'}],
  ['pro/payment-orders/report',{order_id:'OLD-ORDER',token,receipt_url:'https://example.invalid/receipt'}],
  ['pro/bank-confirmation',{order_id:'OLD-ORDER'}]
 ];
 for(const [route,body] of attempts){
  const result=await call(route,body);
  assert.equal(result.status,410,route);
  assert.equal(result.data.code,'ARTIST_MEMBERSHIP_RETIRED');
 }
 const unauthorized=await call('admin/pro-payment-orders/review',{order_id:'OLD-ORDER',decision:'approve'});
 assert.equal(unauthorized.status,401);
 const admin=await call('admin/pro-payment-orders/review',{order_id:'OLD-ORDER',decision:'approve'},true);
 assert.equal(admin.status,410);assert.equal(admin.data.code,'ARTIST_MEMBERSHIP_RETIRED');
 const plan=await call('artist/plan?token='+token);
 assert.equal(plan.data.plan,'free');
 assert.equal(await DB.prepare('SELECT * FROM artist_plan_state WHERE artist_id=?').bind(artist).first(),null);
 console.log('PASS: retired PRO payments cannot create, report, confirm or approve orders; existing FREE tier remains unchanged.');
}finally{DB.close()}
