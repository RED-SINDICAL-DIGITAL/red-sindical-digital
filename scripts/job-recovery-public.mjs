/* Public real-offer recovery. Explicit staging opt-in; no QA fixture bypass. */
const API='https://uadav-api-staging.uadavstream.workers.dev',PAGES='https://uadav-stream-staging.pages.dev';
const REQUEST='/api/bolsa_trabajo/acceso/solicitar',REDEEM='/api/bolsa_trabajo/acceso/restablecer';
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),job=x=>typeof x==='string'&&/^JOB-[A-Z0-9-]{3,80}$/.test(x)&&!x.startsWith('JOB-QA-');
const accepted={success:true,message:'Si los datos coinciden, recibirás instrucciones en el correo registrado en la oferta.'};
export function createPublicJobRecovery({context,authorize}){
 return async function route(request,env,execution){
  const url=new URL(request.url),origin=request.headers.get('Origin');if(![REQUEST,REDEEM].includes(url.pathname))return null;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin'},reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(url.origin!==API||env.JOB_RECOVERY_HTTP_STAGING!=='public')return reply({error:'Recuperación pública no disponible.'},503);
  if(origin!==PAGES&&origin!==API)return reply({error:'Origen no autorizado.'},403);
  Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  if(url.search)return reply({error:'Solicitud inválida.'},400);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return reply({error:'Método no permitido.'},405);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'Datos inválidos.'},400);
  let body;try{const reader=request.body?.getReader();if(!reader)throw Error();let size=0,text='';const decoder=new TextDecoder();try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096)return reply({error:'Contenido demasiado extenso.'},413);text+=decoder.decode(value,{stream:true})}}finally{await reader.cancel().catch(()=>{})}body=JSON.parse(text+decoder.decode())}catch{return reply({error:'Datos inválidos.'},400)}
  const fields=url.pathname===REQUEST?['job_id','email','request_id','turnstile_token','consent']:['job_id','token','new_secret'];
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==fields.length||!fields.every(k=>Object.hasOwn(body,k))||!job(body.job_id))return reply({error:'Datos inválidos.'},400);
  if(url.pathname===REQUEST){
   if(body.consent!==true||typeof body.email!=='string'||body.email.length>160||!/^[^\s@<>\x00-\x1f]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(body.email.trim())||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id||'')||typeof body.turnstile_token!=='string'||body.turnstile_token.length>2048)return reply({error:'Datos inválidos.'},400);
   try{if(!await authorize(request,env,body.turnstile_token,'request'))return reply({error:'No pudimos validar la solicitud. Esperá unos minutos y reintentá.'},429);const service=await context(env);const task=Promise.resolve().then(()=>service.request({...body,email:body.email.trim().toLowerCase()})).catch(()=>{});if(execution?.waitUntil)execution.waitUntil(task);else await task;return reply(accepted,202)}catch{return reply({error:'El servicio de recuperación no está disponible. Conservá tus datos y reintentá más tarde.'},503)}
  }
  if(!hex(body.token)||!hex(body.new_secret))return reply({error:'Enlace inválido o vencido.'},400);
  try{if(!await authorize(request,env,'','redeem'))return reply({error:'Esperá unos minutos antes de reintentar.'},429);const service=await context(env),result=await service.redeem(body);if(result?.job_id!==body.job_id||!Number.isSafeInteger(result.revision)||result.revision<2)throw Error();return reply({success:true,job_id:result.job_id,revision:result.revision})}catch(error){return reply({error:error?.status===400?'Enlace inválido o vencido.':'No se confirmó el cambio. Reintentá desde esta misma pantalla.'},error?.status===400?400:503)}
 };
}
