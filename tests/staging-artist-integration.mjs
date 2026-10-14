import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const base=new URL(process.env.UADAV_STAGING_API||'');
assert.equal(base.protocol,'https:');assert.match(base.hostname,/^uadav-api-staging\.[a-z0-9-]+\.workers\.dev$/i);
assert.equal(base.pathname,'/api/');for(const field of ['search','hash','username','password'])assert.equal(base[field],'');
const secret='UAC-'+randomBytes(32).toString('hex'),suffix=randomBytes(6).toString('hex');
async function call(route,method='GET',body,token=secret){
 const r=await fetch(new URL(route,base),{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Origin:base.origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:r.status,data:await r.json()};
}
assert.equal((await call('pro/payment-settings','GET',null,'')).data.enabled,false,'real payments must remain disabled');
assert.equal((await call('account','POST',{data:{uadav_user_v11:{name:'PRUEBA STAGING ARTISTA',avatar:'T'}}})).status,200);
const submission={new_profile:true,artist_name:'PRUEBA STAGING '+suffix,rubro:'Ilusionismo de prueba',name:'Contacto ficticio',email:'qa-'+suffix+'@example.invalid',bio:'Perfil sintético de auditoría. No publicar.',ciudad:'Ciudad ficticia'};
const created=await call('artista/claim','POST',submission);
assert.equal(created.status,200,'draft creation');assert.equal(created.data.private_access,true);assert.equal(created.data.account_tracked,true);
const id=created.data.artist_id;assert.ok(id);
const duplicate=await call('artista/claim','POST',submission);assert.equal(duplicate.status,200);assert.equal(duplicate.data.artist_id,id);assert.equal(duplicate.data.duplicate,true);
const linked=await call('account/artists');assert.equal(linked.status,200);assert.equal(linked.data.artists.filter(a=>a.artist_id===id).length,1);assert.equal(linked.data.artists.find(a=>a.artist_id===id).published,false);
const issued=await call('account/artist-session','POST',{artist_id:id});assert.equal(issued.status,200);assert.equal(issued.data.artist_id,id);const token=issued.data.token;
const access=await call('artista/access?token='+encodeURIComponent(token),'GET',null,'');assert.equal(access.status,200);assert.equal(access.data.artist.id,id);assert.equal(access.data.artist.visible,false);
const plan=await call('artist/plan?token='+encodeURIComponent(token),'GET',null,'');assert.equal(plan.status,200);assert.equal(plan.data.plan,'free');
const workspace=await call('artist/workspace','GET',null,token);assert.equal(workspace.status,200);assert.equal(workspace.data.pro,false);
assert.equal((await call('artist/workspace','PUT',{revision:workspace.data.revision,data:workspace.data.data},token)).status,403);
assert.equal((await call('account/artist-session','POST',{artist_id:'QA-NOT-LINKED-'+suffix})).status,403);
assert.equal((await call('public/presskit?artist_id='+encodeURIComponent(id),'GET',null,'')).status,404);
assert.equal((await call('account/artists','DELETE',{artist_id:id})).status,200);
assert.equal((await call('account/artist-session','POST',{artist_id:id})).status,403);
assert.equal((await call('artist/workspace','GET',null,token)).status,401,'unlink must invalidate an already issued artist session');
console.log('PASS: remote staging artist draft creation, deduplication, automatic account link, private session, FREE restrictions, unpublished Press Kit and unlink revocation. Synthetic records retained; payments disabled; no credentials logged.');
