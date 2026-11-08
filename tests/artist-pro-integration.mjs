import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),kv=new Map(),id='QA-ARTIST-PRO',token='ART-local-test-123456789';
const env={DB,ADMIN_KEY:'local-admin-test-only',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id,nombre:'Artista ficticio',rubro:'Magia',visible:false}]));
kv.set('artist_access_'+token,JSON.stringify({artist_id:id,expires:Date.now()+3600000}));
async function call(route,method='GET',body,credential=token){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+credential},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:r.headers.get('Content-Type')?.includes('application/json')?await r.json():await r.text()};}
try{
 const free=await call('artist/plan?token='+token);
 assert.equal(free.status,200);assert.equal(free.data.plan,'free');
 const workspace=await call('artist/workspace');
 assert.equal(workspace.status,200);assert.equal(workspace.data.pro,false);
 const privateData={revision:0,data:workspace.data.data};
 privateData.data.kit.bio='Presentación ficticia';
 assert.equal((await call('artist/workspace','PUT',privateData)).status,403);
 // A retired paid tier must not be reactivated even with a valid admin key.
 const denied=await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro'});
 assert.equal(denied.status,401);
 const retired=await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro',pro_expires_at:new Date(Date.now()+86400000).toISOString()},env.ADMIN_KEY);
 assert.equal(retired.status,410);
 assert.equal(retired.data.code,'ARTIST_MEMBERSHIP_RETIRED');
 assert.equal((await call('artist/plan?token='+token)).data.plan,'free');
 assert.equal((await call('artist/workspace')).data.pro,false);
 const payment=await call('pro/payment-settings');
 assert.equal(payment.status,200);assert.equal(payment.data.enabled,false);
 assert.equal(payment.data.retired,true);
 console.log('PASS: retired PRO tier remains disabled; admin cannot reactivate it; FREE permissions and payment retirement intact.');
}finally{DB.close()}
