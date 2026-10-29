/* HTTP boundary embedded by worker.js for private synthetic QA only. Disabled
 * unless qa-only is explicit; real offer recovery remains unavailable. */
const API='https://uadav-api-staging.uadavstream.workers.dev';
const PAGES='https://uadav-stream-staging.pages.dev';
const REQUEST='/api/bolsa_trabajo/acceso/solicitar',REDEEM='/api/bolsa_trabajo/acceso/restablecer';
const accepted={success:true,message:'Si los datos coinciden, recibirás instrucciones en el correo configurado.'};
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const job=x=>typeof x==='string'&&/^JOB-QA-[A-Z0-9-]{3,70}$/.test(x);
const email=x=>typeof x==='string'&&x.length<=160&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x);
export function createJobRecoveryHttp({getEngine,hash,configuredRecipient}={}){
 if(typeof getEngine!=='function'||typeof hash!=='function')throw Error('Recovery dependencies required');
 return async function route(request,env={}){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(![REQUEST,REDEEM].includes(url.pathname))return null;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Vary':'Origin'};
  if(origin===PAGES||origin===API)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  // No engine access, schema installation or provider call before all gates.
  if(url.search)return reply({error:'Solicitud inválida.'},400);
  if(url.origin!==API||env.JOB_RECOVERY_HTTP_STAGING!=='qa-only')return reply({error:'Recuperación de claves antiguas deshabilitada.'},503);
  if(origin!==PAGES&&origin!==API)return reply({error:'Origen no autorizado.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply({error:'Método no permitido.'},405);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'Datos inválidos.'},400);
  const recipient=typeof configuredRecipient==='function'?configuredRecipient(env):'';
  if(!email(recipient)||recipient!==recipient.trim().toLowerCase())return reply({error:'Prueba de recuperación no configurada.'},503);
  let body;try{
   const reader=request.body?.getReader();if(!reader)return reply({error:'Datos inválidos.'},400);
   let size=0,text='';const decoder=new TextDecoder();try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096)return reply({error:'Contenido demasiado extenso.'},413);text+=decoder.decode(value,{stream:true})}}finally{await reader.cancel().catch(()=>{})}body=JSON.parse(text+decoder.decode());
  }catch{return reply({error:'Datos inválidos.'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Datos inválidos.'},400);
  const expected=url.pathname===REQUEST?['job_id','email','request_id']:['job_id','token','new_secret'];
  if(Object.keys(body).length!==expected.length||!expected.every(k=>Object.hasOwn(body,k))||!job(body.job_id))return reply({error:'Solicitud de prueba inválida.'},400);
  if(url.pathname===REQUEST){
   if(!email(body.email)||typeof body.request_id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id))return reply({error:'Solicitud de prueba inválida.'},400);
   // Same public answer for any address outside the operator's QA allowlist.
   if(body.email.trim().toLowerCase()!==recipient)return reply(accepted,202);
   try{const actorHash=await hash(request.headers.get('CF-Connecting-IP')||'unknown'),engine=await getEngine(env,body.job_id);await engine.enqueue({jobId:body.job_id,recipient,requestId:body.request_id,actorHash});return reply(accepted,202)}catch{return reply({error:'No pudimos confirmar la solicitud. Conservá su referencia.'},503)}
  }
  if(!hex(body.token)||!hex(body.new_secret))return reply({error:'Enlace inválido o vencido.'},400);
  try{const engine=await getEngine(env,body.job_id,body.new_secret),result=await engine.redeem({jobId:body.job_id,token:body.token,newSecretHash:await hash(body.new_secret)});if(result?.job_id!==body.job_id||!Number.isSafeInteger(result.revision)||result.revision<2)throw Error('Unconfirmed');return reply({success:true,job_id:body.job_id,revision:result.revision})}catch(error){return reply({error:error?.status===400?'Enlace inválido o vencido.':'No se confirmó el cambio. Conservá el enlace y la nueva clave para comprobarlo.'},error?.status===400?400:503)}
 };
}
