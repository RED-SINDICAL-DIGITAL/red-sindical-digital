/* Optional, preparatory STAGING transport. Not imported by worker.js.
 * Only an operator-configured recipient allowlist may be used in future QA.
 * A duplicate/error is NOT a delivery receipt. The module contains no real key;
 * future operational callers must supply secrets and prepare the queued message.
 */
import {ACCESS_MAIL_TTL_MS, buildAccessMailMessage} from './access-mail-message.mjs';
import {uadavBrevoRequest} from './brevo-request.mjs';
import {brevoStagingAddress,brevoTransportHash,prepareBrevoRecoveryMessage,validateBrevoRecoveryMessage} from './brevo-recovery-message.mjs';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const address = brevoStagingAddress;
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
  const transportHash=brevoTransportHash(apiKey);

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
  async function prepare(payload){
    need(payload&&recipients.has(payload.to),'MAIL_INPUT');
    return prepareBrevoRecoveryMessage({requestId:payload.request_id,to:payload.to,token:payload.token,issuedAt:payload.expires_at-ACCESS_MAIL_TTL_MS,
      expiresAt:payload.expires_at,jobId:payload.job_id,senderEmail,transportHash:await transportHash});
  }
  async function send({idempotencyKey, payload, signal} = {}) {
    const requestId = typeof idempotencyKey === 'string' && idempotencyKey.startsWith('uadav-job-recovery/')
      ? idempotencyKey.slice('uadav-job-recovery/'.length) : '';
    need(payload && typeof payload === 'object', 'MAIL_INPUT');
    need(recipients.has(payload.to),'MAIL_INPUT');
    const now=clock();need(Number.isSafeInteger(now)&&payload.expires_at-ACCESS_MAIL_TTL_MS<=now&&payload.expires_at>now,'MAIL_EXPIRED');
    const body=await validateBrevoRecoveryMessage(payload.delivery,{requestId,to:payload.to,token:payload.token,issuedAt:payload.expires_at-ACCESS_MAIL_TTL_MS,
      expiresAt:payload.expires_at,jobId:payload.job_id,transportHash:await transportHash});
    return uadavBrevoRequest({mode,apiKey,body,signal,timeoutMs,fetchImpl});
  }
  return Object.freeze({idempotencyWindowMs: 30 * 60 * 1000, prepare, send, sendAccess});
}
