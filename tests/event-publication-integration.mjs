import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'isolated-events-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(route,method='GET',body,admin=false){const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.20'};if(admin)headers.Authorization='Bearer '+env.ADMIN_KEY;const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,data:await r.json()}}
const event=(title,featured=false)=>({titulo:title,descripcion:'Evento ficticio de prueba aislada',categoria:'Magia',fecha:'2026-12-01',fecha_inicio:'2026-12-01',lugar:'Sala ficticia',ciudad:'Ciudad QA',es_gratuito:true,contacto_email:'event@example.invalid',funciones:[{fecha:'2026-12-01',hora:'21:30'}],destacado_solicitado:featured});
try{
 assert.equal((await call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},true)).status,200);
 const created=await call('eventos','POST',event('Evento gratuito QA'));assert.equal(created.status,200);assert.equal(created.data.success,true);assert.equal(created.data.mode,'auto_published');const firstId=created.data.id;
 const catalog=await call('cartelera');assert.equal(catalog.status,200);assert(catalog.data.some(e=>e.id===firstId));
 const detail=await call('evento?id='+encodeURIComponent(firstId));assert.equal(detail.status,200);assert.equal(detail.data.id,firstId);assert.equal(detail.data.es_gratuito,true);assert.equal(detail.data.destacado_pagado,false);assert.equal(detail.data.funciones[0].hora,'21:30');
 const featured=await call('eventos','POST',event('Evento con solicitud de destaque QA',true));assert.equal(featured.status,200);assert.equal(featured.data.mode,'auto_published_feature_review');assert.equal(featured.data.item.destacado_pagado,false);const featuredId=featured.data.id;
 assert.equal((await call('eventos')).status,401);const pendingFeatures=await call('eventos','GET',undefined,true);assert(pendingFeatures.data.some(e=>e.id===featuredId));
 assert.equal((await call('evento?id='+encodeURIComponent(featuredId))).status,200);
 const rejectedFeature=await call('eventos','PUT',{id:featuredId,action:'reject_feature'},true);assert.equal(rejectedFeature.status,200);assert.equal((await call('evento?id='+encodeURIComponent(featuredId))).status,200);const afterFeature=await call('cartelera');assert(afterFeature.data.some(e=>e.id===featuredId&&e.destacado_pagado===false));
 assert.equal((await call('admin/moderation/settings','PUT',{enabled:true,provider:'gemini',daily_limit:300},true)).status,200);
 const held=await call('eventos','POST',event('Evento a revisar QA'));assert.equal(held.status,202);assert.equal(held.data.moderation_pending,true);assert(!(await call('cartelera')).data.some(e=>e.titulo==='Evento a revisar QA'));
 assert.equal((await call('admin/moderation/review','POST',{id:held.data.moderation_id,decision:'approve'})).status,401);
 const reviewed=await call('admin/moderation/review','POST',{id:held.data.moderation_id,decision:'approve'},true);assert.equal(reviewed.status,200);assert.equal(reviewed.data.success,true);
 const reviewedEvent=(await call('cartelera')).data.find(e=>e.titulo==='Evento a revisar QA');assert(reviewedEvent);assert.equal((await call('evento?id='+encodeURIComponent(reviewedEvent.id))).data.funciones[0].hora,'21:30');
 const rejected=await call('eventos','POST',event('Evento rechazado QA'));assert.equal(rejected.status,202);assert.equal((await call('admin/moderation/review','POST',{id:rejected.data.moderation_id,decision:'reject'},true)).status,200);assert(!(await call('cartelera')).data.some(e=>e.titulo==='Evento rechazado QA'));
 assert.equal((await call('evento?id=EV-MISSING')).status,404);
 console.log('PASS: isolated Worker + SQLite/KV: free event publication/catalog/detail, main performance time retained, unpaid feature request separate from listing, rejecting feature keeps event public, private Admin queue, pending moderation isolation, authorized approval/publication and rejection without publication. No real money, messages or remote records.');
}finally{DB.close()}
