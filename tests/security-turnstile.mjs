import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
globalThis.crypto ||= webcrypto;
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const helper=source.slice(0,source.indexOf('// Account credentials'));
let response={success:true,action:'event_publish',hostname:'uadavstream.com.ar'},fail=false,calls=0;
const context={crypto:webcrypto,AbortController,setTimeout,clearTimeout,URL,TextDecoder,fetch:async(url,opt)=>{calls++;assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.equal(JSON.parse(opt.body).secret,'secret');if(fail)throw Error('offline');return {ok:true,json:async()=>response}}};
vm.createContext(context);vm.runInContext(helper+';globalThis.verify=uadavVerifyTurnstile;globalThis.config=uadavSecurityConfig',context);
const env={TURNSTILE_SITE_KEY:'public',TURNSTILE_SECRET_KEY:'secret'};
assert.equal((await context.verify({},'', 'event_publish')).ok,true);assert.equal(calls,0);
assert.equal((await context.verify({TURNSTILE_SITE_KEY:'public'},'token','event_publish')).status,503);
assert.equal((await context.verify(env,'','event_publish')).status,403);
assert.equal((await context.verify(env,'token','event_publish')).ok,true);
for(const bad of [{success:false,action:'event_publish',hostname:'uadavstream.com.ar'},{success:true,action:'device_link',hostname:'uadavstream.com.ar'},{success:true,action:'event_publish',hostname:'attacker.example'}]){response=bad;assert.equal((await context.verify(env,'token','event_publish')).status,403)}
fail=true;assert.equal((await context.verify(env,'token','event_publish')).status,503);
assert.equal(JSON.stringify(context.config(env)).includes('secret'),false);
console.log('PASS: optional configuration, fail closed, missing token, provider verification, action, hostname and provider outage');
