// Runs the real standalone Worker in Cloudflare's engine, with all outbound
// traffic routed to a synthetic in-process service. No bindings or live data.
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const binary=process.env.UADAV_WORKERD_BIN||'workerd';
const dir=await mkdtemp(join(tmpdir(),'uadav-external-workerd-'));
const entry=`import worker,{uadavExternalFetchHTML,uadavExternalPreview} from './worker.mjs';
function check(ok,message){if(!ok)throw Error(message)}
async function rejected(url,code){try{await uadavExternalFetchHTML(url,{timeoutMs:25});throw Error('Expected rejection: '+code)}catch(error){check(error.externalCode===code,'Expected '+code+', received '+error.externalCode)}}
export default {async test(){
 const page=await uadavExternalFetchHTML('https://good.example/qa');
 const preview=uadavExternalPreview(page.html,page.url,'job');
 check(preview.item.titulo==='QA workerd · Música','structured UTF-8 title');
 check(preview.item.descripcion==='Prueba ficticia','structured description');
 check(preview.item.ciudad==='Rosario'&&preview.item.fecha_limite==='2099-12-31','structured fields');
 console.log('PASS workerd: real fetch, manual DNS policy and streamed UTF-8 metadata');
 const redirected=await uadavExternalFetchHTML('https://redirected.example/qa');
 check(redirected.url==='https://good.example/final','relative/cross-source redirect identity');
 console.log('PASS workerd: source redirect revalidation');
 await rejected('https://private.example/qa','EXTERNAL_DNS_PRIVATE');
 console.log('PASS workerd: private DNS rejected before source');
 await rejected('https://badresolver.example/qa','EXTERNAL_DNS_REDIRECT');
 console.log('PASS workerd: resolver redirect rejected without following it');
 await rejected('https://nonjsonresolver.example/qa','EXTERNAL_DNS_FORMAT');
 console.log('PASS workerd: invalid resolver JSON');
 await rejected('https://nonhtml.example/qa','EXTERNAL_TYPE');
 console.log('PASS workerd: non-HTML source rejected');
 await rejected('https://oversize.example/qa','EXTERNAL_SIZE');
 console.log('PASS workerd: actual streamed size limit');
 await rejected('https://stalled.example/qa','EXTERNAL_TIMEOUT');
 console.log('PASS workerd: stalled body and cancellation do not defeat timeout');
 const env={ADMIN_KEY:'synthetic-admin',UADAV_DB:{get:async()=>null,put:async()=>{}}};
 const request=auth=>new Request('https://uadav-api-staging.uadavstream.workers.dev/api/admin/federated/url-preview',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://uadav-stream-staging.pages.dev',...(auth?{Authorization:'Bearer synthetic-admin'}:{})},body:JSON.stringify({kind:'job',url:'https://good.example/qa'})});
 check((await worker.fetch(request(false),env,{})).status===401,'Admin access must be required');
 const response=await worker.fetch(request(true),env,{}),data=await response.json();
 check(response.status===200&&data.success===true&&data.item.titulo===preview.item.titulo,'standalone authenticated preview route');
 console.log('PASS workerd: standalone Admin route, authentication and public preview');
}};
`;
const mock=`const html='<script type="application/ld+json">'+JSON.stringify({'@type':'JobPosting',title:'QA workerd · Música',description:'<b>Prueba ficticia</b>',validThrough:'2099-12-31',jobLocation:{address:{addressLocality:'Rosario'}}})+'</script>';
export default {async fetch(request){
 const url=new URL(request.url);
 if(request.headers.has('Authorization')||request.headers.has('Cookie'))throw Error('Credentials forwarded to source');
 if(request.redirect!=='manual')throw Error('Automatic redirect enabled');
 if(url.hostname==='cloudflare-dns.com'){
  const host=url.searchParams.get('name'),type=url.searchParams.get('type');
  if(host==='badresolver.example')return new Response('ignored',{status:302,headers:{Location:'https://127.0.0.1/private'}});
  if(host==='nonjsonresolver.example')return new Response('<title>invalid DNS response</title>');
  return Response.json({Status:0,Answer:type==='A'?[{type:1,data:host==='private.example'?'127.0.0.1':'93.184.215.14'}]:[]});
 }
 if(url.hostname==='private.example')throw Error('Private source was contacted');
 if(url.hostname==='redirected.example')return new Response(null,{status:302,headers:{Location:'https://good.example/final'}});
 if(url.hostname==='nonhtml.example')return Response.json({private:'not HTML'});
 if(url.hostname==='oversize.example')return new Response('x'.repeat(750001),{headers:{'content-type':'text/html'}});
 if(url.hostname==='stalled.example'){let timer;return new Response(new ReadableStream({start(c){timer=setTimeout(()=>c.close(),1000)},cancel(){clearTimeout(timer)}}),{headers:{'content-type':'text/html'}})}
 if(url.hostname!=='good.example')throw Error('Unexpected synthetic destination');
 return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}});
}};
`;
try{
 const source=await readFile(new URL('../worker.js',import.meta.url));
 await writeFile(join(dir,'worker.mjs'),source);
 await writeFile(join(dir,'entry.mjs'),entry);
 await writeFile(join(dir,'mock.mjs'),mock);
 await writeFile(join(dir,'config.capnp'),`using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
(name = "main", worker = (modules = [(name = "entry.mjs", esModule = embed "entry.mjs"),(name = "worker.mjs", esModule = embed "worker.mjs")],compatibilityDate = "2026-09-28",globalOutbound = "mock")),
(name = "mock", worker = (modules = [(name = "mock.mjs", esModule = embed "mock.mjs")],compatibilityDate = "2026-09-28"))
]);`);
 const result=spawnSync(binary,['test',join(dir,'config.capnp'),'main'],{encoding:'utf8',timeout:30000});
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Cloudflare engine regression failed (exit '+result.status+')');
}finally{await rm(dir,{recursive:true,force:true})}
