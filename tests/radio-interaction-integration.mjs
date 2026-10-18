import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'isolated-radio-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(route,method='GET',body,admin=false){const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.30'};if(admin)headers.Authorization='Bearer '+env.ADMIN_KEY;const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,data:await r.json()}}
try{
 assert.equal((await call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},true)).status,200);
 const requested=await call('radio/requests','POST',{radio_id:'RAD-A',listener_name:'Oyente ficticio',artist:'Artista QA',title:'Tema QA',dedication:'Dedicatoria ficticia'});assert.equal(requested.status,200);assert.equal(requested.data.success,true);const requestId=requested.data.item.id;
 assert.equal((await call('radio/requests')).status,401);assert.equal((await call('radio/requests','PUT',{id:requestId,status:'done'})).status,401);
 const inbox=await call('radio/requests?radio_id=RAD-A','GET',undefined,true);assert(inbox.data.some(x=>x.id===requestId&&x.title==='Tema QA'));
 assert.equal((await call('radio/requests?radio_id=RAD-B','GET',undefined,true)).data.length,0);
 assert.equal((await call('radio/requests','PUT',{id:requestId,status:'done'},true)).status,200);assert.equal((await call('radio/requests?radio_id=RAD-A','GET',undefined,true)).data.find(x=>x.id===requestId).status,'done');
 const message=await call('moderar_chat','POST',{id_stream:'radio:RAD-A',alias:'Oyente QA',mensaje:'Mensaje de prueba aislada'});assert.equal(message.status,200);const messageId=message.data.item.id;
 const reply=await call('moderar_chat','POST',{id_stream:'radio:RAD-A',alias:'Respuesta QA',mensaje:'Respuesta ficticia',reply_to:messageId});assert.equal(reply.status,200);
 assert.equal((await call('moderar_chat','POST',{id_stream:'radio:RAD-B',alias:'Otra emisora',mensaje:'Respuesta cruzada',reply_to:messageId})).status,400);
 const chat=await call('chat?id_stream=radio%3ARAD-A');assert(chat.data.some(x=>x.id===reply.data.item.id&&x.reply_to===messageId));
 assert.equal((await call('chat?id_stream=radio%3ARAD-B')).data.length,0);
 assert.equal((await call('admin/moderation/settings','PUT',{enabled:true,provider:'gemini',daily_limit:300},true)).status,200);
 const held=await call('radio/requests','POST',{radio_id:'RAD-A',title:'Tema pendiente'});assert.equal(held.status,202);assert.equal(held.data.moderation_pending,true);assert(!(await call('radio/requests?radio_id=RAD-A','GET',undefined,true)).data.some(x=>x.title==='Tema pendiente'));
 assert.equal((await call('admin/moderation/review','POST',{id:held.data.moderation_id,decision:'approve'},true)).status,200);
 assert((await call('radio/requests?radio_id=RAD-A','GET',undefined,true)).data.some(x=>x.title==='Tema pendiente'));
 console.log('PASS: isolated Worker SQLite/KV radio request storage, private Admin inbox and state persistence, station filtering, chat reply isolation, moderated request held then approved. No remote messages or requests.');
}finally{DB.close()}
