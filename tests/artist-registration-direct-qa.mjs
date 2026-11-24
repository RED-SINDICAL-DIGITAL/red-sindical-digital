import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqliteD1} from './sqlite-d1.mjs';

const source=await readFile(new URL('../worker.js',import.meta.url));
const {default:worker}=await import('data:text/javascript;base64,'+source.toString('base64'));
const db=sqliteD1(), kv=new Map(), host='qa.invalid';
const env={DB:db,UADAV_DB:{get:async key=>kv.get(key)??null,put:async(k,v)=>kv.set(k,v),delete:async k=>kv.delete(k)},
  ACCOUNT_ALLOWED_ORIGINS:'https://'+host,TURNSTILE_ALLOWED_HOSTNAMES:host,TURNSTILE_SITE_KEY:'qa',TURNSTILE_SECRET_KEY:'qa'};
const owner='UAC-'+'a'.repeat(64), other='UAC-'+'b'.repeat(64);
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  const token=JSON.parse(options.body).response;
  return Response.json({success:['artist_claim','account_create'].includes(token),action:token,hostname:host});
};
async function call(path,account,body,method=body?'POST':'GET'){
  const response=await worker.fetch(new Request('https://qa.invalid/api/'+path,{method,
    headers:{Origin:'https://qa.invalid',Authorization:'Bearer '+account,'Content-Type':'application/json'},
    body:body?JSON.stringify(body):undefined}),env,{});
  return {status:response.status,data:await response.json()};
}
try{
  for(const account of [owner,other])assert.equal((await call('account',account,{data:{},turnstile_token:'account_create'})).status,200);
  const form={new_profile:true,artist_name:'Artista de ensayo',rubro:'Música',name:'Titular QA',email:'persona@example.invalid'};
  assert.equal((await call('artista/claim',owner,form)).status,403);
  form.turnstile_token='artist_claim';
  const created=await call('artista/claim',owner,form);
  assert.equal(created.status,200);
  assert.equal(created.data.status,'published');
  const artist_id=created.data.artist_id;
  assert.equal((await call('artista/claim',owner,form)).data.artist_id,artist_id);
  assert.equal((await call('artista/claim',other,form)).status,409);
  const publicProfile=await call('public/artista?id='+artist_id,'');
  assert.equal(publicProfile.status,200);
  assert(!JSON.stringify(publicProfile.data).includes(form.email));
  const privateSession=await call('account/artist-session',owner,{artist_id});
  assert.equal(privateSession.status,200);
  assert([401,403].includes((await call('account/artist-session',other,{artist_id})).status));
  const claim=await call('artista/claim',other,{artist_id,name:'Otra persona',email:'otra@example.invalid',turnstile_token:'artist_claim'});
  assert.equal(claim.status,200);
  assert.equal((await call('account/artists',other)).data.artists.length,0);
  console.log('PASS alta pública, reintento, titularidad, privacidad y reclamo sin acceso automático');
}finally{globalThis.fetch=originalFetch;db.close()}
