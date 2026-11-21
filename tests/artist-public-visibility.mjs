import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map();const env={DB,ADMIN_KEY:'local-visibility-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id:'QA-HIDDEN',nombre:'Hidden verified',visible:false,afiliado_verificado:true,claim_email:'PRIVATE-CLAIM-EMAIL'},{id:'QA-PUBLIC',nombre:'Public artist',visible:true,claim_email:'PRIVATE-CLAIM-EMAIL',claim_name:'PRIVATE-CLAIM-NAME',pro_active:true,pro_expires:'2099-01-01T00:00:00Z'},{id:'QA-SUSPENDED',nombre:'Suspended artist',visible:true,estado:'suspendido'}]));
async function call(route,admin=false){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{headers:admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{}}),env,{});return {status:r.status,data:await r.json()};}
try{
 assert.equal((await call('public/artista?id=QA-HIDDEN')).status,404,'affiliation must not override hidden status');
 assert.equal((await call('public/artista?id=QA-SUSPENDED')).status,404);
 assert.equal((await call('public/artista?id=QA-PUBLIC')).status,200);
 for(const route of ['artistas','public/artistas']){const result=await call(route);assert.equal(result.status,200);assert.deepEqual(result.data.map(a=>a.id),['QA-PUBLIC']);assert.equal(JSON.stringify(result.data).includes('PRIVATE-CLAIM'),false);}
 const regional=await call('public/artistas-regional');assert.equal(regional.status,200);assert.deepEqual(regional.data.items.map(a=>a.id),['QA-PUBLIC']);
 assert.equal((await call('public/share-link?kind=artist&id=QA-HIDDEN')).status,404);
 assert.equal((await call('public/share-link?kind=artist&id=QA-SUSPENDED')).status,404);
 const admin=await call('artistas',true);assert.equal(admin.data.length,3);assert.equal(admin.data[0].claim_email,'PRIVATE-CLAIM-EMAIL');
 console.log('PASS: actual Worker + SQLite hidden/suspended visibility, affiliation separation, sanitized public legacy catalog, regional feed and private Admin catalog compatibility.');
}finally{DB.close()}
