const staging = 'integration-staging-preserve.uadav-stream-staging.pages.dev';
const adminApi = 'https://uadav-api-staging.uadavstream.workers.dev/api/admin_check';
const configKey = 'staging-demo-access-v1';
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const privateHeaders = {'Cache-Control':'private, no-store', 'Content-Type':'text/plain; charset=utf-8'};
const reply = (body, status) => new Response(body, {status, headers:privateHeaders});

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

export async function onRequest({request, env, next}) {
  const url = new URL(request.url);
  if (url.hostname !== staging) return next();
  const path = url.pathname;
  if (path === '/demo/configurar' || path === '/demo/entrar') {
    if (request.method !== 'POST' || request.headers.get('Origin') !== url.origin) return reply('Solicitud inválida.',403);
    if (!env.DEMO_KV) return reply('Falta vincular DEMO_KV al entorno de pruebas.',503);
    if (path === '/demo/configurar') {
      const authorization = request.headers.get('Authorization');
      if (!authorization?.startsWith('Bearer ')) return reply('Ingresá al Admin.',401);
      const check = await fetch(adminApi,{headers:{Authorization:authorization},redirect:'error'});
      const account = check.ok && await check.json();
      if (!account?.success || account.role !== 'admin_nacional') return reply('Acceso denegado.',403);
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
  if (path === '/' || /^\/index(?:\.html)?\/?$/.test(path)) return Response.redirect(url.origin+'/promo.html',302);
  if (/^\/(?:promo|admin|privacidad|terminos|contacto|mediakit|guia|documentacion|convenios|consultar-publicidad)(?:\.html)?\/?$/.test(path) || /\.[a-z0-9]+$/i.test(path) && !/\.html?$/i.test(path)) return next();
  const config = await env.DEMO_KV?.get(configKey,'json');
  if (!env.DEMO_KV) return next();
  if (!config) return promptPage();
  const match = /(?:^|;\s*)__Host-uadav_demo=(\d{10})\.([0-9a-f]{64})(?:;|$)/.exec(request.headers.get('Cookie') || '');
  if (!match || Number(match[1]) <= Date.now()/1000 || match[2] !== await signature(config.secret,match[1])) return promptPage();
  const asset = await next();
  const response = new Response(asset.body, asset);
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
