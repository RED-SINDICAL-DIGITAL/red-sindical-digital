import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {sqliteD1} from '../tests/sqlite-d1.mjs';

// Entire QA uses an isolated in-memory KV and SQLite D1 mock. Never real staging or production.
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),kv=new Map();
const ADMIN='qa-local-admin-20261109';
const env={DB,ADMIN_KEY:ADMIN,UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
const original=[
 {id:'QA-ART-001',nombre:'Artista sintético Uno',nombre_artistico:'Artista sintético Uno',rubro:'Música',visible:true,estado:'publicado',pro_active:false},
 {id:'QA-ART-002',nombre:'Artista sintético Dos',nombre_artistico:'Artista sintético Dos',rubro:'Magia',visible:true,estado:'publicado',pro_active:false}
];
async function api(route,method='GET',data,auth=false){
 const response=await worker.fetch(new Request('https://isolated.example/api/'+route,{
  method,
  headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+ADMIN}:{})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})
 }),env,{});
 return {status:response.status,data:await response.json()};
}
try{
 const unauth=await api('artistas','PUT',original);
 assert.equal(unauth.status,401,'Anonymous artist write must be denied');
 assert.equal(kv.has('artistas'),false,'Unauthorized call may not mutate KV');
 const created=await api('artistas','PUT',original,true);
 assert.equal(created.status,200,'Admin must be able to create synthetic artist catalog');
 assert.equal(created.data.success,true);
 let list=(await api('artistas','GET',undefined,true)).data;
 assert.equal(list.length,2);
 assert(list.some(x=>x.id==='QA-ART-001'));
 const changed=list.map(x=>x.id==='QA-ART-001'?{...x,nombre:'Artista QA editado',nombre_artistico:'Artista QA editado',visible:false}:x);
 assert.equal((await api('artistas','PUT',changed,true)).status,200);
 list=(await api('artistas','GET',undefined,true)).data;
 const edited=list.find(x=>x.id==='QA-ART-001');
 assert.equal(edited.visible,false,'Hidden artist must be hidden in Admin');
 assert.equal(edited.nombre,'Artista QA editado','Edit must persist');
 const publicList=(await api('artistas')).data;
 assert(!publicList.some(x=>x.id==='QA-ART-001'),'Hidden synthetic artist must not appear in public list');
 // Export only synthetic catalog to an in-memory snapshot; no actual backup/restore services touched.
 const snapshot=JSON.parse(JSON.stringify(list));
 const afterDelete=list.filter(x=>x.id!=='QA-ART-002');
 assert.equal((await api('artistas','PUT',afterDelete,true)).status,200);
 assert.equal((await api('artistas','GET',undefined,true)).data.length,1);
 assert.equal((await api('artistas','PUT',snapshot,true)).status,200);
 const restored=(await api('artistas','GET',undefined,true)).data;
 assert.equal(restored.length,2);
 assert.equal(restored.find(x=>x.id==='QA-ART-001').visible,false);
 assert.equal(restored.find(x=>x.id==='QA-ART-002').nombre_artistico,'Artista sintético Dos');
 // A removed commercial plan must never be reactivated through the legacy Admin endpoint.
 const retired=await api('admin/artist-plan','PUT',{artist_id:'QA-ART-001',plan:'pro'},true);
 assert.equal(retired.status,410);
 assert.equal(retired.data.code,'ARTIST_MEMBERSHIP_RETIRED');
 console.log('PASS: isolated Admin creates, edits, hides, exports snapshot, deletes and restores synthetic catalog; retired PRO returns 410.');
}finally{DB.close()}
