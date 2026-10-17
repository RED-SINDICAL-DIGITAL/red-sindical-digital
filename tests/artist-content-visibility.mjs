import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),token='ART-synthetic-content-access';
const env={DB,UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id:'QA-PUBLIC',nombre:'Public',visible:true},{id:'QA-PRIVATE',nombre:'Private',visible:false},{id:'QA-SUSPENDED',nombre:'Suspended',visible:true,estado:'suspendido'}]));
kv.set('artista_contenido',JSON.stringify(['QA-PUBLIC','QA-PRIVATE','QA-SUSPENDED','QA-MISSING'].flatMap(artist_id=>[{id:'PUB-'+artist_id,artist_id,titulo:'Approved '+artist_id,estado:'publicado',url:'https://example.org/public.mp4'},{id:'PENDING-'+artist_id,artist_id,titulo:'Private pending '+artist_id,estado:'pendiente',url:'https://example.org/pending.mp4'}])));
kv.set('artist_access_'+token,JSON.stringify({artist_id:'QA-PRIVATE',claim_id:'CLAIM-QA',expires:Date.now()+3600000}));
async function call(id,access=false){const r=await worker.fetch(new Request('https://isolated.example/api/artista/content?artist_id='+id,{headers:access?{Authorization:'Bearer '+token}:{}}),env,{});return{status:r.status,data:await r.json()}}
try{
 const publicItems=await call('QA-PUBLIC');assert.equal(publicItems.status,200);assert.equal(publicItems.data.length,1);assert.equal(publicItems.data[0].estado,'publicado');
 for(const id of ['QA-PRIVATE','QA-SUSPENDED','QA-MISSING']){const r=await call(id);assert.equal(r.status,200);assert.deepEqual(r.data,[],id+' cannot expose public content outside a public artist profile')}
 // Initialize owner schema through normal permission route before inserting an isolated owner.
 await call('QA-PRIVATE',true);
 await DB.prepare("INSERT INTO artist_owners(artist_id,claim_id,status,created_at,updated_at) VALUES(?,?,'active',?,?)").bind('QA-PRIVATE','CLAIM-QA',new Date().toISOString(),new Date().toISOString()).run();
 const owner=await call('QA-PUBLIC',true);assert.equal(owner.status,200);assert.equal(owner.data.length,2);assert.ok(owner.data.every(x=>x.artist_id==='QA-PRIVATE'));
 await DB.prepare("UPDATE artist_owners SET status='revoked' WHERE artist_id=?").bind('QA-PRIVATE').run();assert.equal((await call('QA-PRIVATE',true)).status,403);
 console.log('PASS: actual Worker + SQLite public content visibility, private owner access, artist-ID isolation and revoked access.');
}finally{DB.close()}
