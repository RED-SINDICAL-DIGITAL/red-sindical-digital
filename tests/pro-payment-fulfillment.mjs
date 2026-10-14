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
async function call(route,body,admin=false){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:await r.json()};}
async function order(id,period='monthly',days=30){const now=new Date().toISOString();await DB.prepare("INSERT INTO pro_payment_orders(id,artist_id,plan_period,duration_days,amount,currency,status,created_at,updated_at) VALUES(?,?,?,?,100,'ARS','pending',?,?)").bind(id,artist,period,days,now,now).run();}
try{
 await call('pro/payment-settings');await order('QA-MONTH');
 assert.equal((await call('admin/pro-payment-orders/review',{order_id:'QA-MONTH',decision:'approve'},true)).status,409);
 assert.equal((await call('pro/payment-orders/report',{order_id:'QA-MONTH',token,receipt_url:'https://example.invalid/fake-receipt'})).status,200);
 assert.equal((await call('artist/plan?token='+token)).data.plan,'free','receipt is not bank confirmation');
 assert.equal((await call('pro/bank-confirmation',{order_id:'QA-MONTH'})).status,503);
 const approvals=await Promise.all([call('admin/pro-payment-orders/review',{order_id:'QA-MONTH',decision:'approve'},true),call('admin/pro-payment-orders/review',{order_id:'QA-MONTH',decision:'approve'},true)]);
 assert.ok(approvals.some(x=>x.status===200));assert.ok(approvals.every(x=>[200,409].includes(x.status)));
 const first=await DB.prepare('SELECT * FROM artist_plan_state WHERE artist_id=?').bind(artist).first();assert.equal(first.plan,'pro');assert.equal(first.ai_enabled,0);
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM pro_payment_fulfillments').first()).n,1);
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM pro_feature_credits').first()).n,1);
 assert.equal((await call('admin/pro-payment-orders/review',{order_id:'QA-MONTH',decision:'approve'},true)).status,409);
 assert.equal((await DB.prepare('SELECT pro_expires_at FROM artist_plan_state WHERE artist_id=?').bind(artist).first()).pro_expires_at,first.pro_expires_at);
 await order('QA-YEAR','annual',365);await call('pro/payment-orders/report',{order_id:'QA-YEAR',token});
 assert.equal((await call('admin/pro-payment-orders/review',{order_id:'QA-YEAR',decision:'approve'},true)).status,200);
 const second=await DB.prepare('SELECT pro_expires_at FROM artist_plan_state WHERE artist_id=?').bind(artist).first();assert.equal(Date.parse(second.pro_expires_at)-Date.parse(first.pro_expires_at),365*86400000);
 assert.equal((await DB.prepare("SELECT COUNT(*) n FROM pro_feature_credits WHERE order_id='QA-YEAR'").first()).n,12);
 console.log('PASS: actual Worker + SQLite; receipt does not activate PRO, disconnected bank rejected, concurrent/repeated approval activates once, renewal stacks once and monthly/yearly feature credits are 1/12. No real payment service used.');
}finally{DB.close()}
