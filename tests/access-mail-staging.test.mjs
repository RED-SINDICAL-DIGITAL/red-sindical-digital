import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto, randomUUID, createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {ACCESS_MAIL_TTL_MS, buildAccessMailMessage} from '../scripts/access-mail-message.mjs';
import {createBrevoStagingMail} from '../scripts/brevo-staging-mail.mjs';
globalThis.crypto ||= webcrypto;
const now = Date.parse('2026-10-27T02:45:00.000Z');
const token = 'a'.repeat(64), to = 'synthetic@example.invalid', apiKey = 'synthetic-brevo-key-' + 'b'.repeat(40);
const senderEmail = 'acceso@correo-staging.uadavstream.com.ar';
const messageId = '<synthetic-123@relay.example.invalid>';
const valid = extra => ({purpose: 'account_sign_in', token, issuedAt: now, expiresAt: now + ACCESS_MAIL_TTL_MS, ...extra});
const envelope = extra => ({...valid(), requestId: randomUUID(), to, ...extra});
const receipt = () => Response.json({messageId}, {status: 201});
function setup(extra = {}) {
  let time = now;
  const requests = [];
  const adapter = createBrevoStagingMail({mode: 'staging-only', apiKey, senderEmail, allowedRecipients: [to],
    clock: () => time, fetchImpl: async request => {requests.push(request); return receipt();}, ...extra});
  return {adapter, requests, advance: ms => time += ms};
}

test('staging mode, isolated sender, key and explicit recipients are required before any network', () => {
  const base = {mode: 'staging-only', apiKey, senderEmail, allowedRecipients: [to]};
  for (const extra of [{mode: 'production'}, {mode: undefined}, {apiKey: 'bad\nkey'},
    {senderEmail: 'acceso@uadavstream.com.ar'}, {senderEmail: 'acceso@correo-staging.uadavstream.com.ar.evil.test'},
    {allowedRecipients: []}, {allowedRecipients: [to, 'bad\r\n@example.invalid']},
    {allowedRecipients: Array(11).fill(to)}, {timeoutMs: 5001}, {fetchImpl: null}]) {
    assert.throws(() => createBrevoStagingMail({...base, ...extra}), {code: 'MAIL_CONFIGURATION'});
  }
});

