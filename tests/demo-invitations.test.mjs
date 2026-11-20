import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const source=readFileSync('functions/_middleware.js','utf8');
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('request, approve, redeem once, pause an existing session and recover',async t=>{
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
  let ticket;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    if(url.endsWith('/api/admin_check'))return Response.json({success:true,role:'admin_nacional'});
    assert.equal(url,'https://api.resend.com/emails');
    ticket=JSON.parse(options.body).text.split('#').pop();return Response.json({id:'fixture'});
  });
  for(let i=0;i<2;i++)assert.equal((await visit('/demo/solicitar',post(new URLSearchParams({email:'qa@example.invalid'})))).status,200);
  assert.equal((await visit('/demo/admin/lista',post(''))).status,401);
  const rows=await (await visit('/demo/admin/lista',post('',owner))).json();
  assert.equal(rows.length,1);
  assert.equal((await visit('/demo/admin/invitar',post(rows[0].id,owner))).status,200);
  const redeem=()=>visit('/demo/canjear',post(new URLSearchParams({ticket})));
  const ok=await redeem(); assert.equal(ok.status,303);
  assert.equal((await redeem()).status,403);
  const Cookie=ok.headers.get('set-cookie').split(';')[0];
  const state=()=>visit('/demo/estado',{headers:{Cookie}});
  assert.equal((await state()).status,200);
  await visit('/demo/admin/pausar',post('',owner));
  assert.equal((await state()).status,503);
  assert.equal(await (await visit('/promo')).text(),'Contenido');
  await visit('/demo/admin/reabrir',post('',owner));assert.equal((await state()).status,200);
  env.DEMO_EMERGENCY_PAUSE='1';assert.equal((await state()).status,503);
  assert.equal((await visit('/demo/admin/lista',post('',owner))).status,200);
});
