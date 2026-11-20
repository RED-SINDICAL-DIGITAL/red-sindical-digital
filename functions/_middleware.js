const staging = 'integration-staging-preserve.uadav-stream-staging.pages.dev';
const stagingAdminApi = 'https://uadav-api-staging.uadavstream.workers.dev/api/admin_check';
const configKey = 'staging-demo-access-v1';
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const privateHeaders = {'Cache-Control':'private, no-store', 'Content-Type':'text/plain; charset=utf-8'};
const reply = (body, status) => new Response(body, {status, headers:{...privateHeaders,'X-UADAV-Response':'demo-v1'}});

async function checkAdmin(url, authorization, env) {
  try {
    const options = {headers:{Authorization:authorization,Accept:'application/json'},redirect:'manual'};
    const response = env.DEMO_ADMIN_API
      ? await env.DEMO_ADMIN_API.fetch(new Request(url,options))
      : await fetch(url,options);
    if (response.status===401 || response.status===403) return reply('Volvé a ingresar con la cuenta de administración nacional.',403);
    if (!response.ok) return reply('La API de administración respondió HTTP '+response.status+'.',502);
    const account = await response.json().catch(()=>null);
    if (!account) return reply('La API de administración devolvió un formato inesperado.',502);
    if (!account?.success || account.role !== 'admin_nacional') return reply('Volvé a ingresar con la cuenta de administración nacional.',403);
    return null;
  } catch {
    return reply(env.DEMO_ADMIN_API ? 'Falló la llamada interna al Worker de administración (DEMO_ADMIN_API).':'Falló la conexión pública con la API de administración. El despliegue no tiene DEMO_ADMIN_API.',502);
  }
}

async function digest(code, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:encoder.encode(salt), iterations:100000}, key, 256));
}

async function signature(secret, expiry) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(String(expiry))));
}

function promptPage(message = '') {
  return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Probar la demo · UADAV STREAM</title><style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;background:#091321;color:white;font:1rem system-ui}main{width:min(90%,26rem)}input,button{width:100%;padding:.85rem;border-radius:.65rem;border:0;margin:.5rem 0 1rem;font:inherit}button{background:#31c5ec;font-weight:700}a{color:#84def7}</style><main><a href="/promo.html">Volver a la portada</a><h1>Probar la demo</h1><form method="post" action="/demo/entrar"><label for="code">Código de invitación</label><input id="code" name="code" type="password" maxlength="128" required><p role="status">${message}</p><button>Entrar a la demo</button></form></main></html>`, {status:message?403:200,headers:{...privateHeaders,'Content-Type':'text/html; charset=utf-8'}});
}

export async function onRequest(context) {
  if (!new URL(context.request.url).pathname.startsWith('/demo/admin/')) return handleRequest(context);
  try {
    return await handleRequest(context);
  } catch (error) {
    const ray = context.request.headers.get('cf-ray') || '';
    console.error('demo_admin_exception',ray,error?.name);
    return reply('No se pudo completar la operación del Admin.'+(ray?' Referencia: '+ray:''),503);
  }
}

