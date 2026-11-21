import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),admin='isolated-studio-admin',a='UAC-'+'a'.repeat(64),b='UAC-'+'b'.repeat(64),env={DB,ADMIN_KEY:admin,UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
async function call(route,method='GET',body,token=''){const headers={'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.40'};if(token)headers.Authorization='Bearer '+token;const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})}),env,{});return{status:r.status,cache:r.headers.get('Cache-Control'),data:await r.json()}}
try{
 kv.set('radios',JSON.stringify([{id:'RAD-A',nombre:'Radio A'},{id:'RAD-B',nombre:'Radio B'}]));
 await call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},admin);
 for(const token of [a,b])assert.equal((await call('account','POST',{data:{uadav_user_v11:{name:'Operador ficticio'}}},token)).status,200);
 assert.equal((await call('radio-studio')).status,401);assert.equal((await call('radio-studio','GET',undefined,a)).data.items.length,0);
 const grant={radio_id:'RAD-A',account_id:await hash(a),action:'grant',confirm:'CONFIRMAR',reason:'Verificación ficticia local'};
 assert.equal((await call('admin/radio-operators','PUT',grant,a)).status,401);
 assert.equal((await call('admin/radio-operators','PUT',{...grant,confirm:''},admin)).status,400);
 assert.equal((await call('admin/radio-operators','PUT',grant,admin)).status,200);
 const studios=await call('radio-studio','GET',undefined,a);assert.equal(studios.cache,'no-store');assert.deepEqual(studios.data.items,[{id:'RAD-A',name:'Radio A'}]);
 assert.equal((await call('radio-studio','GET',undefined,b)).data.items.length,0);
 const reqA=await call('radio/requests','POST',{radio_id:'RAD-A',title:'Tema A',listener_name:'Oyente QA'}),reqB=await call('radio/requests','POST',{radio_id:'RAD-B',title:'Tema B'});
 const inbox=await call('radio-studio/requests?radio_id=RAD-A','GET',undefined,a);assert.equal(inbox.data.items.length,1);assert.equal(inbox.data.items[0].id,reqA.data.item.id);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','GET',undefined,b)).status,403);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-B','GET',undefined,a)).status,403);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','PATCH',{id:reqB.data.item.id,status:'played'},a)).status,409);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','PATCH',{id:reqA.data.item.id,status:'inventado'},a)).status,400);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','PATCH',{id:reqA.data.item.id,status:'queued'},a)).status,200);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','GET',undefined,a)).data.items[0].status,'queued');

 assert.equal((await call('radio/requests','GET',undefined,a)).status,401);
 assert.equal(JSON.parse(kv.get('radio_requests')).find(x=>x.id===reqA.data.item.id).status,'queued');
 const originalPut=env.UADAV_DB.put;env.UADAV_DB.put=async(k,v)=>{if(k==='radio_requests')throw Error('Synthetic KV outage');return originalPut(k,v)};
 const mirrorFailure=await call('radio-studio/requests?radio_id=RAD-A','PATCH',{id:reqA.data.item.id,status:'played'},a);assert.equal(mirrorFailure.status,200);assert.equal(mirrorFailure.data.kv_mirror_updated,false);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','GET',undefined,a)).data.items[0].status,'played');env.UADAV_DB.put=originalPut;
 assert.equal((await call('moderar_chat','POST',{id_stream:'radio:RAD-A',alias:'Radio A',mensaje:'Intento ajeno',radio_operator_account_id:await hash(a),radio_operator_radio_id:'RAD-A'},b)).status,403);
 const listener=await call('moderar_chat','POST',{id_stream:'radio:RAD-A',alias:'Oyente',mensaje:'Saludos a la radio'});
 const foreign=await call('moderar_chat','POST',{id_stream:'radio:RAD-B',alias:'Otra radio',mensaje:'Mensaje ajeno'});
 assert.equal((await call('radio-studio/chat?radio_id=RAD-A','GET',undefined,b)).status,403);
 assert.equal((await call('radio-studio/chat?radio_id=RAD-B','GET',undefined,a)).status,403);
 const reply=await call('radio-studio/chat?radio_id=RAD-A','POST',{message:'Gracias por escuchar',reply_to:listener.data.item.id,radio_id:'RAD-B',alias:'Impostor'},a);
 assert.equal(reply.status,200);assert.equal(reply.data.radio_id,'RAD-A');assert.equal(reply.data.item.alias,'Radio A');assert.equal(reply.data.item.reply_to,listener.data.item.id);
 const chat=await call('radio-studio/chat?radio_id=RAD-A','GET',undefined,a);assert(chat.data.items.some(x=>x.id===reply.data.item.id));assert(!chat.data.items.some(x=>x.id===foreign.data.item.id));
 assert.equal((await call('radio-studio/chat?radio_id=RAD-A','POST',{message:'Respuesta incorrecta',reply_to:foreign.data.item.id},a)).status,400);
 await call('admin/moderation/settings','PUT',{enabled:true,provider:'gemini',daily_limit:300},admin);
 const held=await call('radio-studio/chat?radio_id=RAD-A','POST',{message:'Respuesta para revisar'},a);assert.equal(held.status,202);assert.equal(held.data.moderation_pending,true);
 assert(!(await call('radio-studio/chat?radio_id=RAD-A','GET',undefined,a)).data.items.some(x=>x.mensaje==='Respuesta para revisar'));
 assert.equal((await call('admin/moderation/review','POST',{id:held.data.moderation_id,decision:'approve'},admin)).status,200);
 assert((await call('radio-studio/chat?radio_id=RAD-A','GET',undefined,a)).data.items.some(x=>x.mensaje==='Respuesta para revisar'));
 const revokedPending=await call('radio-studio/chat?radio_id=RAD-A','POST',{message:'No publicar tras revocación'},a);assert.equal(revokedPending.status,202);

 assert.equal((await call('admin/radio-operators','PUT',{...grant,action:'revoke'},admin)).status,200);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','GET',undefined,a)).status,403);
 assert.equal((await call('radio-studio/requests?radio_id=RAD-A','PATCH',{id:reqA.data.item.id,status:'played'},a)).status,403);
 assert.equal((await call('radio-studio','GET',undefined,a)).data.items.length,0);
 assert.equal((await call('radio-studio/chat?radio_id=RAD-A','POST',{message:'Sin permiso'},a)).status,403);
 assert.equal((await call('admin/moderation/review','POST',{id:revokedPending.data.moderation_id,decision:'approve'},admin)).status,409);
 assert(!(await call('chat?id_stream=radio%3ARAD-A')).data.some(x=>x.mensaje==='No publicar tras revocación'));

 console.log('PASS: isolated Radio Studio account access, verified Admin grant/revoke, station-scoped inbox/update, cross-station/account denial, no central Admin access and no-store responses. No real permission grants.');
}finally{DB.close()}
