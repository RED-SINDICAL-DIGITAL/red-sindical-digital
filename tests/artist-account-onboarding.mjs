import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';globalThis.crypto||=webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8'),{default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const DB=sqliteD1(),map=new Map(),env={DB,ADMIN_KEY:'admin',UADAV_DB:{get:async k=>map.get(k)||null,put:async(k,v)=>map.set(k,v)}},a='UAC-'+'a'.repeat(64),b='UAC-'+'b'.repeat(64);let serial=0;
async function call(path,method='GET',body,auth=a){const r=await worker.fetch(new Request('https://test.invalid/api/'+path,{method,headers:{Origin:'https://uadavstream.com.ar',Authorization:auth?'Bearer '+auth:'','Content-Type':'application/json','CF-Connecting-IP':'test'+(++serial)},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:await r.json()}}
try{
 await call('account','POST',{data:{}});await call('account','POST',{data:{}},b);
 const request={new_profile:true,artist_name:'Maga de Rosario',rubro:'Maga y mentalista',name:'Maga',email:'maga@example.com',ciudad:'Rosario',account_id:'FORGED'};
 assert.equal((await call('artista/claim','POST',request,'UAC-'+'f'.repeat(64))).status,404);assert(!map.has('artistas'));
 const created=await call('artista/claim','POST',request);assert.equal(created.status,200);assert.equal(created.data.account_tracked,true);assert.equal(created.data.private_access,true);const id=created.data.id,artist=created.data.artist_id;
 assert.equal((await call('account/artists')).data.claims[0].id,id);const draft=(await call('account/artists')).data.artists[0];assert.equal(draft.published,false);assert.equal(draft.name,'Maga de Rosario');assert.equal((await call('account/artist-session','POST',{artist_id:artist})).status,200);assert.equal((await call('public/artista?id='+artist)).status,404);assert.equal((await call('account/artists','GET',null,b)).data.claims.length,0);
 assert.equal((await call('artista/claim','POST',request)).data.id,id);
 // Matching an email is not proof of being the same account or the artist owner.
 const competing=await call('artista/claim','POST',{artist_id:artist,name:'Otro',email:'maga@example.com'},b);assert.notEqual(competing.data.id,id);
 assert.equal((await call('account/artists','GET',null,b)).data.artists.length,0);
 const approved=await call('admin/artist-claims','PUT',{id,status:'approved',review_note:'Verificado por administración',confirm_conflict:true},'admin');assert.equal(approved.status,200);assert.equal(approved.data.account_linked,true);
 assert.equal((await call('account/artists')).data.artists[0].artist_id,artist);assert.equal((await call('account/artists','GET',null,b)).data.artists.length,0);assert.equal((await call('account/artist-session','POST',{artist_id:artist})).status,200);
 await call('admin/artist-claims','PUT',{id:competing.data.id,status:'rejected',review_note:'No acredita propiedad'},'admin');assert.equal((await call('account/artists','GET',null,b)).data.claims[0].status,'rejected');
 await call('account/artists','DELETE',{artist_id:artist});assert.equal((await call('account/artists')).data.artists.length,0);assert.equal((await call('account/artists')).data.artists.length,0);
 // Simulate an approval that committed before automatic linking completed. GET heals it once.
 await DB.prepare('UPDATE audience_artist_claims SET detached_at=NULL,linked_at=NULL WHERE claim_id=?').bind(id).run();assert.equal((await call('account/artists')).data.artists.length,1);
 const device=await call('account/devices','POST',{name:'Móvil'});assert.equal((await call('account/artists','GET',null,device.data.secret)).data.artists[0].artist_id,artist);
 const rejectedDraft=await call('artista/claim','POST',{...request,artist_name:'Otro borrador',email:'other@example.com'});const draftSession=await call('account/artist-session','POST',{artist_id:rejectedDraft.data.artist_id});assert.equal(draftSession.status,200);await call('admin/artist-claims','PUT',{id:rejectedDraft.data.id,status:'rejected',review_note:'No publicar'},'admin');assert.equal((await call('artista/access?token='+draftSession.data.token)).status,401);
 console.log('PASS: account-bound registration, pending/rejected tracking, email isolation, automatic ownership linking, safe approval recovery, explicit unlink and cross-device access');
}finally{DB.close()}
