import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
globalThis.crypto ||= webcrypto;
const config=await readFile(new URL('../wrangler.admin-v2-qa.toml.example',import.meta.url),'utf8');
const match=name=>config.match(new RegExp('^'+name+'\\s*=\\s*"([^"]+)"','m'))?.[1];
const qaOrigin='https://uadav-admin-v2-qa.pages.dev';
assert.equal(match('ACCOUNT_ALLOWED_ORIGINS'),qaOrigin,'QA CORS must use its own Pages origin');
assert.equal(match('PUBLIC_SITE_URL'),qaOrigin,'Links must resolve only to QA');
assert.equal(match('TURNSTILE_ALLOWED_HOSTNAMES'),'uadav-admin-v2-qa.pages.dev','QA Turnstile must use QA host');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../qa/admin-v2/worker.js',import.meta.url))).toString('base64'));
async function check(origin){
 const env={ACCOUNT_ALLOWED_ORIGINS:match('ACCOUNT_ALLOWED_ORIGINS')};
 const response=await worker.fetch(new Request('https://uadav-api-admin-v2-qa.uadavstream.workers.dev/api/account/identity',{headers:{Origin:origin,Authorization:'Bearer UAC-'+'1'.repeat(64)}}),env,{waitUntil(){}});
 return {status:response.status,cors:response.headers.get('Access-Control-Allow-Origin'),json:await response.json()};
}
const qa=await check(qaOrigin);
assert.equal(qa.status,503,'Allowed QA origin should proceed to D1 availability check');
assert.equal(qa.cors,qaOrigin,'QA response should authorize its own origin');
for(const foreign of ['https://uadav-stream-staging.pages.dev','https://uadavstream.com.ar','https://uadav-admin-v2-qa.pages.dev.attacker.invalid','null']){
 const response=await check(foreign);
 assert.equal(response.status,403,'Foreign origin must fail: '+foreign);
 assert.equal(response.cors,null,'Foreign origin must not get CORS header: '+foreign);
 assert.equal(response.json.code,'ORIGIN_NOT_ALLOWED');
}
console.log('PASS: QA origin accepted by Worker CORS; staging, production, fake suffix and null origins rejected.');