test('account, email verification and offer messages have one clear action and no permanent code', () => {
  for (const purpose of ['account_sign_in', 'account_verify_email', 'job_owner_recovery']) {
    const mail = buildAccessMailMessage(valid({purpose, ...(purpose === 'job_owner_recovery' ? {jobId: 'JOB-TEST-QA'} : {})}));
    assert.equal((mail.htmlContent.match(/<a /g) || []).length, 1);
    assert.match(mail.htmlContent, /<html lang="es">/);
    assert.match(mail.htmlContent, /min-height:48px/);
    assert.match(mail.textContent, /No necesitás guardar ni recordar códigos largos/);
    assert.match(mail.textContent, /Si no lo pediste vos/);
    assert.match(mail.textContent, /una sola vez/);
    assert.doesNotMatch(mail.htmlContent, /<script|<img|<form|onerror=|UAC-|UAD-/i);
    const link = new URL(mail.htmlContent.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&'));
    assert.equal(link.origin, 'https://uadav-stream-staging.pages.dev');
    assert.equal(link.pathname, '/acceso-correo.html');
    assert.equal(link.search, '');
    assert.equal(new URLSearchParams(link.hash.slice(1)).get('token'), token);
    assert.equal(new URLSearchParams(link.hash.slice(1)).get('purpose'), purpose);
  }
});

test('message generation rejects hostile purposes, references, token formats and time ranges', () => {
  for (const extra of [{purpose: '__proto__'}, {purpose: 'admin_recovery'}, {token: 'UAC-' + token},
    {token: token + '<img>'}, {issuedAt: -1}, {issuedAt: NaN}, {expiresAt: now},
    {expiresAt: now + ACCESS_MAIL_TTL_MS + 1}, {expiresAt: Number.MAX_SAFE_INTEGER},
    {purpose: 'job_owner_recovery'}, {purpose: 'job_owner_recovery', jobId: '../admin'},
    {jobId: 'JOB-TEST-QA'}, {version: 2}]) {
    assert.throws(() => buildAccessMailMessage(valid(extra)), {code: 'ACCESS_MAIL_INPUT'});
  }
});

test('expiry text is stable and uses Argentina midnight rather than the host timezone', () => {
  const mail = buildAccessMailMessage(valid());
  assert.match(mail.textContent, /27\/10\/2026, 00:00/);
  assert.match(mail.textContent, /hora argentina/);
  assert.deepEqual(buildAccessMailMessage(valid()), mail);
});

test('provider receives only the fixed API endpoint, one allowlisted recipient and the scoped payload', async () => {
  const f = setup(), request = envelope({attachments: [{content: 'do-not-forward'}], apiKey: 'do-not-forward',
    cc: ['private@example.invalid'], callback: 'https://evil.test'});
  const result = await f.adapter.sendAccess(request);
  assert.equal(f.requests.length, 1);
  const sent = f.requests[0], body = await sent.json();
  assert.equal(sent.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(sent.redirect, 'manual');assert.equal(sent.credentials, 'omit');assert.equal(sent.cache, 'no-store');
  assert.equal(sent.headers.get('api-key'), apiKey);
  assert.equal(sent.headers.get('Authorization'), null);assert.equal(sent.headers.get('Cookie'), null);
  assert.deepEqual(body.to, [{email: to}]);assert.equal(body.sender.email, senderEmail);
  assert.deepEqual(body.headers, {idempotencyKey: request.requestId});
  for (const key of ['cc', 'bcc', 'attachment', 'attachments', 'apiKey', 'callback']) assert.equal(body[key], undefined);
  assert(!JSON.stringify(body).includes(apiKey));
  assert.equal(result.id, 'brevo:' + createHash('sha256').update(messageId).digest('hex'));
});

test('retries send exactly the same message and UUID without extending expiry', async () => {
  const f = setup(), request = envelope();
  const a = await f.adapter.sendAccess(request);f.advance(5000);
  const b = await f.adapter.sendAccess(request);
  assert.deepEqual(a, b);assert.equal(await f.requests[0].text(), await f.requests[1].text());
  assert.equal(f.adapter.idempotencyWindowMs, 30 * 60 * 1000);
});

test('recipient injection, other addresses and malformed request IDs cannot reach the provider', async () => {
  const f = setup();
  for (const extra of [{to: 'other@example.invalid'}, {to: to + '\r\nBcc:evil@example.invalid'},
    {requestId: '../private'}, {requestId: 'uadav-job-recovery/' + randomUUID()}, {purpose: 'admin_recovery'}]) {
    await assert.rejects(f.adapter.sendAccess(envelope(extra)), {code: 'MAIL_INPUT'});
  }
  assert.equal(f.requests.length, 0);
});

test('expired and future-issued messages are rejected locally; no automatic next-day retry', async () => {
  const f = setup();
  await assert.rejects(f.adapter.sendAccess(envelope({issuedAt: now + 1})), {code: 'MAIL_EXPIRED'});
  f.advance(ACCESS_MAIL_TTL_MS);
  await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_EXPIRED'});
  assert.equal(f.requests.length, 0);
});

test('Bolsa adapter uses the original UUID and converts its immutable token payload', async () => {
  const f = setup(), id = randomUUID();
  await f.adapter.send({idempotencyKey: 'uadav-job-recovery/' + id,
    payload: {to, token, expires_at: now + ACCESS_MAIL_TTL_MS, job_id: 'JOB-TEST-QA'}});
  const body = await f.requests[0].json();
  assert.equal(body.headers.idempotencyKey, id);assert.match(body.textContent, /Recuperar mi oferta/);
  await assert.rejects(f.adapter.send({idempotencyKey: 'bad', payload: {}}), {code: 'MAIL_INPUT'});
});

test('only a 201 with exactly one valid message ID counts as provider acceptance', async () => {
  for (const data of [{}, {messageId: ''}, {messageId: 'invented'}, {messageId: messageId + '\n'},
    {messageId, messageIds: [messageId]}, {messageId: '<' + 'x'.repeat(256) + '@invalid>'}]) {
    const f = setup({fetchImpl: async () => Response.json(data, {status: 201})});
    await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_RECEIPT'});
  }
  for (const status of [200, 202]) {
    const f = setup({fetchImpl: async () => Response.json({messageId}, {status})});
    await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_REJECTED'});
  }
});

test('Brevo duplicate errors remain unconfirmed and never invent a receipt', async () => {
  const f = setup({fetchImpl: async () => Response.json({code: 'duplicate_parameter', message: 'private provider detail'}, {status: 400})});
  await assert.rejects(f.adapter.sendAccess(envelope()), error => error.code === 'MAIL_DELIVERY_UNCONFIRMED' && !error.message.includes('private'));
});

test('redirects, quota, rate and configuration failures are classified without leaking provider details', async () => {
  for (const [status, code] of [[302, 'MAIL_REDIRECT'], [307, 'MAIL_REDIRECT'], [401, 'MAIL_CONFIGURATION'],
    [403, 'MAIL_CONFIGURATION'], [402, 'MAIL_QUOTA'], [429, 'MAIL_RATE_LIMIT'], [500, 'MAIL_UNAVAILABLE'], [400, 'MAIL_REJECTED']]) {
    let calls = 0;
    const f = setup({fetchImpl: async () => {calls++;return Response.json({message: apiKey + to}, {status});}});
    await assert.rejects(f.adapter.sendAccess(envelope()), error => error.code === code && !error.message.includes(apiKey) && !error.message.includes(to));
    assert.equal(calls, 1);
  }
  const f = setup({fetchImpl: async () => {throw Object.assign(Error(apiKey + to), {code: 123});}});
  await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_UNAVAILABLE'});
});

test('response type, declared size, streamed size, UTF-8 and JSON are bounded', async () => {
  for (const response of [new Response('<html>private</html>'), Response.json([]),
    new Response('bad', {headers: {'content-type': 'application/json'}}),
    new Response('{}', {headers: {'content-type': 'application/json', 'content-length': '9000'}}),
    new Response('x'.repeat(8193), {headers: {'content-type': 'application/json'}}),
    new Response(new Uint8Array([0xff]), {headers: {'content-type': 'application/json'}})]) {
    const f = setup({fetchImpl: async () => response});
    await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_RESPONSE'});
  }
});

test('timeout bounds a provider that ignores cancellation and never retries inside the transport', async () => {
  let calls = 0, signal;
  const f = setup({timeoutMs: 10, fetchImpl: request => {calls++;signal = request.signal;return new Promise(() => {});}});
  await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_TIMEOUT'});
  assert.equal(calls, 1);assert.equal(signal.aborted, true);
});

test('body timeout cancels a stalled response stream', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({pull() {}, cancel() {cancelled = true;}}), {status: 201, headers: {'content-type': 'application/json'}});
  const f = setup({timeoutMs: 10, fetchImpl: async () => response});
  await assert.rejects(f.adapter.sendAccess(envelope()), {code: 'MAIL_TIMEOUT'});
  assert.equal(cancelled, true);
});

test('caller cancellation aborts sending and a pre-aborted request never leaves the process', async () => {
  let calls = 0, started;
  const seen = new Promise(resolve => started = resolve), controller = new AbortController();
  const f = setup({fetchImpl: async request => {calls++;started(request);return new Promise(() => {});}});
  const pending = f.adapter.sendAccess(envelope({signal: controller.signal}));
  const request = await seen;controller.abort();
  await assert.rejects(pending, {code: 'MAIL_CANCELLED'});assert.equal(request.signal.aborted, true);
  await assert.rejects(f.adapter.sendAccess(envelope({signal: controller.signal})), {code: 'MAIL_CANCELLED'});
  assert.equal(calls, 1);
});

test('operational Worker does not import the transport or expose a receiver for these draft messages', async () => {
  const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /brevo-staging-mail|access-mail-message|createBrevoStagingMail/);
});
