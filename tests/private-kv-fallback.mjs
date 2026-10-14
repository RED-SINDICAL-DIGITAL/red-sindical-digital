import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const privateKeys=['signal_onboarding_applications','signal_onboarding_config','ticket_orders','marketplace_requests','radio_requests','artist_claims','artist_access_test','ART-test-private','payment_test','pro_orders','bolsa_trabajo_postulaciones','notifications','d1_sync_errors','admin_unknown','postulaciones_trabajo','postulaciones_artista','suscriptores','premium_codes','monetization_campaigns','eventos_pendientes','cct_financial_config'];
const values=new Map(privateKeys.map(key=>[key,JSON.stringify({synthetic:true})]));
values.set('footer_config',JSON.stringify({title:'Public footer'}));
const env={ADMIN_KEY:'isolated-test-only',UADAV_DB:{get:async key=>values.get(key)||null}};
for(const key of privateKeys){
 const url='https://isolated.example/api/'+key;
 const anonymous=await worker.fetch(new Request(url),env,{});
 assert.equal(anonymous.status,401,key);
 assert.equal((await anonymous.json()).synthetic,undefined);
 assert.equal((await worker.fetch(new Request(url,{headers:{Authorization:'Bearer '+env.ADMIN_KEY}}),env,{})).status,200);
}
const publicResponse=await worker.fetch(new Request('https://isolated.example/api/footer_config'),env,{});
assert.equal(publicResponse.status,200);assert.equal((await publicResponse.json()).title,'Public footer');
console.log('PASS: actual Worker denies generic private KV reads; admin compatibility and public footer preserved');
