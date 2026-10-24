// Legacy KV compatibility: synthetic local data, no deployed API or email service.
import assert from 'node:assert/strict';
import {loadWorker} from './load-worker.mjs';
import {webcrypto,randomUUID} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await loadWorker();
const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'isolated-jobs-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(route,method='GET',body,admin=false){const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.10'};if(admin)headers.Authorization='Bearer '+env.ADMIN_KEY;const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,data:await r.json()}}
const offer=()=>({titulo:'DEMO QA · No es oferta real',descripcion:'Convocatoria ficticia',contacto:'contact@example.invalid',contacto_email:'contact@example.invalid',empresa:'Productora QA',request_id:randomUUID()});
const application=job_id=>({job_id,nombre:'Postulante QA',email:'qa@example.invalid',consent_scope:'job_application_v1',consent_at:new Date().toISOString(),shared_fields:['nombre','email']});
try{
 assert.equal((await call('admin/moderation/settings','PUT',{enabled:true,provider:'gemini',daily_limit:300},true)).status,200);
 const publishedA=await call('bolsa_trabajo','POST',offer()),publishedB=await call('bolsa_trabajo','POST',offer());
 assert.equal(publishedA.status,200);assert.equal(publishedB.status,200);assert.equal(publishedA.data.moderation_pending,undefined);
 const jobA=publishedA.data.item.id,jobB=publishedB.data.item.id;
 assert.notEqual(jobA,jobB);assert.equal((await call('bolsa_trabajo')).data.length,2);
 assert.equal((await call('bolsa_trabajo/postular','POST',{job_id:jobA,nombre:'QA',email:'qa@example.invalid'})).status,400);
 const a=await call('bolsa_trabajo/postular','POST',application(jobA)),b=await call('bolsa_trabajo/postular','POST',application(jobB));
 assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.data.item.estado,'recibida');assert.match(a.data.clave_consulta,/^[a-f0-9]{64}$/);
 const id=a.data.item.id,key=a.data.clave_consulta;
 const state=await call('bolsa_trabajo/mi-postulacion','POST',{id,clave:key});assert.equal(state.status,200);assert.equal(state.data.estado,'recibida');
 for(const field of ['nombre','email','whatsapp','mensaje','consulta_hash','clave_consulta'])assert.equal(state.data[field],undefined);
 assert.equal((await call('bolsa_trabajo/mi-postulacion','POST',{id,clave:b.data.clave_consulta})).status,404);
 assert.equal((await call('bolsa_trabajo/postulaciones')).status,401);
 const admin=await call('bolsa_trabajo/postulaciones','GET',undefined,true);assert.equal(admin.data.length,2);assert(admin.data.every(x=>x.consulta_hash===undefined));
 const owner=await call('bolsa_trabajo/mis-postulantes','POST',{job_id:jobA,clave:publishedA.data.clave_contratante});assert.equal(owner.data.items.length,1);
 assert.equal((await call('bolsa_trabajo/mis-postulantes','POST',{job_id:jobA,clave:publishedB.data.clave_contratante})).status,404);
 const stored=JSON.parse(kv.get('postulaciones_trabajo'));assert(stored.every(x=>x.consulta_hash));assert(!JSON.stringify(stored).includes(key));
 assert.equal((await call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:jobA,clave:publishedA.data.clave_contratante,accion:'cerrar'})).status,200);
 assert.equal((await call('bolsa_trabajo/postular','POST',application(jobA))).status,404);
 assert.equal((await call('bolsa_trabajo')).data.length,1);
 assert.equal((await call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:jobA,clave:publishedA.data.clave_contratante,accion:'renovar',dias:30})).status,200);
 assert.equal((await call('bolsa_trabajo')).data.length,2);
 const jobs=JSON.parse(kv.get('bolsa_trabajo'));jobs.find(x=>x.id===jobB).fecha_limite='2000-01-01';kv.set('bolsa_trabajo',JSON.stringify(jobs));
 assert.equal((await call('bolsa_trabajo/postular','POST',application(jobB))).status,404);
 assert.equal((await call('bolsa_trabajo/acceso/solicitar','POST',{})).status,503);
 console.log('PASS: KV compatibility, immediate publication despite moderation setting, explicit consent, private status/inbox isolation, hashed receipts, close/renew/expiry and locked email recovery.');
}finally{DB.close()}
