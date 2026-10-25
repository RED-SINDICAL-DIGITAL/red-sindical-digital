import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,randomUUID} from 'node:crypto';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker,uadavExternalURL,uadavExternalPublicAddress,uadavExternalFetchHTML,uadavExternalPreview,uadavExternalCandidates,uadavPrepareExternalJobs}=await loadWorker();
const source='https://fuente.example/convocatorias/Uno?idioma=es',origin='https://uadav-stream-staging.pages.dev',NOW=Date.parse('2026-10-25T01:30:00Z');
const offer=extra=>({titulo:'QA externa',descripcion:'Prueba ficticia',source_url:source,fecha_limite:'2026-10-24',revisado_por_admin:true,...extra});
function network({dns,html='<title>Convocatoria QA</title>',page}={}){
  const calls=[];
  const requestFetch=async(url,options)=>{
    calls.push({url,options});
    if(new URL(url).hostname==='cloudflare-dns.com'){
      const parsed=new URL(url),type=parsed.searchParams.get('type'),host=parsed.searchParams.get('name');
      const answer=dns?dns(host,type):type==='A'?[{type:1,data:'93.184.215.14'}]:[];
      return Response.json({Status:0,Answer:answer});
    }
    return page?page(url,options):new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
  };
  return {calls,requestFetch,pages:()=>calls.filter(x=>new URL(x.url).hostname!=='cloudflare-dns.com')};
}

