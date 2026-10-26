/* Preparatory messages only. No authentication route or email delivery is enabled. */
export const ACCESS_MAIL_VERSION = 1;
export const ACCESS_MAIL_TTL_MS = 15 * 60 * 1000;
const origin = 'https://uadav-stream-staging.pages.dev';
const purposes = {
  account_sign_in: {
    subject: 'Tu acceso a UADAV STREAM',
    title: 'Volvé a Mi Perfil',
    description: 'Desde tu cuenta podés consultar tus contenidos guardados, trabajos y perfiles vinculados.',
    action: 'Entrar a Mi Perfil',
  },
  account_verify_email: {
    subject: 'Confirmá tu correo en UADAV STREAM',
    title: 'Confirmá tu correo',
    description: 'Usaremos este correo para ayudarte a volver a tu cuenta y enviarte avisos importantes.',
    action: 'Confirmar mi correo',
  },
  job_owner_recovery: {
    subject: 'Recuperá tu oferta en UADAV STREAM',
    title: 'Volvé a gestionar tu oferta',
    description: 'Este acceso corresponde a la oferta que solicitaste recuperar.',
    action: 'Recuperar mi oferta',
  },
};
function invalid() {
  throw Object.assign(new Error('ACCESS_MAIL_INPUT'), {code: 'ACCESS_MAIL_INPUT'});
}
const escape = value => value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));

// issuedAt/expiresAt are stored issuance times, never renewed during a retry.
// /acceso-correo.html and its redemption backend are not integrated yet.
export function buildAccessMailMessage({purpose, token, issuedAt, expiresAt, jobId, version = ACCESS_MAIL_VERSION} = {}) {
  const copy = Object.hasOwn(purposes, purpose || '') ? purposes[purpose] : null;
  if (!copy || version !== ACCESS_MAIL_VERSION || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) ||
      !Number.isSafeInteger(issuedAt) || issuedAt <= 0 || !Number.isSafeInteger(expiresAt) ||
      expiresAt <= issuedAt || expiresAt > 8640000000000000 || expiresAt - issuedAt > ACCESS_MAIL_TTL_MS ||
      (purpose === 'job_owner_recovery' ? !/^JOB-[A-Z0-9-]{3,80}$/.test(jobId || '') : jobId !== undefined)) invalid();
  const link = new URL('/acceso-correo.html', origin);
  const fragment = new URLSearchParams({purpose, token});
  if (purpose === 'job_owner_recovery') fragment.set('job', jobId);
  // A fragment avoids sending the token in the initial page URL/server logs.
  // The future receiver must clear it before loading other resources and require
  // an explicit POST confirmation; an email scanner GET must not consume it.
  link.hash = fragment.toString();
  const until = new Date(expiresAt).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', hourCycle: 'h23',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const expiry = 'Podés usarlo una sola vez, hasta el ' + until + ' (hora argentina).';
  const retry = 'Si venció, pedí un enlace nuevo desde Mi Perfil. No necesitás guardar ni recordar códigos largos.';
  const ignore = 'Si no lo pediste vos, ignorá este mensaje. No cambia tu acceso actual.';
  const textContent = ['UADAV STREAM · entorno de prueba', copy.title, copy.description,
    copy.action + ': ' + link.href, expiry, retry, ignore,
    'Este enlace es privado. No lo reenvíes.'].join('\n\n');
  const htmlContent = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:24px;background:#f1f5f9;color:#172033;font:17px/1.6 Arial,sans-serif">' +
    '<main style="max-width:560px;margin:auto;background:#fff;padding:28px;border-radius:16px">' +
    '<p style="font-size:14px;color:#475569">UADAV STREAM · entorno de prueba</p>' +
    '<h1 style="font-size:26px;line-height:1.25">' + escape(copy.title) + '</h1><p>' + escape(copy.description) + '</p>' +
    '<p style="margin:28px 0"><a href="' + escape(link.href) + '" style="display:inline-block;min-height:48px;box-sizing:border-box;padding:12px 22px;border-radius:10px;background:#174bc1;color:#fff;font-weight:bold;text-decoration:none">' + escape(copy.action) + '</a></p>' +
    '<p>' + escape(expiry) + '</p><p>' + escape(retry) + '</p><p>' + escape(ignore) + '</p>' +
    '<p style="font-size:14px;color:#475569">Este enlace es privado. No lo reenvíes.</p></main></body></html>';
  return Object.freeze({subject: copy.subject, textContent, htmlContent});
}
