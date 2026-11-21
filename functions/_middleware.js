const hosts = new Set(['integration-staging-preserve.uadav-stream-staging.pages.dev', 'uadavstream.com.ar', 'www.uadavstream.com.ar']);
const legacyEntries = new Set(['/invitacion', '/invitacion/', '/invitacion.html', '/demo/entrar', '/demo/canjear']);

export function onRequest({request, next}) {
  const url = new URL(request.url);
  if (!hosts.has(url.hostname)) return next();
  if (legacyEntries.has(url.pathname)) return Response.redirect(url.origin + '/app.html', 303);
  if (url.pathname.startsWith('/demo/')) return new Response('Acceso directo desde la portada.', {status:410});
  if (url.pathname === '/' || /^\/index(?:\.html)?\/?$/.test(url.pathname)) return Response.redirect(url.origin + '/promo.html', 302);
  return next();
}