test('source URLs reject private literals, credentials, special protocols and local names; valid public fd/fc domains work',()=>{
  for(const url of ['http://fuente.example/x','file:///etc/passwd','https://u:p@fuente.example/x','https://127.0.0.1/x','https://2130706433/x','https://0x7f000001/x','https://[::1]/x','https://[::ffff:127.0.0.1]/x','https://intranet/x','https://x.local/x','https://x.internal/x','https://localhost./x','https://fuente.example:8443/x'])assert.throws(()=>uadavExternalURL(url),e=>e.externalStatus===400,url);
  assert.equal(uadavExternalURL('https://FD-CULTURA.example./Convocatoria#formulario'),'https://fd-cultura.example/Convocatoria');
  assert.equal(uadavExternalURL(source),source);
});
test('DNS checks reject private, reserved, mapped, loopback and transition addresses for IPv4 and IPv6',()=>{
  for(const address of ['0.0.0.0','10.0.0.1','100.64.1.2','127.1.2.3','169.254.169.254','172.16.0.1','192.168.2.3','192.0.2.1','198.18.0.1','198.51.100.2','203.0.113.3','224.0.0.1','255.255.255.255','999.1.1.1','::1','::ffff:192.168.0.1','fc00::1','fe80::1','ff00::1','2001:db8::1','2002:7f00:1::1','2001:0::1','3fff::1'])assert.equal(uadavExternalPublicAddress(address),false,address);
  for(const address of ['8.8.8.8','93.184.215.14','172.32.0.1','2606:4700:4700::1111','2001:4860:4860::8888'])assert.equal(uadavExternalPublicAddress(address),true,address);
});
test('a public read verifies A and AAAA, follows no automatic redirects and forwards no caller credentials',async()=>{
  const n=network(),result=await uadavExternalFetchHTML(source,{requestFetch:n.requestFetch});
  assert.equal(result.url,source);assert.match(result.html,/Convocatoria QA/);assert.equal(n.calls.length,3);
  assert.deepEqual(n.calls.slice(0,2).map(x=>new URL(x.url).searchParams.get('type')),['A','AAAA']);
  for(const call of n.calls){assert(!Object.keys(call.options.headers).some(k=>/authorization|cookie|key|origin|referer/i.test(k)));assert(call.options.signal)}
  assert.equal(n.pages()[0].options.redirect,'manual');
});
test('mixed public/private DNS answers and an unavailable resolver stop before the source HTTP request',async()=>{
  for(const dns of [(host,type)=>type==='A'?[{type:1,data:'127.0.0.1'}]:[],(host,type)=>type==='A'?[{type:1,data:'93.184.215.14'}]:[{type:28,data:'fc00::1'}],()=>[]]){
    const n=network({dns});await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:n.requestFetch}),e=>/^EXTERNAL_DNS/.test(e.externalCode));assert.equal(n.pages().length,0);
  }
  let calls=0;await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:async()=>{calls++;return new Response('Unavailable',{status:503})}}),e=>e.externalCode==='EXTERNAL_DNS');assert.equal(calls,1);
});
test('every redirect is revalidated, including its DNS destination; relative HTTPS redirects retain the canonical final URL',async()=>{
  for(const location of ['http://fuente.example/unsafe','https://127.0.0.1/private','https://user:pass@fuente.example/private']){
    const n=network({page:()=>new Response(null,{status:302,headers:{location}})});
    await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:n.requestFetch}),e=>e.externalCode==='EXTERNAL_URL');assert.equal(n.pages().length,1);
  }
  const blocked=network({dns:(host,type)=>type==='A'?[{type:1,data:host==='otra.example'?'10.0.0.5':'93.184.215.14'}]:[],page:()=>new Response(null,{status:302,headers:{location:'https://otra.example/private'}})});
  await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:blocked.requestFetch}),e=>e.externalCode==='EXTERNAL_DNS_PRIVATE');assert.equal(blocked.pages().length,1);
  let first=true;const valid=network({page:()=>first?(first=false,new Response(null,{status:302,headers:{location:'/final#detalle'}})):new Response('<title>Final</title>',{headers:{'content-type':'text/html'}})});
  assert.equal((await uadavExternalFetchHTML(source,{requestFetch:valid.requestFetch})).url,'https://fuente.example/final');assert.equal(valid.calls.length,6);
});
test('redirect loops have a fixed subrequest bound',async()=>{
  const n=network({page:()=>new Response(null,{status:302,headers:{location:'/otra'}})});
  await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:n.requestFetch}),e=>e.externalCode==='EXTERNAL_REDIRECT');assert.equal(n.pages().length,4);assert.equal(n.calls.length,12);
});
test('HTML size is bounded before buffering, stream overflow is canceled, and non-HTML content is rejected',async()=>{
  for(const response of [()=>new Response('x',{headers:{'content-type':'text/html','content-length':'900000'}}),()=>new Response('x'.repeat(750001),{headers:{'content-type':'text/html'}})]){
    const n=network({page:response});await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:n.requestFetch}),e=>e.externalCode==='EXTERNAL_SIZE');
  }
  let canceled=false;const n=network({page:()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(750001))},cancel(){canceled=true}}),{headers:{'content-type':'text/html'}})});
  await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:n.requestFetch}),e=>e.externalCode==='EXTERNAL_SIZE');assert(canceled);
  const json=network({page:()=>Response.json({secret:'not HTML'})});await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:json.requestFetch}),e=>e.externalCode==='EXTERNAL_TYPE');
});
test('timeouts cover both resolution and a stalled source body without exposing transport details',async()=>{
  await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:()=>new Promise(()=>{}),timeoutMs:10}),e=>e.externalCode==='EXTERNAL_TIMEOUT');
  const n=network({page:()=>new Response(new ReadableStream({start(){},cancel(){}}),{headers:{'content-type':'text/html'}})});
  await assert.rejects(uadavExternalFetchHTML(source,{requestFetch:n.requestFetch,timeoutMs:10}),e=>e.externalCode==='EXTERNAL_TIMEOUT');
});
test('JSON-LD and metadata become a bounded public preview, with canonical identity and calendar dates',()=>{
  const html='<title>Fallback</title><script type="application/ld+json">'+JSON.stringify({'@graph':[{'@type':['JobPosting','CreativeWork'],title:'Música &amp; teatro',description:'<b>Ficticia</b>',identifier:{value:'123'},validThrough:'2026-11-23T23:59:59-03:00',hiringOrganization:{name:'Fuente QA'},jobLocation:{address:{addressLocality:'Rosario',addressRegion:'Santa Fe'}},image:'javascript:alert(1)'}]})+'</script>';
  const result=uadavExternalPreview(html,source,'job');assert.equal(result.item.titulo,'Música & teatro');assert.equal(result.item.descripcion,'Ficticia');assert.equal(result.item.fecha_limite,'2026-11-23');assert.equal(result.item.external_id,source);assert.equal(result.item.application_url,source);assert.equal(result.item.imagen,'');assert.equal(result.item.ciudad,'Rosario');
  const fallback=uadavExternalPreview('<meta property="og:title" content="Convocatoria &amp; QA"><meta name="description" content="Ficticia">',source,'job');assert.equal(fallback.item.titulo,'Convocatoria & QA');assert.equal(fallback.item.imagen,'');
  assert.throws(()=>uadavExternalPreview('',source,'other'),e=>e.externalStatus===400);
});
test('discovery drops executable and private links, deduplicates URLs and bounds candidate count',()=>{
  const html='<a href="javascript:alert(1)">Convocatoria maliciosa</a><a href="https://127.0.0.1/x">Casting interno</a><a href="/uno#detalle">Convocatoria uno</a><a href="/uno#formulario">Convocatoria repetida</a>'+Array.from({length:20},(_,i)=>'<a href="/casting/'+i+'">Casting ficticio '+i+'</a>').join('');
  const results=uadavExternalCandidates(html,source,'job',3);assert.equal(results.length,3);assert.equal(results[0].href,'https://fuente.example/uno');assert.equal(new Set(results.map(x=>x.href)).size,3);
});
test('external identity uses the full canonical source URL and cannot overwrite native records or a different source identifier',async()=>{
  const native={id:'JOB-NATIVE',titulo:'Nativa',source_url:source,activo:true},first=(await uadavPrepareExternalJobs([native],[offer({external_id:'shared-123'})],{now:NOW})).list;
  assert.equal(first.length,2);assert.equal(first[0].titulo,'Nativa');
  const second=await uadavPrepareExternalJobs(first,[offer({source_url:'https://otra.example/uno',external_id:'shared-123'})],{now:NOW});assert.equal(second.imported,1);assert.equal(second.list.length,3);
  const variant=await uadavPrepareExternalJobs(second.list,[offer({source_url:source.replace('/Uno','/uno')})],{now:NOW});assert.equal(variant.imported,1);
  const repeated=await uadavPrepareExternalJobs(variant.list,[offer({source_url:source+'#formulario',titulo:'Actualizada'})],{now:NOW});assert.equal(repeated.imported,0);assert.equal(repeated.updated,1);assert.equal(repeated.list[1].id,first[1].id);
});
test('legacy identity and manual closure survive reimport; invalid rows and unsafe application URLs cancel the entire preparation',async()=>{
  const old={id:'JOB-EXT-LEGACY',origen:'externo',source_url:source,external_key:'legacy-123',request_id:'legacy-request',activo:false,estado:'cerrada_por_contratante',titulo:'Anterior'};
  const result=await uadavPrepareExternalJobs([old],[offer({titulo:'Actualizada'})],{now:NOW});assert.equal(result.updated,1);assert.equal(result.list[0].id,old.id);assert.equal(result.list[0].request_id,old.request_id);assert.equal(result.list[0].activo,false);assert.equal(result.list[0].estado,old.estado);
  await assert.rejects(uadavPrepareExternalJobs([old],[offer(),offer({source_url:'https://otra.example/x',application_url:'javascript:alert(1)'})],{now:NOW}),e=>e.externalStatus===400);assert.equal(old.titulo,'Anterior');
  await assert.rejects(uadavPrepareExternalJobs([],[offer(),offer({source_url:source+'#otra'})],{now:NOW}),e=>e.externalCode==='EXTERNAL_DUPLICATE');
  for(const date of ['2026-02-30','2026-10-23',''])await assert.rejects(uadavPrepareExternalJobs([],[offer({fecha_limite:date})],{now:NOW}),e=>e.externalCode==='EXTERNAL_DATE');
});

