/* Private STAGING diagnostic. A real email can be sent only to the operator's
 * BREVO_QA_RECIPIENT secret after an explicit Admin POST. No account/access token.
 * The six-digit receipt challenge is for this diagnostic only, not login. */
async function uadavBrevoDeliveryRoute(request, env) {
  const url = new URL(request.url), site = 'https://uadav-api-staging.uadavstream.workers.dev';
  const origin = request.headers.get('Origin');
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Pragma:'no-cache',
    'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin',
    ...(origin===site?{'Access-Control-Allow-Origin':site}:{})};
  const base = {build:BUILD,scope:'brevo-delivery-staging',sandbox:false,recovery_enabled:false};
  const reply = (data,status=200,extra={}) => new Response(JSON.stringify({...base,...data}),{status,headers:{...headers,...extra}});
  const fail = (code,error,status=503) => reply({result:'error',delivery_verified:false,code,error},status);
  if (url.pathname==='/qa/correo-real') {
    if(url.origin!==site)return fail('BREVO_STAGING_ONLY','Esta prueba solo está disponible en staging.',403);
    if(request.method!=='GET')return fail('BREVO_METHOD','Abrí la página de prueba.',405);
    const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
    return new Response(UADAV_BREVO_DELIVERY_HTML.replaceAll('%%NONCE%%',nonce),{headers:{...headers,
      'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex, nofollow',
      'Content-Security-Policy':"default-src 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"}});
  }
  const admin=String(env.ADMIN_KEY||'').trim();
  if(!admin||request.headers.get('Authorization')!=='Bearer '+admin)return fail('BREVO_AUTH','Ingresá con la clave Admin de staging.',401);
  if(url.origin!==site)return fail('BREVO_STAGING_ONLY','Esta prueba solo está disponible en staging.',403);
  if(origin&&origin!==site)return fail('BREVO_ORIGIN','Abrí la prueba en el Worker de staging.',403);
  if(!['GET','POST'].includes(request.method))return reply({result:'error',code:'BREVO_METHOD',delivery_verified:false},405,{Allow:'GET,POST'});
  if(env.JOB_STORE_MAINTENANCE==='true')return fail('BREVO_MAINTENANCE','Staging está en mantenimiento.',423);
  const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
  let input,action;
  if(request.method==='POST'){
    if(url.search||!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return fail('BREVO_INPUT','Solicitud inválida.',400);
    try{input=await uadavSecurityJSON(request,256)}catch{return fail('BREVO_INPUT','Solicitud inválida o demasiado grande.',400)}
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==2||typeof input.request_id!=='string'||!uuid.test(input.request_id))return fail('BREVO_INPUT','Usá los controles de esta pantalla.',400);
    if(input.confirm==='BREVO_ONE_REAL_EMAIL_TO_CONFIGURED_RECIPIENT')action='send';
    else if(typeof input.verification_code==='string'&&/^\d{6}$/.test(input.verification_code))action='verify';
    else return fail('BREVO_INPUT','Confirmá el envío o ingresá los seis números del correo.',400);
  }else if([...url.searchParams.keys()].some(k=>k!=='request_id')||url.searchParams.getAll('request_id').length>1||url.searchParams.has('request_id')&&!uuid.test(url.searchParams.get('request_id')))return fail('BREVO_INPUT','Referencia inválida.',400);
  const apiKey=env.BREVO_API_KEY,recipient=typeof env.BREVO_QA_RECIPIENT==='string'?env.BREVO_QA_RECIPIENT.trim().toLowerCase():'';
  const keyPresent=typeof apiKey==='string'&&/^[A-Za-z0-9._-]{32,512}$/.test(apiKey);
  const recipientValid=recipient.length<=160&&/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(recipient)&&recipient.split('@')[1].split('.').every(label=>label.length<=63&&/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
  if(!keyPresent||!recipientValid)return request.method==='GET'?reply({result:'status',ready:false,api_key_present:keyPresent,recipient_configured:recipientValid,remaining_today:0,delivery_verified:false}):fail('BREVO_DELIVERY_CONFIGURATION','Guardá BREVO_QA_RECIPIENT con tu propio correo en los secretos de este Worker.');
  if(env.JOB_STORE_D1!=='true'||!env.DB)return fail('BREVO_STORAGE','La prueba requiere la base D1 staging ya preparada.');
  const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
  const codes=new Set(['MAIL_RESPONSE','MAIL_REDIRECT','MAIL_RATE_LIMIT','MAIL_QUOTA','MAIL_CONFIGURATION','MAIL_UNAVAILABLE','MAIL_DELIVERY_UNCONFIRMED','MAIL_REJECTED','MAIL_RECEIPT','MAIL_TIMEOUT','MAIL_CANCELLED']);
  const now=Date.now(),day=uadavJobToday(now),prefix='brevo:delivery:request:',rateKey='brevo:delivery:daily';
  const recipientHash=await digest(recipient);
  let db;
  const read=async key=>{const row=await db.prepare('SELECT value FROM job_store_meta WHERE key=?').bind(key).first();return row?JSON.parse(row.value):null};
  function record(r){
    if(!r||r.version!==1||!uuid.test(r.request_id||'')||!uuid.test(r.owner||'')||!['pending','accepted','unconfirmed'].includes(r.state)||
      !Number.isSafeInteger(r.created_at)||r.created_at<=0||r.expires_at!==r.created_at+900000||!/^[a-f0-9]{64}$/.test(r.recipient_hash||'')||
      !/^[a-f0-9]{32}$/.test(r.salt||'')||!Number.isInteger(r.verification_attempts)||r.verification_attempts<0||r.verification_attempts>5||
      (r.verified_at!==null?(!Number.isSafeInteger(r.verified_at)||r.verified_at<r.created_at||r.verified_at>=r.expires_at||r.verification_hash!==null||!uuid.test(r.verification_owner||'')) : !/^[a-f0-9]{64}$/.test(r.verification_hash||''))||
      (r.state!=='pending'&&(!Number.isSafeInteger(r.completed_at)||r.completed_at<r.created_at))||
      (r.state==='accepted'&&!/^brevo:[a-f0-9]{64}$/.test(r.receipt||''))||(r.code!==undefined&&r.code!==null&&!codes.has(r.code)))throw Error('invalid_delivery_record');
    return r;
  }
  function count(r){if(!r)return 0;if(r.version!==1||!/^\d{4}-\d{2}-\d{2}$/.test(r.day||'')||r.day>day||!Number.isInteger(r.count)||r.count<1||r.count>2||!uuid.test(r.owner||'')||!uuid.test(r.request_id||''))throw Error('invalid_delivery_rate');return r.day===day?r.count:0}
  function result(raw,remaining){const r=record(raw);return {...base,result:r.verified_at!==null?'received':r.expires_at<=now?'expired':r.verification_attempts>=5?'locked':r.state,
    request_id:r.request_id,provider_accepted:r.state==='accepted',delivery_verified:r.verified_at!==null,remaining_today:remaining,
    expires_at:new Date(r.expires_at).toISOString(),checked_at:r.verified_at!==null?new Date(r.verified_at).toISOString():r.completed_at?new Date(r.completed_at).toISOString():null,
    ...(r.code?{code:r.code}:{})};}
  try{
    db=uadavJobDB(env);
    if((await db.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first())?.value!=='true')return fail('BREVO_STORAGE','La base staging todavía no está preparada.');
    let remaining=2-count(await read(rateKey));
    const requestId=request.method==='POST'?input.request_id:url.searchParams.get('request_id');
    if(requestId){
      const prior=await read(prefix+requestId);
      if(prior){
        const r=record(prior);
        if(r.recipient_hash!==recipientHash)return fail('BREVO_RECIPIENT_CHANGED','Cambió el correo configurado. Esta comprobación corresponde al anterior.',409);
        if(action!=='verify')return reply(result(r,remaining),r.state==='pending'&&r.verified_at===null?202:200);
        if(r.verified_at!==null)return fail('BREVO_RECEIPT_USED','La recepción ya fue confirmada. Consultá su resultado.',409);
        if(r.expires_at<=now)return fail('BREVO_RECEIPT_EXPIRED','La comprobación venció. El código no habilita ningún acceso.',410);
        if(r.verification_attempts>=5)return fail('BREVO_RECEIPT_LOCKED','Se agotaron los cinco intentos de comprobación.',429);
        const proof=await digest(r.salt+':'+input.verification_code),verificationOwner=crypto.randomUUID();
        // One atomic update consumes a correct receipt once; wrong attempts are
        // counted in the same statement even under concurrent requests.
        const update=db.prepare("UPDATE job_store_meta SET value=json_set(value,'$.verification_attempts',json_extract(value,'$.verification_attempts')+1,'$.verified_at',CASE WHEN json_extract(value,'$.verification_hash')=? THEN ? ELSE NULL END,'$.verification_owner',CASE WHEN json_extract(value,'$.verification_hash')=? THEN ? ELSE NULL END,'$.verification_hash',CASE WHEN json_extract(value,'$.verification_hash')=? THEN NULL ELSE json_extract(value,'$.verification_hash') END) WHERE key=? AND json_extract(value,'$.owner')=? AND json_extract(value,'$.recipient_hash')=? AND json_extract(value,'$.expires_at')>? AND json_extract(value,'$.verified_at') IS NULL AND json_extract(value,'$.verification_attempts')<5 RETURNING value").bind(proof,now,proof,verificationOwner,proof,prefix+requestId,r.owner,recipientHash,now);
        let changed;
        try{changed=await update.first()}catch{
          const saved=await read(prefix+requestId);
          if(saved&&record(saved).verified_at!==null&&saved.verification_owner===verificationOwner)return reply(result(saved,remaining));
          return fail('BREVO_STORAGE','No se confirmó el registro. Consultá el resultado antes de repetir.');
        }
        if(!changed)return fail('BREVO_RECEIPT_CONFLICT','La comprobación cambió. Consultá su resultado.',409);
        const saved=record(JSON.parse(changed.value));
        if(saved.verified_at!==null)return reply(result(saved,remaining));
        if(saved.verification_attempts>=5)return fail('BREVO_RECEIPT_LOCKED','Se agotaron los cinco intentos de comprobación.',429);
        return fail('BREVO_RECEIPT_INVALID','Los seis números no coinciden. Revisá el último correo de esta prueba.',400);
      }
      if(request.method==='GET'||action==='verify')return fail('BREVO_NOT_FOUND','No se encontró esa comprobación.',404);
    }
    const active=await db.prepare("SELECT value FROM job_store_meta WHERE substr(key,1,?)=? AND CASE WHEN json_valid(value) THEN json_extract(value,'$.recipient_hash')=? AND json_extract(value,'$.expires_at')>? AND json_extract(value,'$.verified_at') IS NULL AND json_extract(value,'$.verification_attempts')<5 ELSE 1 END ORDER BY key LIMIT 1").bind(prefix.length,prefix,recipientHash,now).first();
    const activeRecord=active?record(JSON.parse(active.value)):null;
    const sandbox=await db.prepare("SELECT key FROM job_store_meta WHERE substr(key,1,?)=? AND CASE WHEN json_valid(value) THEN json_extract(value,'$.version')=1 AND json_extract(value,'$.state')='accepted' AND json_extract(value,'$.completed_at') BETWEEN ? AND ? AND json_extract(value,'$.receipt') GLOB 'brevo:*' ELSE 0 END LIMIT 1").bind('brevo:sandbox:request:'.length,'brevo:sandbox:request:',now-7*86400000,now).first();
    if(request.method==='GET')return reply({result:'status',ready:!!sandbox&&!activeRecord&&remaining>0,api_key_present:true,recipient_configured:true,sandbox_verified:!!sandbox,remaining_today:remaining,delivery_verified:false,...(activeRecord?{active:result(activeRecord,remaining)}:{})});
    if(activeRecord)return reply(result(activeRecord,remaining),202);
    if(!sandbox)return fail('BREVO_SANDBOX_REQUIRED','Primero debe aprobar la conexión sandbox de staging.',409);
    if(remaining===0)return fail('BREVO_LIMIT','Ya se reservaron las dos pruebas de correo de hoy.',429);
    const owner=crypto.randomUUID(),key=prefix+requestId,salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
    let random;do{random=crypto.getRandomValues(new Uint32Array(1))[0]}while(random>=4294000000);
    const code=String(random%1000000).padStart(6,'0');
    const pending={version:1,request_id:requestId,owner,state:'pending',created_at:now,expires_at:now+900000,recipient_hash:recipientHash,salt,verification_hash:await digest(salt+':'+code),verification_attempts:0,verified_at:null};
    const rate={version:1,day,count:1,request_id:requestId,owner};
    const writes=[
      db.prepare("INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=json_set(excluded.value,'$.count',CASE WHEN json_extract(job_store_meta.value,'$.day')<? THEN 1 ELSE json_extract(job_store_meta.value,'$.count')+1 END) WHERE json_extract(job_store_meta.value,'$.version')=1 AND json_type(job_store_meta.value,'$.count')='integer' AND json_extract(job_store_meta.value,'$.count') BETWEEN 1 AND 2 AND (json_extract(job_store_meta.value,'$.day')<? OR (json_extract(job_store_meta.value,'$.day')=? AND json_extract(job_store_meta.value,'$.count')<2))").bind(rateKey,JSON.stringify(rate),day,day,day),
      ...uadavJobGuard(db,"EXISTS(SELECT 1 FROM job_store_meta WHERE key=? AND json_extract(value,'$.owner')=? AND json_extract(value,'$.request_id')=?)",[rateKey,owner,requestId]),
      ...uadavJobGuard(db,"NOT EXISTS(SELECT 1 FROM job_store_meta WHERE substr(key,1,?)=? AND json_extract(value,'$.recipient_hash')=? AND json_extract(value,'$.expires_at')>? AND json_extract(value,'$.verified_at') IS NULL AND json_extract(value,'$.verification_attempts')<5)",[prefix.length,prefix,recipientHash,now]),
      db.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?)').bind(key,JSON.stringify(pending)),
      db.prepare("DELETE FROM job_store_meta WHERE substr(key,1,?)=? AND CASE WHEN json_valid(value) THEN json_extract(value,'$.created_at')<? ELSE 0 END").bind(prefix.length,prefix,now-7*86400000)
    ];
    try{await db.batch(writes)}catch{
      const saved=await read(key);remaining=2-count(await read(rateKey));
      if(saved)return reply(result(saved,remaining),202);
      const other=await db.prepare("SELECT value FROM job_store_meta WHERE substr(key,1,?)=? AND json_extract(value,'$.recipient_hash')=? AND json_extract(value,'$.expires_at')>? AND json_extract(value,'$.verified_at') IS NULL AND json_extract(value,'$.verification_attempts')<5 LIMIT 1").bind(prefix.length,prefix,recipientHash,now).first();
      if(other)return reply(result(JSON.parse(other.value),remaining),202);
      return fail(remaining===0?'BREVO_LIMIT':'BREVO_STORAGE','No se confirmó una reserva nueva. No se inició otro envío.',remaining===0?429:503);
    }
    let receipt,providerCode;
    try{receipt=await uadavBrevoRequest({mode:'staging-only',apiKey,body:JSON.stringify({
      sender:{name:'UADAV STREAM · pruebas',email:'acceso@correo-staging.uadavstream.com.ar'},to:[{email:recipient}],
      headers:{idempotencyKey:requestId},subject:'UADAV STREAM · confirmá la recepción de prueba',
      textContent:'UADAV STREAM · prueba privada de staging\n\nTu comprobación de recepción: '+code+'\n\nVolvé a la pantalla de prueba e ingresá estos seis números antes de 15 minutos. No los envíes al chat.\n\nEsto solo confirma que recibiste un correo de prueba. No permite entrar a una cuenta, recuperar una oferta ni cambiar credenciales. No necesitás responder a este remitente.'
    })})}catch(error){providerCode=codes.has(error?.code)?error.code:'MAIL_UNAVAILABLE'}
    // Preserve any receipt confirmation that raced the provider response.
    const completed=Date.now();
    const finish=db.prepare("UPDATE job_store_meta SET value=json_set(value,'$.state',?,'$.completed_at',?,'$.receipt',?,'$.code',?) WHERE key=? AND json_extract(value,'$.owner')=? AND json_extract(value,'$.state')='pending'").bind(receipt?'accepted':'unconfirmed',completed,receipt?.id||null,providerCode||null,key,owner);
    // A null code means no provider error; raw provider data is never stored.
    try{const updated=await finish.run();if(updated.meta?.changes!==1)throw Error('delivery_commit')}catch{
      const saved=await read(key);if(saved&&saved.owner===owner&&saved.state===(receipt?'accepted':'unconfirmed')&&(receipt?saved.receipt===receipt.id:saved.code===providerCode))return reply(result(saved,2-count(await read(rateKey))));
      return fail('BREVO_STORAGE','El correo pudo salir, pero falta confirmar el registro. Consultá el resultado; no se reenvía automáticamente.');
    }
    const saved=await read(key);return reply(result(saved,2-count(await read(rateKey))));
  }catch{return fail('BREVO_STORAGE','No se pudo comprobar el estado. La recuperación sigue deshabilitada.');}
}
