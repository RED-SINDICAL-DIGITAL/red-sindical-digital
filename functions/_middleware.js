const staging = 'integration-staging-preserve.uadav-stream-staging.pages.dev';
const stagingAdminApi = 'https://uadav-api-staging.uadavstream.workers.dev/api/admin_check';
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
  const maintenance = () => new Response('La plataforma está en pausa. Podés volver a la portada.', {status:503,headers:{...privateHeaders,'Retry-After':'60'}});
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
    if (!db) return reply('Falta configurar la base de control de acceso.',503);
    if (path === '/demo/admin/estado') {
      const state=await db.prepare('SELECT paused FROM demo_state WHERE id=1').first();
      return reply(env.DEMO_EMERGENCY_PAUSE==='1' || state?.paused ? 'Acceso pausado.' : 'Acceso abierto.',200);
    }
    if (['/demo/admin/pausar','/demo/admin/reabrir'].includes(path)) {
      await db.prepare('UPDATE demo_state SET paused=? WHERE id=1').bind(Number(path.endsWith('/pausar'))).run();
      return reply(env.DEMO_EMERGENCY_PAUSE==='1' ? 'La pausa de Cloudflare sigue activa.' : 'Estado actualizado.',200);
    }
    return reply('Acción desconocida.',404);
  }
  if (['/invitacion','/invitacion/','/invitacion.html','/demo/entrar','/demo/canjear'].includes(path)) return Response.redirect(url.origin+'/app.html#',303);
  if (path === '/demo/solicitar' || path === '/demo/configurar') return reply('El acceso ya está abierto.',410);
  if (/^\/(?:promo|admin|invitacion|privacidad|terminos|contacto|mediakit|guia|documentacion|convenios|consultar-publicidad)(?:\.html)?\/?$/.test(path)) return next();
  if (path === '/' || /^\/index(?:\.html)?\/?$/.test(path)) return Response.redirect(url.origin+'/promo.html',302);
  if (/\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|woff2?|gif|avif|webmanifest|mp4)$/i.test(path)) return next();
  if (env.DEMO_EMERGENCY_PAUSE==='1' || (db && (await db.prepare('SELECT paused FROM demo_state WHERE id=1').first())?.paused)) return maintenance();
  if (path === '/demo/estado') return reply('Disponible',200);
  const asset = await next();
  const response = new Response(asset.body, asset);
  response.headers.set('Cache-Control','private, no-store');
  if (/^\/app(?:\.html)?\/?$/.test(path) && response.headers.get('content-type')?.includes('text/html')) {
    return new HTMLRewriter().on('body',{element(el){el.append('<script src="/demo-estado.js" defer></script>',{html:true})}}).transform(response);
  }
  return response;
}
