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
 assert.equal((await call('artist/plan?token='+token)).data.plan,'free');
 const initial=await call('artist/workspace');assert.equal(initial.status,200);assert.equal(initial.data.pro,false);
 const body={revision:0,data:initial.data.data};body.data.kit.bio='Presentación ficticia';
 assert.equal((await call('artist/workspace','PUT',body)).status,403);
 assert.equal((await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro'})).status,401);
 assert.equal((await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro',pro_expires_at:new Date(Date.now()+86400000).toISOString(),ai_enabled:false},env.ADMIN_KEY)).status,200);
 assert.equal((await call('artist/plan?token='+token)).data.plan,'pro');
 assert.equal((await call('artist/workspace')).data.pro,true);
 const saved=await call('artist/workspace','PUT',body);assert.equal(saved.status,200);assert.equal(saved.data.revision,1);
 assert.equal((await call('artist/workspace','PUT',body)).status,409);
 kv.set('artistas',JSON.stringify([{id,nombre:'Artista ficticio',visible:true,presskit_enabled:true}]));
 await DB.prepare('UPDATE artist_workspaces SET public_json=? WHERE artist_id=?').bind(JSON.stringify({artist_id:id,kit:{name:'Artista ficticio',bio:'Presentación pública'}}),id).run();
 assert.equal((await call('public/presskit?artist_id='+id)).status,200);
 assert.equal((await call('public/share-link?kind=kit&id='+id)).status,200);
 assert.equal((await call('../share/presskit?id='+id)).status,200);
 await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro',pro_expires_at:'2020-01-01T00:00:00Z',ai_enabled:false},env.ADMIN_KEY);
 const expired=await call('artist/workspace');assert.equal(expired.data.pro,false);assert.equal(expired.data.data.kit.bio,'Presentación ficticia');
 assert.equal((await call('artist/workspace','PUT',{...body,revision:1})).status,403);
 assert.equal((await call('public/presskit?artist_id='+id)).status,404,'expired PRO must not expose its public Press Kit');
 assert.equal((await call('public/share-link?kind=kit&id='+id)).status,404,'expired PRO must not generate a share preview');
 assert.equal((await call('../share/presskit?id='+id)).status,404);
 assert.equal((await call('pro/payment-settings')).data.enabled,false);
 console.log('PASS: actual Worker + isolated SQLite: FREE restrictions, admin authorization, PRO activation, revision conflicts, expired PRO read preservation and blocked writes; payments disabled.');
}finally{DB.close()}