async function fixture({d1=true}={}){
  const DB=d1?sqliteD1():null,kv=new Map(),env={...(DB?{DB}:{}),ADMIN_KEY:'synthetic-admin',UADAV_DB:{get:async key=>kv.get(key)||null,put:async(key,value)=>kv.set(key,String(value))}};
  if(DB){
    await DB.prepare('PRAGMA foreign_keys=ON').run();
    for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql']){
      const sql=await readFile(new URL('../migrations/staging/'+file,import.meta.url),'utf8');for(const statement of sql.replace(/--[^\n]*/g,'').split(';').filter(x=>x.trim()))await DB.prepare(statement).run();
    }
    await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();env.JOB_STORE_D1='true';
  }
  const call=async(route,method='GET',body,auth=true)=>{
    const response=await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.117',...(auth?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,{});
    return {status:response.status,data:await response.json()};
  };
  return {DB,kv,env,call,close:()=>DB?.close()};
}
test('native publication, Admin edits and reviewed imports use Argentina day after UTC midnight and reject impossible dates',async t=>{
  t.mock.timers.enable({apis:['Date'],now:NOW});const f=await fixture();
  try{
    const created=await f.call('bolsa_trabajo','POST',{titulo:'QA',descripcion:'Ficticia',contacto:'qa@example.invalid',request_id:randomUUID(),fecha_limite:'2026-10-24'},false);assert.equal(created.status,200);
    const id=created.data.item.id;
    const defaulted=await f.call('bolsa_trabajo','POST',{titulo:'QA 30 días',descripcion:'Ficticia',contacto:'qa@example.invalid',request_id:randomUUID()},false);assert.equal(defaulted.status,200);assert.equal(defaulted.data.item.fecha_limite,'2026-11-23');
    const renewed=await f.call('bolsa_trabajo/mi-oferta/gestionar','POST',{job_id:defaulted.data.item.id,clave:defaulted.data.clave_contratante,accion:'renovar',dias:30},false);assert.equal(renewed.status,200);
    assert.equal((await f.call('bolsa_trabajo')).data.find(row=>row.id===defaulted.data.item.id).fecha_limite,'2026-11-23');
    assert.equal((await f.call('bolsa_trabajo','PUT',{id:defaulted.data.item.id,activo:false})).status,200);
    assert.equal((await f.call('bolsa_trabajo','PUT',{id,fecha_limite:'2026-10-24',titulo:'Editada'})).status,200);
    for(const deadline of ['2026-10-23','2026-11-31','2027-02-29',''])assert.equal((await f.call('bolsa_trabajo','PUT',{id,fecha_limite:deadline})).status,400);
    const external=await f.call('admin/federated/import','POST',{kind:'job',items:[offer()]});assert.equal(external.status,200);assert.equal(external.data.imported,1);
    assert.equal((await f.call('bolsa_trabajo','PUT',{id,activo:false})).status,200);
    const tomorrow=Date.parse('2026-10-26T04:00:00Z');t.mock.timers.setTime(tomorrow);
    assert.equal((await f.call('bolsa_trabajo','PUT',{id,activo:true})).status,400);
    assert.equal((await f.call('bolsa_trabajo','PUT',{id,activo:false,fecha_limite:'2026-10-24',descripcion:'Historial corregido'})).status,200);
    assert.equal((await f.call('bolsa_trabajo','GET',undefined,false)).data.length,0);
  }finally{f.close();t.mock.timers.reset()}
});
test('D1 imports remain atomic, preserve KV, reject the generic bypass and cannot re-open a closed external record',async()=>{
  const f=await fixture();try{
    const body={kind:'job',items:[offer({fecha_limite:'2099-12-31'})]};
    assert.equal((await f.call('admin/federated/import','POST',body,false)).status,401);
    const races=await Promise.all([f.call('admin/federated/import','POST',body),f.call('admin/federated/import','POST',body)]);assert(races.some(x=>x.status===200));
    assert.equal((await f.DB.prepare("SELECT COUNT(*) AS n FROM job_store_records WHERE collection='bolsa_trabajo'").first()).n,1);
    const id=(await f.call('bolsa_trabajo')).data[0].id;assert.equal((await f.call('bolsa_trabajo','PUT',{id,activo:false})).status,200);
    assert.equal((await f.call('admin/federated/import','POST',body)).data.updated,1);assert.equal((await f.call('bolsa_trabajo','GET',undefined,false)).data.length,0);
    assert.equal((await f.call('admin/import','POST',{entity:'jobs',rows:[{titulo:'Bypass',activo:true}]})).status,409);
    const bad={kind:'job',items:[offer({source_url:'https://fuente.example/new',fecha_limite:'2099-12-31'}),offer({source_url:'https://otra.example/bad',fecha_limite:'2099-12-31',application_url:'https://127.0.0.1/'})]};
    assert.equal((await f.call('admin/federated/import','POST',bad)).status,400);
    assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_records').first()).n,1);assert.equal(f.kv.has('bolsa_trabajo'),false);
    for(const route of ['acceso/solicitar','acceso/restablecer'])assert.equal((await f.call('bolsa_trabajo/'+route,'POST',{},false)).status,503);
  }finally{f.close()}
});
test('HTML preview requires Admin, validates kind before egress and is read-only',async()=>{
  const f=await fixture({d1:false}),n=network({html:'<title>Convocatoria QA</title><meta name="description" content="Ficticia">'}),previous=globalThis.fetch;globalThis.fetch=n.requestFetch;
  try{
    assert.equal((await f.call('admin/federated/url-preview','POST',{url:source,kind:'job'},false)).status,401);
    assert.equal((await f.call('admin/federated/url-preview','POST',{url:source,kind:'other'})).status,400);assert.equal(n.calls.length,0);
    const result=await f.call('admin/federated/url-preview','POST',{url:source,kind:'job'});assert.equal(result.status,200);assert.equal(result.data.item.external_id,source);assert.equal(f.kv.has('bolsa_trabajo'),false);
  }finally{globalThis.fetch=previous;f.close()}
});
test('source discovery has bounded batches and rotates older sources without publishing jobs',async()=>{
  const f=await fixture({d1:false}),n=network({html:'<a href="/casting/qa">Convocatoria ficticia QA</a>'}),previous=globalThis.fetch;globalThis.fetch=n.requestFetch;
  try{
    f.kv.set('federated_sources_initialized','1');f.kv.set('federated_sources',JSON.stringify(Array.from({length:3},(_,i)=>({id:'qa-'+i,kind:'job',name:'QA',url:'https://fuente.example/'+i,active:true}))));
    const first=await f.call('admin/federated/sync','POST',{});assert.equal(first.data.results.length,2);assert.equal(first.data.remaining,1);assert(first.data.results.every(x=>x.ok&&x.found===1));
    const next=await f.call('admin/federated/sync','POST',{});assert.equal(next.data.results[0].source_id,'qa-2');assert.equal(f.kv.has('bolsa_trabajo'),false);assert.equal(n.calls.length,12);
  }finally{globalThis.fetch=previous;f.close()}
});

