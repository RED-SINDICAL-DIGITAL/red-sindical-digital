import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),credential='UAC-'+'e'.repeat(64),env={DB,ADMIN_KEY:'isolated-client-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function direct(route,method,body,key=credential){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body)}),env,{});return{status:r.status,data:await r.json()}}
try{
 assert.equal((await direct('account','POST',{data:{uadav_user_v11:{name:'Cliente aislado'}}})).status,200);
 const draft=await direct('artista/claim','POST',{new_profile:true,artist_name:'Artista cliente aislado',rubro:'Magia',name:'Solicitante ficticio',email:'client@example.invalid'});assert.equal(draft.status,200);const id=draft.data.artist_id;assert(id);
 const storage=new Map([['uadav_account_access_v1',credential]]);const context={document:{readyState:'loading',addEventListener:()=>{}},addEventListener:()=>{},PLATFORM_API_BASE:'https://isolated.example/api/',localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async(url,opt)=>worker.fetch(new Request(url,opt),env,{}),AbortController,setTimeout,clearTimeout,URL,URLSearchParams,location:{search:'',origin:'https://isolated.example'}};
 vm.runInNewContext(await readFile(new URL('../uadav-artist-account-v142.js',import.meta.url),'utf8'),context);const client=context.UADAVArtistAccount;
 const listed=await client.list();assert(listed.artists.some(a=>a.artist_id===id));
 const token=await client.session(id);assert.match(token,/^ART-[A-Za-z0-9_-]{12,116}$/);assert.equal(storage.get('uadav_artist_account_session_v1'),id);assert.equal(storage.get('uadav_artist_access_token_v1'),token);
 const access=await worker.fetch(new Request('https://isolated.example/api/artista/access?token='+encodeURIComponent(token)),env,{});assert.equal(access.status,200);assert.equal((await access.json()).artist.id,id);
 await assert.rejects(client.session('UNRELATED-ARTIST'),e=>e.status===403);assert.equal(storage.get('uadav_artist_access_token_v1'),token);assert.equal(storage.get('uadav_artist_account_session_v1'),id);
 assert.equal((await direct('admin/artist-claims','PUT',{id:draft.data.id,status:'rejected',review_note:'Fin de prueba aislada'},env.ADMIN_KEY)).status,200);
 assert.equal((await client.list()).artists.length,0);await assert.rejects(client.session(id),e=>e.status===403);
 const revoked=await worker.fetch(new Request('https://isolated.example/api/artista/access?token='+encodeURIComponent(token)),env,{});assert.notEqual(revoked.status,200);
 console.log('PASS: real account client + Worker + SQLite: private artist listed, validated session stored, exact private profile opens, unrelated artist denied without overwriting access, rejection removes linkage and revokes access.');
}finally{DB.close()}
