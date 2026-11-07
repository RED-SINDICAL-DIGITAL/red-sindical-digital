const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const worker=fs.readFileSync(path.join(__dirname,'..','worker.js'),'utf8');
const ownerStart=worker.indexOf("if(path==='/api/eventos/mis')");
const ownerEnd=worker.indexOf("if(path==='/api/eventos/receipt'",ownerStart);
const route=worker.slice(ownerStart,ownerEnd);
const publishStart=worker.indexOf("if (path === '/api/eventos') {");
const publishEnd=worker.indexOf("if (path === '/api/cartelera')",publishStart);
const publish=worker.slice(publishStart,publishEnd);
test('events owner route is staging-and-D1-gated, denies unsupported HTTP methods',()=>{
 assert(ownerStart>0&&ownerEnd>ownerStart);
 assert.match(route,/!atomicEventsEnabled\|\|!hasD1\(\)/);
 assert.match(route,/\['GET','POST'\]\.includes\(request\.method\)/);
 assert.match(route,/request\.method==='POST'&&request\.headers\.get\('Origin'\)!=='https:\/\/uadav-stream-staging\.pages\.dev'/);
 assert.match(route,/Cache-Control','no-store'/);
});
test('server authenticates with account identity and never trusts email, event ID or arbitrary token',()=>{
 assert.match(route,/identity=await aeIdentity\(request,env\)/);
 assert.match(publish,/identity=await aeIdentity\(request,env\)/);
 assert.match(publish,/item\.created_by_account_id=identity\.accountId/);
 assert(!route.includes('contacto_email'));
 assert(!route.includes('request_id'));
 assert(!route.includes('artist_token'));
 assert(!route.includes('isAdmin()'));
});
test('private listing and mutations filter by server-associated owner in D1',()=>{
 assert.match(route,/json_extract\(data_json,'\$\.created_by_account_id'\)=\?/);
 assert.match(route,/\.bind\(identity\.accountId\)\.all\(\)/);
 assert.match(route,/\.bind\(b\.id,identity\.accountId\)\.first\(\)/);
 assert.match(route,/current\.created_by_account_id!==identity\.accountId/);
 assert.match(route,/status IN \('published','hidden'\)/);
 assert.match(route,/\['hide','publish','edit'\]\.includes\(b\.action\)/);
 assert.match(route,/await mutateCanonicalEvent\(before,after\)/);
 assert.match(route,/saved\.conflict/);
});
test('owner list does not leak contact email, private keys or authorization credentials',()=>{
 assert.match(route,/SELECT id,title,start_date,status,data_json FROM events/);
 assert(!route.includes('SELECT * FROM events'));
 assert(!route.includes('Authorization'));
 assert(!route.includes('secret'));
 assert.match(route,/descripcion_corta:String\(data\.descripcion_corta/);
});
test('public receipt route never grants ownership and legacy events cannot be auto-claimed',()=>{
 const receipt=worker.slice(worker.indexOf("if(path==='/api/eventos/receipt'"),worker.indexOf("if(path==='/api/eventos/capabilities'"));
 assert(!receipt.includes('created_by_account_id'));
 assert.match(publish,/if\(atomicEventsEnabled&&request\.headers\.get\('Authorization'\)\)/);
 assert(!route.includes('INSERT OR REPLACE'));
 assert(!route.includes('UPDATE events SET created_by_account_id'));
});

test('owner edit permits only bounded safe text and schedule changes',()=>{
 assert.match(route,/const limits=\{titulo:180,descripcion_corta:300,lugar:180,ciudad:120,fecha:10,hora:5\}/);
 assert.match(route,/!Object\.hasOwn\(limits,k\)/);
 assert.match(route,/typeof patch\[k\]!=='string'/);
 assert.match(route,/uadavEventScheduleError\(after,\{required:true\}\)/);
 assert.match(route,/after\.nombre=after\.titulo/);
 assert.match(route,/after\.fecha_inicio=after\.fecha/);
 assert(!route.includes('patch.destacado_pagado'));
 assert(!route.includes('patch.pago_referencia'));
 assert(!route.includes('patch.created_by_account_id'));
});

test('staging health exposes event owner capability only when D1 atomic mode is enabled',()=>{
 assert.match(worker,/event_owner_revision:'20261107-owner-verified-v1'/);
 assert.match(worker,/event_owner_enabled:atomicEventsEnabled&&hasD1\(\)/);
});