test('ambiguous existing source URLs and full collections fail without truncating or changing any record',async()=>{
  const legacy={id:'JOB-EXT-A',origen:'externo',source_url:source,activo:false};
  await assert.rejects(uadavPrepareExternalJobs([legacy,{...legacy,id:'JOB-EXT-B'}],[offer()],{now:NOW}),e=>e.externalCode==='EXTERNAL_EXISTING_DUPLICATE');
  await assert.rejects(uadavPrepareExternalJobs([legacy],[offer({source_url:'https://otra.example/new'})],{now:NOW,maxRecords:1}),e=>e.externalCode==='EXTERNAL_CAPACITY');
  assert.equal(legacy.id,'JOB-EXT-A');assert.equal(legacy.activo,false);
});

test('malformed, non-object and oversized Admin import bodies fail before a source read or database write',async()=>{
  const f=await fixture({d1:false}),n=network(),previous=globalThis.fetch;globalThis.fetch=n.requestFetch;
  try{
    for(const body of [null,[],false])for(const route of ['admin/federated/url-preview','admin/federated/sync','admin/federated/import'])assert.equal((await f.call(route,'POST',body)).status,400);
    assert.equal((await f.call('admin/federated/url-preview','POST',{url:source,kind:'job',extra:'x'.repeat(5000)})).status,413);
    assert.equal(n.calls.length,0);assert.equal(f.kv.has('bolsa_trabajo'),false);
  }finally{globalThis.fetch=previous;f.close()}
});

