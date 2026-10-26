/* Shared bounded HTTPS client. Callers supply server-constructed JSON only.
 * No automatic retry, redirect, credential forwarding or logging. */
export async function uadavBrevoRequest({mode, apiKey, body, signal, timeoutMs = 5000, fetchImpl = globalThis.fetch}) {
  const fail = code => Object.assign(new Error(code), {code});
  const need = (ok, code) => { if (!ok) throw fail(code); };
  need(mode === 'staging-only' && typeof apiKey === 'string' && /^[A-Za-z0-9._-]{32,512}$/.test(apiKey) &&
    typeof body === 'string' && new TextEncoder().encode(body).length <= 16384 &&
    Number.isInteger(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 5000 && typeof fetchImpl === 'function', 'MAIL_CONFIGURATION');
  const controller = new AbortController();
  let timer, abort;
  async function readJSON(response) {
    need(/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || ''), 'MAIL_RESPONSE');
    const size = response.headers.get('content-length');
    need(size === null || /^\d+$/.test(size) && Number(size) <= 8192, 'MAIL_RESPONSE');
    need(response.body, 'MAIL_RESPONSE');
    const reader = response.body.getReader(), chunks = [];
    const cancel = () => { reader.cancel().catch(() => {}); };
    controller.signal.addEventListener('abort', cancel, {once: true});
    let bytes = 0;
    try {
      need(!controller.signal.aborted, 'MAIL_CANCELLED');
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        need(bytes <= 8192, 'MAIL_RESPONSE');
        chunks.push(value);
      }
    } finally {
      controller.signal.removeEventListener('abort', cancel);
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
  try {
    const request = new Request('https://api.brevo.com/v3/smtp/email', {method: 'POST', redirect: 'manual', credentials: 'omit',
      cache: 'no-store', headers: {'Content-Type': 'application/json', Accept: 'application/json', 'api-key': apiKey},
      body, signal: controller.signal});
    const cancelled = new Promise((_, reject) => {
      abort = () => { controller.abort(); reject(fail('MAIL_CANCELLED')); };
      if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, {once: true});
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
      const data = await readJSON(response);
      if (response.status !== 201) {
        if (data.code === 'duplicate_parameter') throw fail('MAIL_DELIVERY_UNCONFIRMED');
        throw fail('MAIL_REJECTED');
      }
      need(typeof data.messageId === 'string' && data.messageId.length <= 256 &&
        /^<[^<>\s\x00-\x1f]+@[^<>\s\x00-\x1f]+>$/.test(data.messageId) && data.messageIds === undefined, 'MAIL_RECEIPT');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.messageId));
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
