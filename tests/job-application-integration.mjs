import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'isolated-jobs-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(route,method='GET',body,admin=false){const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.10'};if(admin)headers.Authorization='Bearer '+env.ADMIN_KEY;const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,data:await r.json()}}
try{
 const settings=await call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},true);assert.equal(settings.status,200);
 const publishedA=await call('bolsa_trabajo','POST',{titulo:'Prueba aislada A',descripcion:'Convocatoria ficticia',contacto:'contact@example.invalid',contacto_email:'contact@example.invalid',empresa:'Productora QA'});assert.equal(publishedA.status,200);assert.equal(publishedA.data.success,true);const jobA=publishedA.data.item.id;assert.equal(publishedA.data.item.empresa,'Productora QA');
 const publishedB=await call('bolsa_trabajo','POST',{titulo:'Prueba aislada B',descripcion:'Otra convocatoria ficticia',contacto:'other@example.invalid'});assert.equal(publishedB.status,200);const jobB=publishedB.data.item.id;assert.notEqual(jobA,jobB);
 const listed=await call('bolsa_trabajo');assert.equal(listed.status,200);assert.equal(listed.data.length,2);assert(listed.data.some(j=>j.id===jobA));
 const a=await call('bolsa_trabajo/postular','POST',{job_id:jobA,nombre:'Postulante QA',email:'qa@example.invalid',mensaje:'Solicitud ficticia'});assert.equal(a.status,200);assert.equal(a.data.success,true);assert.match(a.data.clave_consulta,/^[a-f0-9]{64}$/);const id=a.data.item.id,key=a.data.clave_consulta;assert(!JSON.stringify(a.data).includes('consulta_hash'));
 const b=await call('bolsa_trabajo/postular','POST',{job_id:jobB,nombre:'Otro QA',email:'other@example.invalid'});assert.equal(b.status,200);assert.notEqual(b.data.clave_consulta,key);
 const state=await call('bolsa_trabajo/mi-postulacion','POST',{id,clave:key});assert.equal(state.status,200);assert.equal(state.data.estado,'pendiente');for(const field of ['nombre','email','whatsapp','mensaje','consulta_hash','clave_consulta'])assert.equal(state.data[field],undefined);
 assert.notEqual((await call('bolsa_trabajo/mi-postulacion','POST',{id,clave:b.data.clave_consulta})).status,200);
 assert.notEqual((await call('bolsa_trabajo/mi-postulacion','POST',{id:b.data.item.id,clave:key})).status,200);
 assert.equal((await call('bolsa_trabajo/postulaciones')).status,401);
 const admin=await call('bolsa_trabajo/postulaciones','GET',undefined,true);assert.equal(admin.status,200);assert.equal(admin.data.length,2);assert(admin.data.some(x=>x.id===id&&x.job_id===jobA));assert(admin.data.every(x=>x.consulta_hash===undefined));
 const stored=JSON.parse(kv.get('postulaciones_trabajo'));assert(stored.every(x=>x.consulta_hash&&!x.clave_consulta));assert(!stored.some(x=>JSON.stringify(x).includes(key)));
 assert.notEqual((await call('bolsa_trabajo/postular','POST',{job_id:'MISSING',nombre:'QA',email:'qa@example.invalid'})).status,200);assert.equal(JSON.parse(kv.get('postulaciones_trabajo')).length,2);

 const moderation=await call('admin/moderation/settings','PUT',{enabled:true,provider:'gemini',daily_limit:300},true);assert.equal(moderation.status,200);
 const pending=await call('bolsa_trabajo','POST',{titulo:'Oportunidad bajo revisión QA',descripcion:'Contenido ficticio pendiente',contacto:'review@example.invalid',empresa:'Productora revisada QA'});assert.equal(pending.status,202);assert.equal(pending.data.moderation_pending,true);assert(pending.data.moderation_id);
 assert.equal((await call('bolsa_trabajo')).data.length,2,'queued opportunity must not be public');
 assert.equal((await call('admin/moderation/review','POST',{id:pending.data.moderation_id,decision:'approve'})).status,401);
 const reviewed=await call('admin/moderation/review','POST',{id:pending.data.moderation_id,decision:'approve'},true);assert.equal(reviewed.status,200);assert.equal(reviewed.data.success,true);
 const afterReview=await call('bolsa_trabajo');assert.equal(afterReview.data.length,3);assert(afterReview.data.some(j=>j.titulo==='Oportunidad bajo revisión QA'&&j.empresa==='Productora revisada QA'));
 const rejected=await call('bolsa_trabajo','POST',{titulo:'Oportunidad rechazada QA',descripcion:'Contenido ficticio para rechazo',contacto:'rejected@example.invalid'});assert.equal(rejected.status,202);
 const rejectResult=await call('admin/moderation/review','POST',{id:rejected.data.moderation_id,decision:'reject'},true);assert.equal(rejectResult.status,200);assert.equal((await call('bolsa_trabajo')).data.length,3);
 console.log('PASS: isolated Worker + SQLite/KV: public opportunity publication/listing, pending moderation isolation, authorized approval/publication, rejection without publication, publisher retention, two job applications, one-time receipts, private status isolation, anonymous Admin denial, redacted Admin list, hashed keys and unavailable job rejection. Only local synthetic records; browser publication and submission remain separate pending tests.');
}finally{DB.close()}