async function handleRequest({request, env, next}) {
  const url = new URL(request.url);
  const production = ['uadavstream.com.ar','www.uadavstream.com.ar'].includes(url.hostname);
  if (!production && url.hostname !== staging) return next();
  const adminApi = production ? 'https://uadav-api.uadavstream.workers.dev/api/admin_check' : stagingAdminApi;
  const path = url.pathname;
  const db = env.DEMO_DB;
  const maintenance = () => new Response('La demo está en pausa. Podés volver a la portada.', {status:503,headers:{...privateHeaders,'Retry-After':'60'}});
  const sameOrigin = request.method === 'POST' && request.headers.get('Origin') === url.origin;
  const ownerRoute = path.startsWith('/demo/admin/');
  if (ownerRoute) {
    if (!sameOrigin) return reply('Solicitud inválida.',403);
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return reply('Volvé a ingresar al Admin.',401);
    const denied = await checkAdmin(adminApi,authorization,env);
    if (denied) return denied;
    if (!env.DEMO_OWNER_KEY) return reply('Falta configurar DEMO_OWNER_KEY en Pages para este entorno.',503);
    if (request.headers.get('X-Demo-Owner') !== env.DEMO_OWNER_KEY) return reply('La clave del propietario no coincide. Volvé a ingresarla.',403);
    if (!db) return reply('Falta configurar la base de invitaciones.',503);
    if (path === '/demo/admin/lista') {
      try {
        const rows = await db.prepare('SELECT id,email FROM demo_requests WHERE sent IS NULL AND redeemed IS NULL ORDER BY created LIMIT 100').all();
        return Response.json(rows.results,{headers:{'Cache-Control':'no-store'}});
      } catch {
        return reply('No se pudieron leer las solicitudes en DEMO_DB. Revisá la tabla demo_requests del entorno.',503);
      }
    }
    if (['/demo/admin/pausar','/demo/admin/reabrir'].includes(path)) {
      await db.prepare('UPDATE demo_state SET paused=? WHERE id=1').bind(Number(path.endsWith('/pausar'))).run();
      return reply(env.DEMO_EMERGENCY_PAUSE==='1' ? 'La pausa de Cloudflare sigue activa.' : 'Estado actualizado.',200);
    }
    if (path === '/demo/admin/invitar') {
      const missing = ['DEMO_MAIL_KEY','DEMO_FROM','DEMO_INVITE_SECRET'].filter(name => !env[name]?.trim());
      if (missing.length) return reply('Para enviar invitaciones, configurá en Pages ('+(production?'Production':'Preview')+') los siguientes datos: '+missing.join(', ')+'.',503);
      const id = await request.text();
      const now = Math.floor(Date.now()/1000);
      const row = await db.prepare('UPDATE demo_requests SET expires=CASE WHEN expires IS NULL OR expires<=? THEN ? ELSE expires END WHERE id=? AND redeemed IS NULL AND sent IS NULL RETURNING email,expires').bind(now,now+604800,id).first();
      if (!row) return reply('La solicitud ya fue procesada.',409);
      const token = await signature(env.DEMO_INVITE_SECRET,id+'.'+row.expires);
      const mail = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.DEMO_MAIL_KEY,'Content-Type':'application/json','Idempotency-Key':'demo-'+id+'-'+row.expires},body:JSON.stringify({from:env.DEMO_FROM,to:[row.email],subject:'Tu invitación a UADAV STREAM',text:'Ya podés probar UADAV STREAM. Abrí este enlace personal dentro de los próximos siete días: '+url.origin+'/invitacion.html#'+id+'.'+token})});
      if (!mail.ok) return reply('El proveedor no confirmó el envío. Podés reintentar.',502);
      await db.prepare('UPDATE demo_requests SET sent=? WHERE id=?').bind(now,id).run();
      return reply('El proveedor aceptó la invitación.',200);
    }
    return reply('Acción desconocida.',404);
  }
  if (path === '/demo/solicitar') {
    if (!sameOrigin) return reply('Solicitud inválida.',403);
    if (!db) return reply('Las solicitudes todavía no están habilitadas.',503);
    const email = String((await request.formData()).get('email') || '').trim().toLowerCase();
    if (email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply('Revisá tu correo.',400);
    await db.prepare('INSERT INTO demo_requests(id,email,created) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET id=excluded.id,created=excluded.created,expires=NULL,sent=NULL,redeemed=NULL,session_hash=NULL,session_until=NULL WHERE demo_requests.expires<=excluded.created AND COALESCE(demo_requests.session_until,0)<=excluded.created').bind(crypto.randomUUID(),email,Math.floor(Date.now()/1000)).run();
    return reply('Recibimos tu solicitud. Cuando se habilite tu lugar, te avisamos por correo.',200);
  }
  if (/^\/(?:promo|admin|invitacion|privacidad|terminos|contacto|mediakit|guia|documentacion|convenios|consultar-publicidad)(?:\.html)?\/?$/.test(path)) return next();
  if (path === '/' || /^\/index(?:\.html)?\/?$/.test(path)) return Response.redirect(url.origin+'/promo.html',302);
  if (/\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|woff2?|gif|avif|webmanifest|mp4)$/i.test(path)) return next();
  if (env.DEMO_EMERGENCY_PAUSE==='1' || (db && (await db.prepare('SELECT paused FROM demo_state WHERE id=1').first())?.paused)) return maintenance();
  if (path === '/demo/canjear') {
    if (!sameOrigin) return reply('Solicitud inválida.',403);
    if (!db || !env.DEMO_INVITE_SECRET) return reply('Invitaciones pendientes de configuración.',503);
    const [id,proof] = String((await request.formData()).get('ticket') || '').split('.');
    const now = Math.floor(Date.now()/1000);
    const row = await db.prepare('SELECT expires FROM demo_requests WHERE id=? AND expires>? AND redeemed IS NULL').bind(id,now).first();
    if (!row || await signature(env.DEMO_INVITE_SECRET,id+'.'+row.expires)!==proof) return reply('El enlace venció o ya fue utilizado.',403);
    const session = crypto.randomUUID();
    const hash = await signature(env.DEMO_INVITE_SECRET,session);
    const update = await db.prepare('UPDATE demo_requests SET redeemed=?,session_hash=?,session_until=? WHERE id=? AND redeemed IS NULL AND expires>?').bind(now,hash,now+604800,id,now).run();
    if (!update.meta.changes) return reply('El enlace ya fue utilizado.',403);
    return new Response(null,{status:303,headers:{...privateHeaders,Location:'/app.html','Set-Cookie':'__Host-uadav_invite='+session+'; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800'}});
  }
  if (path === '/demo/configurar' || path === '/demo/entrar') {
    if (request.method !== 'POST' || request.headers.get('Origin') !== url.origin) return reply('Solicitud inválida.',403);
    if (!env.DEMO_KV) return reply('Falta vincular DEMO_KV al entorno de pruebas.',503);
    if (path === '/demo/configurar') {
      const authorization = request.headers.get('Authorization');
      if (!authorization?.startsWith('Bearer ')) return reply('Ingresá al Admin.',401);
      const denied = await checkAdmin(adminApi,authorization,env);
    if (denied) return denied;
      const code = await request.text();
      if (code.length < 6 || code.length > 128) return reply('Usá entre 6 y 128 caracteres.',400);
      const salt = crypto.randomUUID();
      await env.DEMO_KV.put(configKey,JSON.stringify({salt,proof:await digest(code,salt),secret:crypto.randomUUID()}));
      return reply('Código de demo actualizado.',200);
    }
    const config = await env.DEMO_KV.get(configKey,'json');
    if (!config) return reply('La demo todavía no tiene código configurado.',503);
    const code = (await request.formData()).get('code');
    if (typeof code !== 'string' || code.length > 128 || await digest(code,config.salt) !== config.proof) return promptPage('Revisá el código e intentá de nuevo.');
    const expiry = Math.floor(Date.now()/1000)+86400;
    return new Response(null,{status:303,headers:{...privateHeaders,Location:'/app.html','Set-Cookie':`__Host-uadav_demo=${expiry}.${await signature(config.secret,expiry)}; Max-Age=86400; Secure; HttpOnly; Path=/; SameSite=Lax`}});
  }
  const cookies=request.headers.get('Cookie') || '';
  const invite=/(?:^|;\s*)__Host-uadav_invite=([a-f0-9-]{36})(?:;|$)/.exec(cookies);
  let allowed=false;
  if (invite && db && env.DEMO_INVITE_SECRET) {
    const hash=await signature(env.DEMO_INVITE_SECRET,invite[1]);
    allowed=!!await db.prepare('SELECT id FROM demo_requests WHERE session_hash=? AND session_until>?').bind(hash,Math.floor(Date.now()/1000)).first();
  }
  if (!allowed) {
    const config=await env.DEMO_KV?.get(configKey,'json');
    const match=/(?:^|;\s*)__Host-uadav_demo=(\d{10})\.([0-9a-f]{64})(?:;|$)/.exec(cookies);
    allowed=!!(config && match && Number(match[1])>Date.now()/1000 && match[2]===await signature(config.secret,match[1]));
  }
  if (!production && !db && !env.DEMO_KV) allowed=true;
  if (path==='/demo/estado') return reply(allowed?'Disponible':'Necesitás una invitación.',allowed?200:403);
  if (!allowed) return promptPage();
  const asset = await next();
  const response = new Response(asset.body, asset);
  response.headers.set('Cache-Control','private, no-store');
  if (/^\/app(?:\.html)?\/?$/.test(path) && response.headers.get('content-type')?.includes('text/html')) {
    return new HTMLRewriter().on('body',{element(el){el.append('<script src="/demo-estado.js" defer></script>',{html:true})}}).transform(response);
  }
  return response;
}
