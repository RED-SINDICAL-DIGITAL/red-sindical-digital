/* Optional, preparatory STAGING transport. Not imported by worker.js.
 * Only an operator-configured recipient allowlist may be used in future QA.
 * A duplicate/error is NOT a delivery receipt. No real account/key is configured.
 */
import {ACCESS_MAIL_TTL_MS, buildAccessMailMessage} from './access-mail-message.mjs';
import {uadavBrevoRequest} from './brevo-request.mjs';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const address = value => typeof value === 'string' && value.length <= 160 &&
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(value)
  ? value.toLowerCase() : '';
const fail = code => Object.assign(new Error(code), {code});
const need = (ok, code) => { if (!ok) throw fail(code); };

export function createBrevoStagingMail({mode, apiKey, senderEmail, allowedRecipients,
  fetchImpl = globalThis.fetch, clock = Date.now, timeoutMs = 5000} = {}) {
  need(mode === 'staging-only' && typeof apiKey === 'string' && /^[A-Za-z0-9._-]{32,512}$/.test(apiKey) &&
    address(senderEmail) === senderEmail && senderEmail.endsWith('@correo-staging.uadavstream.com.ar') &&
    Array.isArray(allowedRecipients) && allowedRecipients.length >= 1 && allowedRecipients.length <= 10 &&
    allowedRecipients.every(item => address(item) && address(item) === item) &&
    typeof fetchImpl === 'function' && typeof clock === 'function' &&
    Number.isInteger(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 5000, 'MAIL_CONFIGURATION');
  const recipients = new Set(allowedRecipients);

  async function sendAccess({requestId, to, purpose, token, issuedAt, expiresAt, jobId, version, signal} = {}) {
    need(uuid.test(requestId || '') && address(to) === to && recipients.has(to), 'MAIL_INPUT');
    const now = clock();
    need(Number.isSafeInteger(now) && Number.isSafeInteger(issuedAt) && issuedAt <= now &&
      expiresAt > now && expiresAt - issuedAt <= ACCESS_MAIL_TTL_MS, 'MAIL_EXPIRED');
    let message;
    try { message = buildAccessMailMessage({purpose, token, issuedAt, expiresAt, jobId, version}); }
    catch { throw fail('MAIL_INPUT'); }
    const body = JSON.stringify({sender: {email: senderEmail, name: 'UADAV STREAM · pruebas'},
      to: [{email: to}], ...message, headers: {idempotencyKey: requestId}});
    return uadavBrevoRequest({mode, apiKey, body, signal, timeoutMs, fetchImpl});
  }

  // Adapter for the existing preparatory Bolsa outbox. No live route invokes it.
  async function send({idempotencyKey, payload, signal} = {}) {
    const requestId = typeof idempotencyKey === 'string' && idempotencyKey.startsWith('uadav-job-recovery/')
      ? idempotencyKey.slice('uadav-job-recovery/'.length) : '';
    need(payload && typeof payload === 'object', 'MAIL_INPUT');
    return sendAccess({requestId, to: payload.to, purpose: 'job_owner_recovery', token: payload.token,
      issuedAt: payload.expires_at - ACCESS_MAIL_TTL_MS, expiresAt: payload.expires_at, jobId: payload.job_id, signal});
  }
  return Object.freeze({idempotencyWindowMs: 30 * 60 * 1000, send, sendAccess});
}
