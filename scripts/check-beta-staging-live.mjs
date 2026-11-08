#!/usr/bin/env node
// READ ONLY: run after Cloudflare staging deployment. No credentials or writes.
import assert from 'node:assert/strict';
const pages='https://uadav-stream-staging.pages.dev';
const api='https://uadav-api-staging.uadavstream.workers.dev';
async function get(url){
 const response=await fetch(url,{redirect:'error',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
 assert.equal(response.status,200,`${url}: expected HTTP 200, received ${response.status}`);
 return response;
}
const [profile,app,health]=await Promise.all([
 get(pages+'/usuario.html?qa_beta='+Date.now()).then(x=>x.text()),
 get(pages+'/app.html?qa_beta='+Date.now()).then(x=>x.text()),
 get(api+'/api/health').then(x=>x.json())
]);
assert.match(profile,/id="profileNativeHome"/,'Native Mi Perfil not deployed');
assert.match(profile,/id="profileLegacyViews"/,'Mi Perfil legacy controls missing');
assert.match(app,/profile-native-v4-inline-20261107/,'PWA iframe revision not deployed');
assert.match(app,/uadav-api-staging\.uadavstream\.workers\.dev/,'PWA does not reference staging API');
assert.equal(health.ok,true,'Staging Worker health not OK');
assert.equal(health.kv,true,'Staging KV unavailable');
assert.equal(health.d1,true,'Staging D1 unavailable');
assert.equal(health.event_owner_revision,'20261107-owner-verified-v1','Wrong staging owner-guard Worker revision');
console.log('PASS: deployed staging Pages Mi Perfil/PWA and staging Worker health; no writes or emails.');
