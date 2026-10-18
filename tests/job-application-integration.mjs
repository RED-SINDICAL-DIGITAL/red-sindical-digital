import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map([['bolsa_trabajo',JSON.stringify([{id:'JOB-QA-A',titulo:'Prueba aislada A',activo:true},{id:'JOB-QA-B',titulo:'Prueba aislada B',activo:true}])]]),env={DB,ADMIN_KEY:'isolated-jobs-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(route,method='GET',body,admin=false){const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.10'};if(admin)headers.Authorization='Bearer '+env.ADMIN_KEY;const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,data:await r.json()}}
try{
 const a=await call('bolsa_trabajo/postular','POST',{job_id:'JOB-QA-A',nombre:'Postulante QA',email:'qa@example.invalid',mensaje:'Solicitud ficticia'});assert.equal(a.status,200);assert.equal(a.data.success,true);assert.match(a.data.clave_consulta,/^[a-f0-9]{64}$/);const id=a.data.item.id,key=a.data.clave_consulta;assert(!JSON.stringify(a.data).includes('consulta_hash'));
 const b=await call('bolsa_trabajo/postular','POST',{job_id:'JOB-QA-B',nombre:'Otro QA',email:'other@example.invalid'});assert.equal(b.status,200);assert.notEqual(b.data.clave_consulta,key);
 const state=await call('bolsa_trabajo/mi-postulacion','POST',{id,clave:key});assert.equal(state.status,200);assert.equal(state.data.estado,'pendiente');for(const field of ['nombre','email','whatsapp','mensaje','consulta_hash','clave_consulta'])assert.equal(state.data[field],undefined);
 assert.notEqual((await call('bolsa_trabajo/mi-postulacion','POST',{id,clave:b.data.clave_consulta})).status,200);
 assert.notEqual((await call('bolsa_trabajo/mi-postulacion','POST',{id:b.data.item.id,clave:key})).status,200);
 assert.equal((await call('bolsa_trabajo/postulaciones')).status,401);
 const admin=await call('bolsa_trabajo/postulaciones','GET',undefined,true);assert.equal(admin.status,200);assert.equal(admin.data.length,2);assert(admin.data.some(x=>x.id===id&&x.job_id==='JOB-QA-A'));assert(admin.data.every(x=>x.consulta_hash===undefined));
 const stored=JSON.parse(kv.get('postulaciones_trabajo'));assert(stored.every(x=>x.consulta_hash&&!x.clave_consulta));assert(!stored.some(x=>JSON.stringify(x).includes(key)));
 assert.notEqual((await call('bolsa_trabajo/postular','POST',{job_id:'MISSING',nombre:'QA',email:'qa@example.invalid'})).status,200);assert.equal(JSON.parse(kv.get('postulaciones_trabajo')).length,2);
 console.log('PASS: isolated Worker + SQLite/KV: two job applications, one-time receipts, private status isolation, anonymous Admin denial, redacted Admin list, hashed keys and unavailable job rejection. Jobs are synthetic fixtures; public job publication and browser submission are separate pending tests.');
}finally{DB.close()}
