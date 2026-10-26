/* Optional, preparatory STAGING transport. Not imported by worker.js.
 * Only an operator-configured recipient allowlist may be used in future QA.
 * A duplicate/error is NOT a delivery receipt. No real account/key is configured.
 */
import {ACCESS_MAIL_TTL_MS, buildAccessMailMessage} from './access-mail-message.mjs';
const endpoint = 'https://api.brevo.com/v3/smtp/email';
const MAX_RESPONSE = 8192;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const address = value => typeof value === 'string' && value.length <= 160 &&
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(value)
  ? value.toLowerCase() : '';
const fail = code => Object.assign(new Error(code), {code});
const need = (ok, code) => { if (!ok) throw fail(code); };

async function readJSON(response, signal) {
  need(/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || ''), 'MAIL_RESPONSE');
  const size = response.headers.get('content-length');
  need(size === null || /^\d+$/.test(size) && Number(size) <= MAX_RESPONSE, 'MAIL_RESPONSE');
  need(response.body, 'MAIL_RESPONSE');
  const reader = response.body.getReader(), chunks = [];
  const cancel = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, {once: true});
  let bytes = 0;
  try {
    need(!signal.aborted, 'MAIL_CANCELLED');
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      need(bytes <= MAX_RESPONSE, 'MAIL_RESPONSE');
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    // A failed/cancelled body must not keep the response stream alive.
    reader.cancel().catch(() => {});
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  try {
    const data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(buffer));
    need(data && typeof data === 'object' && !Array.isArray(data), 'MAIL_RESPONSE');
    return data;
  } catch { throw fail('MAIL_RESPONSE'); }
}

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
    const controller = new AbortController();
    let timer, abort;
    try {
      const request = new Request(endpoint, {method: 'POST', redirect: 'manual', credentials: 'omit',
        cache: 'no-store', headers: {'Content-Type': 'application/json', Accept: 'application/json', 'api-key': apiKey},
        body, signal: controller.signal});
      const cancelled = new Promise((_, reject) => {
        abort = () => { controller.abort(); reject(fail('MAIL_CANCELLED')); };
        if (signal?.aborted) abort();
        else signal?.addEventListener('abort', abort, {once: true});
      });
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(fail('MAIL_TIMEOUT')); }, timeoutMs);
      });
      const operation = (async () => {
        need(!controller.signal.aborted, 'MAIL_CANCELLED');
        const response = await fetchImpl(request);
        need(response.status < 300 || response.status >= 400, 'MAIL_REDIRECT');
        if (response.status === 429) throw fail('MAIL_RATE_LIMIT');
        if (response.status === 402) throw fail('MAIL_QUOTA');
        if (response.status === 401 || response.status === 403) throw fail('MAIL_CONFIGURATION');
        if (response.status >= 500) throw fail('MAIL_UNAVAILABLE');
        const data = await readJSON(response, controller.signal);
        if (response.status !== 201) {
          // Brevo documents a duplicate_parameter error instead of the original
          // message ID on replay. Never invent an ID or activate an access token.
          if (data.code === 'duplicate_parameter') throw fail('MAIL_DELIVERY_UNCONFIRMED');
          throw fail('MAIL_REJECTED');
        }
        need(typeof data.messageId === 'string' && data.messageId.length <= 256 &&
          /^<[^<>\s\x00-\x1f]+@[^<>\s\x00-\x1f]+>$/.test(data.messageId) &&
          data.messageIds === undefined, 'MAIL_RECEIPT');
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.messageId));
        // A bounded, normalized receipt identifier; not an invented message ID.
        return {id: 'brevo:' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')};
      })();
      return await Promise.race([operation, cancelled, deadline]);
    } catch (error) {
      const codes = new Set(['MAIL_RESPONSE', 'MAIL_REDIRECT', 'MAIL_RATE_LIMIT', 'MAIL_QUOTA', 'MAIL_CONFIGURATION',
        'MAIL_UNAVAILABLE', 'MAIL_DELIVERY_UNCONFIRMED', 'MAIL_REJECTED', 'MAIL_RECEIPT', 'MAIL_CANCELLED', 'MAIL_TIMEOUT']);
      throw fail(codes.has(error?.code) ? error.code : 'MAIL_UNAVAILABLE');
    } finally {
      clearTimeout(timer);
      if (abort) signal?.removeEventListener('abort', abort);
      controller.abort();
    }
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
