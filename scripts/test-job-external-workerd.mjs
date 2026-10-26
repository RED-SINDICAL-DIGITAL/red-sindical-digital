// Runs the real standalone Worker in Cloudflare's engine, with all outbound
// traffic routed to a synthetic in-process service. No bindings or live data.
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const binary=process.env.UADAV_WORKERD_BIN||'workerd';
const dir=await mkdtemp(join(tmpdir(),'uadav-external-workerd-'));
const entry=`import worker,{uadavExternalFetchHTML,uadavExternalPreview} from './worker.mjs';
import qaWorker from './restore-qa.mjs';
import labWorker from './bolsa-lab.mjs';
import {createJobRecoveryOutbox} from './recovery-outbox.mjs';
import {buildAccessMailMessage} from './access-mail-message.mjs';
import {createBrevoStagingMail} from './brevo-staging-mail.mjs';
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
 const qaEnv={QA_RESTORE_ONLY:'true',QA_RESTORE_KEY:'synthetic-qa-key-'+'x'.repeat(48),DB:{prepare(){throw Error('QA database must not be touched')}}},qaOrigin='https://uadav-restore-qa.uadavstream.workers.dev';
 const wrongHost=await qaWorker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/health'),qaEnv,{});check(wrongHost.status===403,'QA adapter must reject the live staging hostname');
 console.log('PASS workerd: isolated QA rejects existing platform hosts');
 const denied=await qaWorker.fetch(new Request(qaOrigin+'/status',{method:'POST',headers:{Authorization:'Bearer incorrect'}}),qaEnv,{});check(denied.status===401,'QA authentication before DB access');
 console.log('PASS workerd: QA authentication cannot touch a DB before authorization');
 const qaPage=await qaWorker.fetch(new Request(qaOrigin+'/'),qaEnv,{}),qaHealth=await qaWorker.fetch(new Request(qaOrigin+'/health'),qaEnv,{});
 check(qaPage.status===200&&(await qaPage.text()).includes('SOLO BASE NUEVA DE QA'),'QA interface');check((await qaHealth.json()).purpose==='disposable-d1-rehearsal','QA purpose');
 console.log('PASS workerd: isolated QA interface and health');
 const labEnv={QA_BOLSA_ONLY:'true',QA_BOLSA_KEY:'synthetic-lab-key-'+'x'.repeat(48),DB:{prepare(){throw Error('Lab database must not be touched')},withSession(){throw Error('Lab session must not be opened')}}},labOrigin='https://uadav-bolsa-lab.uadavstream.workers.dev';
 for(const origin of ['https://uadav-api-staging.uadavstream.workers.dev','https://uadav-restore-qa.uadavstream.workers.dev'])check((await labWorker.fetch(new Request(origin+'/health'),labEnv,{})).status===403,'Lab must reject existing Worker hosts');
 console.log('PASS workerd: synthetic Bolsa lab rejects existing staging and restoration hosts');
 check((await labWorker.fetch(new Request(labOrigin+'/status',{method:'POST',headers:{Authorization:'Bearer incorrect'}}),labEnv,{})).status===401,'Lab authentication before database');
 check((await labWorker.fetch(new Request(labOrigin+'/status',{method:'POST',headers:{Authorization:'Bearer '+labEnv.QA_BOLSA_KEY}}),{...labEnv,QA_BOLSA_ONLY:'false'},{})).status===503,'Lab must require its own flag');
 console.log('PASS workerd: synthetic Bolsa lab requires explicit mode and authentication before DB');
 const labPage=await labWorker.fetch(new Request(labOrigin+'/'),labEnv,{}),labHealth=await labWorker.fetch(new Request(labOrigin+'/health'),labEnv,{});
 check(labPage.status===200&&(await labPage.text()).includes('SOLO DATOS FICTICIOS'),'Lab private interface');const labData=await labHealth.json();check(labData.version==='11764-bolsa-lab-1'&&labData.purpose==='isolated-synthetic-bolsa','Lab frozen identity');
 check((await labWorker.fetch(new Request(labOrigin+'/api/bolsa_trabajo',{method:'POST'}),labEnv,{})).status===404,'Lab must not expose platform routes');
 console.log('PASS workerd: synthetic Bolsa lab interface, frozen identity and restricted entrypoints');
 let outboxClosed=false;try{createJobRecoveryOutbox({db:{prepare(){throw Error('DB must not be touched')}},encryptionKey:'a'.repeat(64),mode:'production'})}catch(error){outboxClosed=error.code==='JOB_RECOVERY_CONFIGURATION'}check(outboxClosed,'Outbox preparatory mode gate');
 const outbox=createJobRecoveryOutbox({db:{prepare(){throw Error('DB must not be touched')}},encryptionKey:'a'.repeat(64),mode:'staging-only'});let providerClosed=false;try{await outbox.dispatch({send:async()=>({id:'fake'}),idempotencyWindowMs:1000})}catch(error){providerClosed=error.code==='JOB_RECOVERY_PROVIDER'}check(providerClosed,'Outbox provider retry contract before DB');
 console.log('PASS workerd: preparatory recovery module parses and gates mode/provider before DB');
 const mailNow=Date.now(),mailData={purpose:'account_sign_in',token:'a'.repeat(64),issuedAt:mailNow,expiresAt:mailNow+15*60000};
 check(buildAccessMailMessage(mailData).htmlContent.includes('Entrar a Mi Perfil'),'Simple account email action');
 const mail=createBrevoStagingMail({mode:'staging-only',apiKey:'synthetic-brevo-key-'+'x'.repeat(40),senderEmail:'acceso@correo-staging.uadavstream.com.ar',allowedRecipients:['lab@example.invalid'],clock:()=>mailNow});
 const mailReceipt=await mail.sendAccess({...mailData,requestId:'11111111-1111-4111-8111-111111111111',to:'lab@example.invalid'});
 check(/^brevo:[a-f0-9]{64}$/.test(mailReceipt.id),'Brevo normalized provider receipt');
 console.log('PASS workerd: preparatory access email rendering and Brevo transport with synthetic network only');
 const tick={cron:'*/15 * * * *',scheduledTime:1792969200000},closedEnv=new Proxy({},{get(_target,name){if(name==='JOB_STAGING_CRON')return undefined;throw Error('Unrelated module reached: '+String(name))}});
 check((await worker.scheduled(tick,closedEnv,{})).reason==='disabled','staging cron must default to no side effects');
 check((await worker.scheduled({...tick,cron:'* * * * *'},{JOB_STAGING_CRON:'bolsa-only'},{})).reason==='schedule','unrelated schedule must not run Bolsa');
 console.log('PASS workerd: staging cron is disabled by default and isolated from other modules');
 const statusEnv={ADMIN_KEY:'synthetic-admin',JOB_STORE_D1:'false',DB:{prepare(){throw Error('Status must authenticate before DB access')}}};
 check((await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/admin/jobs/cron'),statusEnv,{})).status===401,'cron status authentication');
 check((await worker.fetch(new Request('https://uadav-api-staging.uadavstream.workers.dev/api/admin/jobs/cron',{method:'POST',headers:{Authorization:'Bearer synthetic-admin'}}),statusEnv,{})).status===405,'no HTTP cron execution endpoint');
 console.log('PASS workerd: private cron status is read-only');
 let cronFailed=false;try{await worker.scheduled(tick,{JOB_STAGING_CRON:'bolsa-only',JOB_STORE_D1:'true',DB:{prepare(){throw Error('synthetic-private-SQL-detail')}}},{})}catch(error){cronFailed=error.jobCode==='JOB_CRON_FAILED'&&!error.message.includes('synthetic-private-SQL-detail')}
 check(cronFailed,'scheduled handler must propagate sanitized failures');
 console.log('PASS workerd: scheduled failures reach the runtime without private SQL details');
}};
`;
const mock=`const html='<script type="application/ld+json">'+JSON.stringify({'@type':'JobPosting',title:'QA workerd · Música',description:'<b>Prueba ficticia</b>',validThrough:'2099-12-31',jobLocation:{address:{addressLocality:'Rosario'}}})+'</script>';
export default {async fetch(request){
 const url=new URL(request.url);
 if(request.headers.has('Authorization')||request.headers.has('Cookie'))throw Error('Credentials forwarded to source');
 if(request.redirect!=='manual')throw Error('Automatic redirect enabled');
 if(url.hostname==='api.brevo.com'){
  if(url.href!=='https://api.brevo.com/v3/smtp/email'||request.method!=='POST'||!request.headers.get('api-key')?.startsWith('synthetic-brevo-key-'))throw Error('Unexpected mail request');
  const mail=await request.json();if(mail.to?.length!==1||mail.to[0].email!=='lab@example.invalid'||mail.headers?.idempotencyKey!=='11111111-1111-4111-8111-111111111111')throw Error('Unexpected mail envelope');
  return Response.json({messageId:'<synthetic-123@relay.example.invalid>'},{status:201});
 }
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
 await writeFile(join(dir,'restore-qa.mjs'),await readFile(new URL('../releases/uadav-bolsa-restore-qa-11762.js',import.meta.url)));
 await writeFile(join(dir,'bolsa-lab.mjs'),await readFile(new URL('../releases/uadav-bolsa-lab-11764.js',import.meta.url)));
 await writeFile(join(dir,'recovery-outbox.mjs'),await readFile(new URL('../scripts/job-recovery-outbox.mjs',import.meta.url)));
 await writeFile(join(dir,'access-mail-message.mjs'),await readFile(new URL('../scripts/access-mail-message.mjs',import.meta.url)));
 await writeFile(join(dir,'brevo-staging-mail.mjs'),await readFile(new URL('../scripts/brevo-staging-mail.mjs',import.meta.url)));
 await writeFile(join(dir,'entry.mjs'),entry);
 await writeFile(join(dir,'mock.mjs'),mock);
 await writeFile(join(dir,'config.capnp'),`using Workerd = import "/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
(name = "main", worker = (modules = [(name = "entry.mjs", esModule = embed "entry.mjs"),(name = "worker.mjs", esModule = embed "worker.mjs"),(name = "restore-qa.mjs", esModule = embed "restore-qa.mjs"),(name = "bolsa-lab.mjs", esModule = embed "bolsa-lab.mjs"),(name = "recovery-outbox.mjs", esModule = embed "recovery-outbox.mjs"),(name = "access-mail-message.mjs", esModule = embed "access-mail-message.mjs"),(name = "brevo-staging-mail.mjs", esModule = embed "brevo-staging-mail.mjs")],compatibilityDate = "2026-09-28",globalOutbound = "mock")),
(name = "mock", worker = (modules = [(name = "mock.mjs", esModule = embed "mock.mjs")],compatibilityDate = "2026-09-28"))
]);`);
 const result=spawnSync(binary,['test',join(dir,'config.capnp'),'main'],{encoding:'utf8',timeout:30000});
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Cloudflare engine regression failed (exit '+result.status+')');
}finally{await rm(dir,{recursive:true,force:true})}
