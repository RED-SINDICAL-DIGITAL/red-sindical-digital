import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,readdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {build,stagingOrigin,transform,stagingRuntime,API} from '../scripts/build-staging.mjs';
const origin='https://uadav-stream-staging.pages.dev';
test('relative API writes reach staging once and preserve request body and headers',async()=>{
 const calls=[];const window={fetch:async(input,init)=>{calls.push({input,init});return new Response('{}');}};
 const ctx={window,location:{origin,href:origin+'/usuario.html'},document:{addEventListener(){}},Request,URL,Promise,Error};
 vm.runInNewContext('('+stagingRuntime.toString()+')('+JSON.stringify(origin)+','+JSON.stringify(API)+')',ctx);
 const request=new Request(origin+'/api/account?x=1',{method:'POST',headers:{Authorization:'Bearer SYNTHETIC'},body:'test-data'});
 await window.fetch(request);
 assert.equal(calls.length,1);assert.equal(calls[0].input.url,API+'account?x=1');assert.equal(calls[0].input.method,'POST');assert.equal(calls[0].input.headers.get('Authorization'),'Bearer SYNTHETIC');assert.equal(await calls[0].input.text(),'test-data');
 await assert.rejects(window.fetch('https://uadav-api.uadavstream.workers.dev/api/account'),/Production request blocked/);assert.equal(calls.length,1);
});
test('rejects production, lookalike origins and credential-bearing URLs',()=>{
 for(const s of ['https://uadavstream.com.ar','http://uadav-stream-staging.pages.dev','https://uadav-stream-staging.pages.dev.attacker.invalid','https://user@uadav-stream-staging.pages.dev','https://uadav-stream-staging.pages.dev/?x=1'])assert.throws(()=>stagingOrigin(s));
 assert.equal(stagingOrigin(origin),origin);
});
test('rewrites absolute and escaped production destinations including www',()=>{
 const s=transform('https://www.uadavstream.com.ar/a https:\\/\\/uadav-api.uadavstream.workers.dev/api/ https://uadavstream.com.ar',origin);
 assert(!s.includes('www.uadav-stream'));assert(!s.includes('uadavstream.com.ar'));assert(s.includes(new URL(API).hostname));
});
test('build isolates assets without copying backend, deployment metadata or private trees',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'uadav-build-'));
 try{
  for(const p of ['index.html','app.html','usuario.html','gestionar-artista.html'])await writeFile(path.join(root,p),'<html><head><title>T</title></head><body><script>fetch("https://uadav-api.uadavstream.workers.dev/api/")</script></body></html>');
  await writeFile(path.join(root,'uadav-account-sync.js'),'const api="https://uadav-api.uadavstream.workers.dev/api/";');
  for(const p of ['worker.js','_worker.js','CNAME','secret.env'])await writeFile(path.join(root,p),'DO NOT PUBLISH');
  await mkdir(path.join(root,'docs'));await writeFile(path.join(root,'docs','private.html'),'DO NOT PUBLISH');
  await mkdir(path.join(root,'assets'));await writeFile(path.join(root,'assets','logo.svg'),'<svg/>');
  await mkdir(path.join(root,'tests'));
  await writeFile(path.join(root,'tests','staging-signals-diagnostic.html'),'<html><head><title>Signal diagnostic</title></head><body>STAGING ONLY</body></html>');
  await writeFile(path.join(root,'tests','private-fixture.json'),'DO NOT PUBLISH');
  const result=await build(root,origin);const names=await readdir(result.out);
  for(const p of ['worker.js','_worker.js','CNAME','secret.env','docs'])assert(!names.includes(p),p);
  const page=await readFile(path.join(result.out,'usuario.html'),'utf8');assert(page.includes('noindex'));assert(page.indexOf('staging-bootstrap.js')<page.indexOf('fetch('));assert(!page.includes('uadav-api.uadavstream.workers.dev'));
  const headers=await readFile(path.join(result.out,'_headers'),'utf8');const connect=headers.match(/connect-src ([^;]+)/)[1];assert(connect.includes(new URL(API).origin));assert(!connect.includes('https:;'));assert(!connect.includes('uadav-api.uadavstream.workers.dev'));
  assert.equal(await readFile(path.join(root,'worker.js'),'utf8'),'DO NOT PUBLISH');
  assert.deepEqual(await readdir(path.join(result.out,'tests')),['staging-signals-diagnostic.html']);
  const diagnostic=await readFile(path.join(result.out,'tests','staging-signals-diagnostic.html'),'utf8');
  assert(diagnostic.includes('STAGING ONLY'));assert(diagnostic.includes('noindex'));assert(diagnostic.includes('staging-bootstrap.js'));
  assert(result.manifest.files.every(f=>/^[a-f0-9]{64}$/.test(f.sha256)));
  await assert.rejects(build(root,origin),/already exists/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('staging banner appears only in the top document, keeping embedded layout unchanged',()=>{
 for(const embedded of [false,true]){
  const appended=[],classes=[];let ready;const window={fetch:async()=>new Response('{}')};window.self=window;window.top=embedded?{}:window;
  const ctx={window,location:{origin,href:origin+'/app.html'},document:{documentElement:{classList:{add:v=>classes.push(v)}},body:{appendChild:b=>appended.push(b)},createElement:()=>({setAttribute(){}}),addEventListener:(event,fn)=>{ready=fn}},Request,URL,Promise,Error};
  vm.runInNewContext('('+stagingRuntime.toString()+')('+JSON.stringify(origin)+','+JSON.stringify(API)+')',ctx);ready();
  assert.equal(appended.length,embedded?0:1);assert.equal(classes.length,embedded?0:1);
 }
});
