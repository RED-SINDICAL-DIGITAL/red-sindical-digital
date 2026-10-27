/* Read-only audit of the current source using disposable in-memory SQLite/KV.
 * Does not call remote APIs, deploy or send real messages. Findings are reported,
 * not asserted as desired behavior; this is not an acceptance suite. */
import assert from 'node:assert/strict';
import {webcrypto,randomUUID} from 'node:crypto';
import {loadWorker} from '../tests/load-worker.mjs';
import {sqliteD1} from '../tests/sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await loadWorker();
const noNetwork=globalThis.fetch;globalThis.fetch=async()=>{throw Error('No real network permitted in isolated audit')};
const results={scope:'isolated-synthetic-cartelera-audit',remote_writes:false,real_email_sent:false,checks:[]};
function fixture(){const DB=sqliteD1(),kv=new Map(),env={DB,ADMIN_KEY:'synthetic-admin-events',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};const call=async(route,method='GET',body,admin=false)=>{let r;try{r=await worker.fetch(new Request('https://isolated.invalid/api/'+route,{method,headers:{'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.120',...(admin?{Authorization:'Bearer '+env.ADMIN_KEY}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{})}catch(error){return{status:'uncaught_exception',data:{error:error.message}}}return{status:r.status,data:await r.json()}};return{DB,kv,env,call}}
const event=()=>({request_id:randomUUID(),titulo:'Auditoria aislada Cartelera',descripcion:'Evento ficticio. No publicado en ningun servicio remoto.',categoria:'Teatro',fecha:'2026-12-01',fecha_inicio:'2026-12-01',funciones:[{fecha:'2026-12-01',hora:'20:00'}],lugar:'Sala QA ficticia',ciudad:'Ciudad QA',es_gratuito:true,contacto_email:'events@example.invalid',destacado_solicitado:false});
try{
 let f=fixture();try{
  await f.call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},true);
  const body=event(),first=await f.call('eventos','POST',body),second=await f.call('eventos','POST',body),catalog=await f.call('cartelera');
  assert.equal(first.status,200);assert.equal(second.status,200);
  results.checks.push({name:'identical_request_replay',response_statuses:[first.status,second.status],same_request_id:true,returned_same_id:first.data.id===second.data.id,visible_copies:catalog.data.filter(x=>x.titulo===body.titulo).length,publication_rows:JSON.parse(f.kv.get('eventos_publicados')||'[]').length});
 }finally{f.DB.close()}
 f=fixture();try{
  await f.call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},true);
  const put=f.env.UADAV_DB.put;let failed=false;f.env.UADAV_DB.put=async(k,v)=>{if(k==='cartelera_aprobada'&&!failed){failed=true;throw Error('Synthetic KV write interruption')}return put(k,v)};
  const body=event(),first=await f.call('eventos','POST',body),afterFailure={publications:JSON.parse(f.kv.get('eventos_publicados')||'[]').length,catalog:JSON.parse(f.kv.get('cartelera_aprobada')||'[]').length},retry=await f.call('eventos','POST',body);
  results.checks.push({name:'second_collection_write_failure',first_status:first.status,after_failure:afterFailure,retry_status:retry.status,after_retry:{publications:JSON.parse(f.kv.get('eventos_publicados')||'[]').length,catalog:JSON.parse(f.kv.get('cartelera_aprobada')||'[]').length}});
 }finally{f.DB.close()}
 f=fixture();try{
  await f.call('admin/moderation/settings','PUT',{enabled:false,provider:'gemini',daily_limit:300},true);
  const body={...event(),fecha:'2026-02-30',fecha_inicio:'2026-02-30',funciones:[{fecha:'2026-02-30',hora:'20:00'}]},r=await f.call('eventos','POST',body);
  results.checks.push({name:'invalid_calendar_day',status:r.status,success:r.data.success===true});
 }finally{f.DB.close()}
 console.log(JSON.stringify(results,null,2));
}finally{globalThis.fetch=noNetwork}
