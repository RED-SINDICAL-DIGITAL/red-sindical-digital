#!/usr/bin/env node
// READ ONLY: no credentials, writes, emails or database mutation.
// Supports canonical same-origin Cloudflare Pages redirects (e.g. /usuario.html -> /usuario).
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const pages='https://uadav-stream-staging.pages.dev';
const api='https://uadav-api-staging.uadavstream.workers.dev';
const hash=text=>createHash('sha256').update(text).digest('hex').slice(0,16);

async function get(url){
 const original=new URL(url);
 let current=original;
 for(let n=0;n<=4;n++){
  const response=await fetch(current,{redirect:'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
  if(response.status>=300&&response.status<400){
   assert.ok(n<4,`${url}: too many redirects`);
   const location=response.headers.get('location');
   assert.ok(location,`${url}: redirect without Location`);
   const next=new URL(location,current);
   assert.equal(next.origin,original.origin,`${url}: cross-origin redirect refused`);
   assert.equal(next.protocol,'https:',`${url}: insecure redirect refused`);
   current=next;
   continue;
  }
  assert.equal(response.status,200,`${url}: expected HTTP 200, received ${response.status}`);
  return response;
 }
 throw new Error(`${url}: redirect limit`);
}
const [profile,app,health]=await Promise.all([
 get(pages+'/usuario.html?qa_beta='+Date.now()).then(x=>x.text()),
 get(pages+'/app.html?qa_beta='+Date.now()).then(x=>x.text()),
 get(api+'/api/health').then(x=>x.json())
]);
assert.match(profile,/id="profileNativeHome"/,'Native Mi Perfil not deployed');
assert.match(profile,/id="profileLegacyViews"/,'Mi Perfil legacy controls missing');
assert.match(app,/profile-native-v4-inline-20261107/,'PWA iframe revision not deployed');
assert.ok(app.includes('uadav-api-staging.uadavstream.workers.dev'),'PWA does not reference staging API');
assert.equal(health.ok,true,'Staging Worker health not OK');
assert.equal(health.kv,true,'Staging KV unavailable');
assert.equal(health.d1,true,'Staging D1 unavailable');
assert.equal(health.event_owner_revision,'20261107-owner-verified-v1','Wrong staging owner-guard Worker revision');
const comparisons=[['usuario.html',profile],['app.html',app]].map(([file,live])=>{
 const local=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 return {file,liveSha16:hash(live),candidateSha16:hash(local),matches:hash(live)===hash(local),liveCharacters:live.length,candidateCharacters:local.length};
});
for(const result of comparisons)console.log(JSON.stringify({kind:'pages-content-inventory',...result}));
console.log(JSON.stringify({kind:'worker-health',build:health.build??null,event_owner_revision:health.event_owner_revision,kv:health.kv,d1:health.d1}));
if(comparisons.some(x=>!x.matches))console.warn('BLOCKED: deployed Pages differs from candidate; identify active Cloudflare deployment and reconcile before replacing staging.');
console.log('PASS: read-only endpoint checks; a PASS does not authorize deployment.');
