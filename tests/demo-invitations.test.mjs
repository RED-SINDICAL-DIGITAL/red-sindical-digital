import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const source=readFileSync('functions/_middleware.js','utf8');
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('public access, legacy links and owner-only pause and reopen',async t=>{
  const sqlite=new DatabaseSync(':memory:');
  t.after(()=>sqlite.close());
  sqlite.exec(readFileSync('migrations/demo/001.sql','utf8'));
  function statement(sql,params=[]){
    const stmt=sqlite.prepare(sql);
    return {bind:(...p)=>statement(sql,p),first:()=>stmt.get(...params),all:()=>({results:stmt.all(...params)}),run:()=>({meta:stmt.run(...params)})};
  }
  const env={DEMO_DB:{prepare:statement},DEMO_OWNER_KEY:'fixture-owner',DEMO_INVITE_SECRET:'fixture-sign',DEMO_MAIL_KEY:'fixture-mail',DEMO_FROM:'qa@example.invalid'};
  const origin='https://uadavstream.com.ar';
  const visit=(path,options={})=>onRequest({env,next:()=>new Response('Contenido'),request:new Request(origin+path,options)});
  const post=(body,headers={})=>({method:'POST',headers:{Origin:origin,...headers},body});
  const owner={Authorization:'Bearer fixture','X-Demo-Owner':env.DEMO_OWNER_KEY};
  t.mock.method(globalThis,'fetch',async()=>Response.json({success:true,role:'admin_nacional'}));
  assert.equal(await (await visit('/app.html')).text(),'Contenido');
  assert.equal((await visit('/invitacion.html')).status,303);
  assert.equal((await visit('/demo/solicitar',post(''))).status,410);
  assert.equal((await visit('/demo/admin/pausar',post(''))).status,401);
  assert.equal((await visit('/demo/admin/pausar',post('',{Authorization:'Bearer fixture'}))).status,403);
  const state=()=>visit('/demo/estado');
  await visit('/demo/admin/pausar',post('',owner));
  assert.equal((await state()).status,503);
  assert.equal(await (await visit('/promo')).text(),'Contenido');
  await visit('/demo/admin/reabrir',post('',owner));assert.equal((await state()).status,200);
  env.DEMO_EMERGENCY_PAUSE='1';assert.equal((await state()).status,503);
  assert.equal((await visit('/demo/admin/estado',post('',owner))).status,200);
});
test('admin handles gateway HTML, network failures and an unavailable D1 list',async t=>{
  const origin='https://integration-staging-preserve.uadav-stream-staging.pages.dev';
  const request=new Request(origin+'/demo/admin/estado',{method:'POST',headers:{Origin:origin,Authorization:'Bearer fixture','X-Demo-Owner':'fixture'}});
  const env={DEMO_OWNER_KEY:'fixture',DEMO_DB:{prepare(){throw Error('fixture')}}};
  const mock=t.mock.method(globalThis,'fetch',async()=>new Response('<html>gateway</html>'));
  assert.equal((await onRequest({request,env})).status,502);
  mock.mock.mockImplementation(async()=>{throw Error('network')});
  assert.equal((await onRequest({request,env})).status,502);
  env.DEMO_ADMIN_API={fetch:async()=>Response.json({success:true,role:'admin_nacional'})};
  assert.equal((await onRequest({request,env})).status,503);
});
test('Pages verifies the session through the staging Worker entry point', async ()=>{
  const {default:worker}=await import('../worker-demo-staging.js');
  const origin='https://integration-staging-preserve.uadav-stream-staging.pages.dev';
  const request=new Request(origin+'/demo/admin/estado',{method:'POST',headers:{Origin:origin,Authorization:'Bearer fixture','X-Demo-Owner':'owner'}});
  const env={DEMO_ADMIN_API:{async fetch(req){
    assert.equal(req.redirect,'manual');
    return worker.fetch(req,{ADMIN_KEY:'fixture',UADAV_DB:{get:async()=>null}},{});
  }},DEMO_OWNER_KEY:'owner',DEMO_DB:{prepare:()=>({first:async()=>({paused:0})})}};
  const response=await onRequest({request,env});
  assert.equal(response.status,200);
  assert.equal(await response.text(),'Acceso abierto.');
});
