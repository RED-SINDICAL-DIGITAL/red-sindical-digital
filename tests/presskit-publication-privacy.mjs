import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),id='QA-KIT-PRIVACY',token='ART-kit-privacy-123456789';
const env={DB,ADMIN_KEY:'local-kit-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id,nombre:'Ficticio',visible:true,presskit_enabled:true}]));
kv.set('artist_access_'+token,JSON.stringify({artist_id:id,expires:Date.now()+3600000}));
async function call(route,method='GET',body,auth=token){
 const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});
 return {status:r.status,data:r.headers.get('Content-Type')?.includes('application/json')?await r.json():await r.text(),cache:r.headers.get('Cache-Control')};
}
try{
 const retired=await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro',pro_expires_at:new Date(Date.now()+86400000).toISOString()},env.ADMIN_KEY);
 assert.equal(retired.status,410);assert.equal(retired.data.code,'ARTIST_MEMBERSHIP_RETIRED');
 const data={kit:{name:'Ficticio',bio:'Privado',contact:'HIDDEN-CONTACT'},quotes:[{client:'PRIVATE-CLIENT',fee:'PRIVATE-FEE'}]};
 const save=await call('artist/workspace','PUT',{revision:0,data,publication:'publish'});
 assert.equal(save.status,403);
 const publicKit=await call('public/presskit?artist_id='+id,'GET',null,'');
 assert.equal(publicKit.status,404);assert.equal(publicKit.cache,'no-store');
 const share=await call('../share/presskit?id='+id,'GET',null,'');
 assert.equal(share.status,404);
 assert.equal(JSON.stringify(publicKit.data).includes('HIDDEN-CONTACT'),false);
 assert.equal(JSON.stringify(share.data).includes('PRIVATE-CLIENT'),false);
 assert.equal((await call('artist/workspace','GET',null,'')).status,401);
 const current=await call('artist/workspace');
 assert.equal(current.status,200);assert.equal(current.data.pro,false);
 console.log('PASS: retired artist membership cannot publish paid Press Kit or leak private fields via public routes.');
}finally{DB.close()}