test('a close immediately before an external reimport commit cancels the entire stale import',async()=>{
  const f=await fixture();try{
    const body={kind:'job',items:[offer({fecha_limite:'2099-12-31'})]};assert.equal((await f.call('admin/federated/import','POST',body)).status,200);
    const id=(await f.call('bolsa_trabajo')).data[0].id,batch=f.DB.batch;let injected=false;
    f.DB.batch=async statements=>{
      if(!injected&&statements.some(s=>s.sql.startsWith('UPDATE job_store_records'))){injected=true;
        const row=await f.DB.prepare("SELECT data_json FROM job_store_records WHERE collection='bolsa_trabajo' AND id=?").bind(id).first();
        await f.DB.prepare("UPDATE job_store_records SET data_json=?,revision=revision+1 WHERE collection='bolsa_trabajo' AND id=?").bind(JSON.stringify({...JSON.parse(row.data_json),activo:false,estado:'cerrada_por_contratante'}),id).run();
      }
      return batch(statements);
    };
    const result=await f.call('admin/federated/import','POST',{kind:'job',items:[offer({titulo:'Reimportada',fecha_limite:'2099-12-31'}),offer({titulo:'Otra nueva',source_url:'https://otra.example/new',fecha_limite:'2099-12-31'})]});
    assert.equal(result.status,409);assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM job_store_records').first()).n,1);
    const row=await f.DB.prepare("SELECT data_json FROM job_store_records WHERE collection='bolsa_trabajo' AND id=?").bind(id).first();assert.equal(JSON.parse(row.data_json).activo,false);assert.equal((await f.call('bolsa_trabajo','GET',undefined,false)).data.length,0);
  }finally{f.close()}
});
