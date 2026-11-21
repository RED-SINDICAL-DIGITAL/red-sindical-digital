import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;const {default:worker,uadavPodcastCron}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'isolated-module-key',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
async function call(route,method='GET',body,admin=false){return worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{})}
try{
 const cases=[['radio','radios'],['podcasts','podcasts/episodes'],['events','cartelera'],['jobs','bolsa_trabajo'],['artists','artistas'],['media','media'],['shorts','shorts'],['iptv','senales'],['discover','search?q=test'],['radio_studio','radio-studio'],['radio_requests','radio/requests']];
 for(const [key,route] of cases){kv.set('config_global',JSON.stringify({modules:{[key]:false}}));const response=await call(route);assert.equal(response.status,404,key);const body=await response.json();assert.equal(body.code,'MODULE_DISABLED');assert.equal(body.module,key)}
 kv.set('config_global',JSON.stringify({modules:{radio_chat:false}}));
 assert.equal((await call('moderar_chat','POST',{id_stream:'radio:A',mensaje:'No debe publicarse'})).status,404);
 assert.equal((await call('chat?id_stream=radio%3AA')).status,404);
 kv.set('config_global',JSON.stringify({modules:{radio:false}}));
 assert.equal((await call('radios','GET',undefined,true)).status,200);
 kv.set('radios',JSON.stringify([{id:'A',nombre:'Registro guardado'}]));
 assert.equal((await call('radios')).status,404);kv.set('config_global',JSON.stringify({modules:{radio:true}}));
 const enabled=await call('radios');assert.equal(enabled.status,200);assert.equal((await enabled.json())[0].nombre,'Registro guardado');
 kv.set('config_global',JSON.stringify({modules:{podcasts:false}}));
 assert.equal((await uadavPodcastCron({...env,PODCAST_RSS_SYNC_ENABLED:'true'})).reason,'module_disabled');
 console.log('PASS: module API gating, radio submodules, Admin management access, non-destructive re-enable and RSS cron stop. Isolated SQLite/KV only.');
}finally{DB.close()}
