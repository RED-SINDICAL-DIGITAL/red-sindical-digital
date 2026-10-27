import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {sqliteD1} from './sqlite-d1.mjs';
const root=new URL('../',import.meta.url),key='synthetic-lab-key-'+'x'.repeat(48),site='https://uadav-bolsa-lab.uadavstream.workers.dev';
async function load(name){const dir=await mkdtemp(join(tmpdir(),'uadav-mail-lab-'));try{const file=join(dir,'lab.mjs');await writeFile(file,await readFile(new URL('releases/'+name,root)));return await import(pathToFileURL(file).href)}finally{await rm(dir,{recursive:true,force:true})}}
const module=await load('uadav-bolsa-mail-lab-11766.js'),worker=module.default,old=(await load('uadav-bolsa-lab-11764.js')).default;
const counts=[0,2,2,2,4,4,4,1],oldCounts=[0,2,2,9,2,2,2,1,6],oldParallel=new Set([1,2,4,5,6,8]);
async function fixture(approved=true){
 const DB=sqliteD1();await DB.prepare('PRAGMA foreign_keys=ON').run();let sessions=0;DB.withSession=mode=>{assert.equal(mode,'first-primary');sessions++;return DB};
 const env=new Proxy({DB,QA_BOLSA_ONLY:'true',QA_BOLSA_KEY:key},{get(target,name){if(name==='BREVO_API_KEY'||name==='BREVO_QA_RECIPIENT')throw Error('Real mail binding accessed');return target[name]}});
 async function request(target,path,body={},options={}){const method=options.method||'POST',r=await target.fetch(new Request((options.host||site)+path,{method,headers:{'Content-Type':options.contentType||'application/json',...(options.key===null?{}:{Authorization:'Bearer '+(options.key||key)}),...(options.origin?{Origin:options.origin}:{})},...(method==='POST'?{body:options.raw??JSON.stringify(body)}:{})}),options.env||env,{});return {status:r.status,data:(r.headers.get('Content-Type')||'').includes('application/json')?await r.json():await r.text(),headers:r.headers}}
 if(approved){assert.equal((await request(old,'/initialize',{confirm:'PREPARAR_BASE_FICTICIA_NUEVA'})).status,200);for(let phase=1;phase<=8;phase++){const slots=Array.from({length:oldCounts[phase]},(_,slot)=>slot),probe=slot=>request(old,'/probe',{phase,slot,confirm:'EJECUTAR_SOLO_DATOS_FICTICIOS'});const results=oldParallel.has(phase)?await Promise.all(slots.map(probe)):[];if(!oldParallel.has(phase))for(const slot of slots)results.push(await probe(slot));for(const r of results)assert.equal(r.status,200,JSON.stringify(r.data));assert.equal((await request(old,'/finish',{phase,confirm:'EJECUTAR_SOLO_DATOS_FICTICIOS'})).status,200)}}
 const call=(path,body={},options={})=>request(worker,path,body,options);
 const initialize=()=>call('/mail/initialize',{confirm:'PRUEBAS_FICTICIAS_CORREO'});
 const prepare=phase=>call('/mail/prepare',{phase,confirm:'PRUEBAS_FICTICIAS_CORREO'});
 const probe=(phase,slot)=>call('/mail/probe',{phase,slot,confirm:'PRUEBAS_FICTICIAS_CORREO'});
 const finish=phase=>call('/mail/finish',{phase,confirm:'PRUEBAS_FICTICIAS_CORREO'});
 const run=async phase=>{let r=await prepare(phase);assert.equal(r.status,200,JSON.stringify({phase,prepare:r}));const slots=Array.from({length:counts[phase]},(_,slot)=>slot),results=[];if(phase===3)results.push(...await Promise.all(slots.map(slot=>probe(phase,slot))));else for(const slot of slots)results.push(await probe(phase,slot));for(let slot=0;slot<results.length;slot++){r=results[slot];assert.equal(r.status,200,JSON.stringify({phase,slot,...r}));if(r.data.queries_used!==undefined)assert(r.data.queries_used<=48)}r=await finish(phase);assert.equal(r.status,200,JSON.stringify({phase,finish:r}));return r};
 return{DB,env,call,initialize,prepare,probe,finish,run,sessions:()=>sessions,close:()=>DB.close()};
}
test('mail lab exports only its guarded entrypoint and refuses operational or alternate hosts before any binding',async()=>{
 assert.deepEqual(Object.keys(module),['default']);const env=new Proxy({},{get(){throw Error('No binding may be read')}});
 for(const host of ['https://uadav-api-staging.uadavstream.workers.dev','https://uadav-api.uadavstream.workers.dev','https://uadav-restore-qa.uadavstream.workers.dev','https://uadav-bolsa-lab.other.workers.dev','http://uadav-bolsa-lab.uadavstream.workers.dev'])assert.equal((await worker.fetch(new Request(host+'/health'),env,{})).status,403);
 const r=await worker.fetch(new Request(site),env,{}),html=await r.text();assert.equal(r.status,200);assert.match(html,/SOLO DATOS FICTICIOS/);assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.doesNotMatch(html,/%%NONCE%%|localStorage|sessionStorage|innerHTML/);
 for(const path of ['/api/bolsa_trabajo','/api/admin/jobs/email-delivery-check','/initialize'])assert.equal((await worker.fetch(new Request(site+path,{method:'POST'}),env,{})).status,404);
});
test('key, flag and origin gates run before DB and never read the real mail secrets',async()=>{
 const f=await fixture(false);try{f.env.DB={withSession(){throw Error('DB accessed')},prepare(){throw Error('DB accessed')}};for(const value of [null,'wrong'])assert.equal((await f.call('/mail/status',{}, {key:value})).status,401);assert.equal((await f.call('/mail/status',{}, {origin:'https://untrusted.example'})).status,403);f.env.QA_BOLSA_ONLY='false';assert.equal((await f.call('/mail/status')).status,503)}finally{f.close()}
});
test('empty and foreign databases are refused without installing any mail schema',async()=>{
 for(const foreign of [false,true]){const f=await fixture(false);try{if(foreign){await f.DB.prepare('CREATE TABLE private_data(value TEXT)').run();await f.DB.prepare("INSERT INTO private_data VALUES('preserved')").run()}const r=await f.initialize();assert.equal(r.status,423);const names=(await f.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name);assert.deepEqual(names,foreign?['private_data']:[]);if(foreign)assert.equal((await f.DB.prepare('SELECT value FROM private_data').first()).value,'preserved')}finally{f.close()}}
});
test('seven phases exercise the proof kernel using real SQLite transactions, keep the eight-phase history and use no external network',async()=>{
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('External network forbidden')};const f=await fixture();try{const before=await f.DB.prepare('SELECT * FROM qa_bolsa_guard').first(),records=(await f.DB.prepare('SELECT * FROM job_store_records ORDER BY collection,id').all()).results;
  assert.equal((await f.initialize()).status,200);assert.equal((await f.initialize()).status,200);
  for(let phase=1;phase<=7;phase++){const r=await f.run(phase);assert.equal(r.data.phase,phase);assert.equal(r.data.messages.length,phase);assert.equal(r.data.complete,phase===7);assert.equal(r.data.emails_sent,0);assert.equal(r.data.recovery_enabled,false);assert(!JSON.stringify(r.data).includes(key));assert(!JSON.stringify(r.data).includes('@example.invalid'))}
  assert.deepEqual(await f.DB.prepare('SELECT * FROM qa_bolsa_guard').first(),before);
  assert.deepEqual((await f.DB.prepare("SELECT * FROM job_store_records WHERE substr(id,1,12)<>'JOB-QA-MAIL-' ORDER BY collection,id").all()).results,records);
  assert.equal((await f.call('/mail/status')).data.complete,true);assert.equal((await f.finish(7)).data.complete,true);assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM audience_accounts').first()).n,2);assert(f.sessions()>0);
 }finally{globalThis.fetch=originalFetch;f.close()}
});
test('concurrent foreign schema creation rolls back mail initialization and preserves the foreign table',async()=>{
 const f=await fixture();try{const batch=f.DB.batch;let once=true;f.DB.batch=async statements=>{if(once&&statements.some(s=>s.sql.startsWith('CREATE TABLE IF NOT EXISTS job_recovery_outbox'))){once=false;await f.DB.prepare('CREATE TABLE foreign_race(value TEXT)').run();await f.DB.prepare("INSERT INTO foreign_race VALUES('preserved')").run()}return batch(statements)};
  assert.equal((await f.initialize()).status,503);assert.equal(await f.DB.prepare("SELECT name FROM sqlite_master WHERE name='job_recovery_outbox'").first(),null);assert.equal((await f.DB.prepare('SELECT value FROM foreign_race').first()).value,'preserved');
 }finally{f.close()}
});
test('foreign mail data, partial approval, wrong key and a mismatched module identity cannot run or repurpose the lab',async()=>{
 const f=await fixture();try{assert.equal((await f.initialize()).status,200);const current=f.env.QA_BOLSA_KEY;f.env.QA_BOLSA_KEY='different-lab-key-'+'z'.repeat(48);assert.equal((await f.call('/mail/status',{}, {key:f.env.QA_BOLSA_KEY})).status,423);f.env.QA_BOLSA_KEY=current;
  await f.DB.prepare("UPDATE qa_bolsa_guard SET phase=7").run();assert.equal((await f.call('/mail/status')).status,423);await f.DB.prepare('UPDATE qa_bolsa_guard SET phase=8').run();
  await f.DB.prepare("INSERT INTO qa_mail_messages(job_id,body) VALUES('JOB-QA-MAIL-01',?)").bind(JSON.stringify({to:[{email:'real@example.org'}]})).run();assert.equal((await f.call('/mail/status')).status,423);await f.DB.prepare('DELETE FROM qa_mail_messages').run();
  await f.DB.prepare("UPDATE qa_mail_guard SET mail_hash='wrong-version'").run();assert.equal((await f.call('/mail/status')).data.needs_reset,true);assert.equal((await f.prepare(1)).status,423);assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_recovery_outbox').first()).n,0);
 }finally{f.close()}
});
test('invalid input, phase order, explicit confirmation and held leases cannot execute probes',async()=>{
 const f=await fixture();try{assert.equal((await f.call('/mail/initialize',{confirm:'wrong'})).status,412);assert.equal((await f.initialize()).status,200);assert.equal((await f.prepare(2)).status,409);assert.equal((await f.finish(1)).status,409);
  for(const phase of [0,8,'1',null])assert.equal((await f.prepare(phase)).status,400);
  assert.equal((await f.call('/mail/probe',{}, {raw:'x'.repeat(257)})).status,400);assert.equal((await f.call('/mail/initialize',{confirm:'PRUEBAS_FICTICIAS_CORREO',recipient:'real@example.org'})).status,400);
  assert.equal((await f.prepare(1)).status,200);await f.DB.prepare("INSERT INTO qa_mail_attempts(phase,slot,state,owner,lease_until) VALUES(1,0,'pending','other',?)").bind(Date.now()+60000).run();assert.equal((await f.probe(1,0)).status,409);assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_recovery_outbox').first()).n,0);
 }finally{f.close()}
});
test('completed probes replay and lost finish acknowledgements resume without repeating credential changes',async()=>{
 for(const lost of [false,true]){const f=await fixture();try{await f.initialize();await f.prepare(1);for(let slot=0;slot<2;slot++)assert.equal((await f.probe(1,slot)).status,200);const before=await f.DB.prepare("SELECT revision FROM job_owner_credentials WHERE job_id='JOB-QA-MAIL-01'").first();assert.equal(before.revision,2);assert.equal((await f.probe(1,1)).status,200);
  const prepare=f.DB.prepare;let once=true;f.DB.prepare=function(sql){const s=prepare.call(this,sql);if(sql.startsWith('UPDATE qa_mail_guard SET phase=')){const run=s.run;s.run=async function(){if(once){once=false;if(lost)await run.call(this);throw Error('Synthetic finish acknowledgement loss')}return run.call(this)}}return s};assert.equal((await f.finish(1)).status,503);f.DB.prepare=prepare;assert.equal((await f.finish(1)).data.phase,1);assert.deepEqual(await f.DB.prepare("SELECT revision FROM job_owner_credentials WHERE job_id='JOB-QA-MAIL-01'").first(),before);
 }finally{f.close()}}
});
const html=await readFile(new URL('scripts/job-mail-lab-page.html',root),'utf8'),ui=html.match(/<script nonce="%%NONCE%%">([\s\S]*?)<\/script>/)[1];
const meta={version:'11766-mail-lab-1',scope:'isolated-synthetic-mail-recovery',base_lab_sha256:'a'.repeat(64),mail_sha256:'b'.repeat(64)};
function status(phase=0,extra={}){return{ok:true,...meta,initialized:true,needs_reset:false,phase,complete:phase===7,messages:Array.from({length:phase},(_,i)=>'Prueba '+(i+1)+': aprobado'),next:phase<7?{phase:phase+1,slots:counts[phase+1],parallel:phase+1===3}:null,emails_sent:0,recovery_enabled:false,...extra}}
function page(fetchImpl){const nodes=new Map(),events={},requests=[],copied=[];const make=()=>({value:'',textContent:'',checked:false,hidden:false,disabled:false,children:[],replaceChildren(){this.children=[]},append(x){this.children.push(x)},addEventListener(name,fn){this[name]=fn}});const node=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};
 vm.runInNewContext(ui,{document:{getElementById:node,createElement:make},window:{addEventListener:(name,fn)=>events[name]=fn},fetch:async(url,options)=>{requests.push({url,options});return fetchImpl?fetchImpl(url,options):Response.json(status())},navigator:{clipboard:{writeText:async text=>copied.push(text)}},crypto,Date,AbortController,setTimeout,clearTimeout});
 return{node,events,requests,copied,login:async()=>{node('labKey').value=key;await node('loginForm').submit({preventDefault(){}})}};
}
test('mail-lab UI only reads status on login and requires explicit consent before synthetic mutations',async()=>{const p=page();assert.equal(p.requests.length,0);await p.login();assert.equal(p.requests.length,1);assert.equal(p.requests[0].url,'/mail/status');assert.equal(p.node('labKey').value,'');await p.node('runButton').onclick();assert.equal(p.requests.length,1);assert.equal(p.node('runButton').disabled,true)});
test('mail-lab UI orchestrates seven phases and copies a fixed report without keys or synthetic mailbox data',async()=>{const p=page(async(url,options)=>{const b=JSON.parse(options.body);return Response.json(url==='/mail/probe'?{ok:true,...meta,result:{passed:true}}:url==='/mail/finish'?status(b.phase):status(b.phase?b.phase-1:0))});await p.login();p.node('consent').checked=true;await p.node('runButton').onclick();assert.equal(p.node('copyButton').disabled,false);await p.node('copyButton').onclick();const r=JSON.parse(p.copied[0]);assert.equal(r.result,'complete');assert.equal(r.checks.length,7);assert.equal(r.emails_sent,0);assert.equal(r.recovery_enabled,false);assert(!p.copied[0].includes(key));assert(!p.copied[0].includes('@example.invalid'))});
test('mail-lab UI rejects wrong version, unsafe flags or an unexpected next-step fanout',async()=>{for(const patch of [{scope:'production'},{version:'unknown'},{emails_sent:1},{recovery_enabled:true},{next:{phase:1,slots:2000,parallel:true}}]){const p=page(async()=>Response.json(status(0,patch)));await p.login();assert.equal(p.node('loginPanel').hidden,false);assert.equal(p.node('copyButton').disabled,true)}});
test('mail-lab UI logout during an outstanding phase prevents late results from restoring the session',async()=>{let release;const p=page(async(url)=>url==='/mail/status'?Response.json(status()):new Promise(resolve=>release=()=>resolve(Response.json(status()))));await p.login();p.node('consent').checked=true;const pending=p.node('runButton').onclick();p.node('logoutButton').onclick();release();await pending;assert.equal(p.node('loginPanel').hidden,false);assert.equal(p.node('copyButton').disabled,true);assert.equal(p.node('reportText').textContent,'')});
test('mail-lab UI clears state on pagehide and does not rerun completed or mismatched-module results',async()=>{const p=page(async()=>Response.json(status(7)));await p.login();p.node('consent').checked=true;await p.node('runButton').onclick();assert.equal(p.requests.length,1);p.events.pagehide();assert.equal(p.node('copyButton').disabled,true);assert.equal(p.node('loginPanel').hidden,false);const q=page(async()=>Response.json(status(7,{needs_reset:true,complete:false})));await q.login();assert.equal(q.node('runButton').disabled,true);assert.equal(q.node('copyButton').disabled,true)});
