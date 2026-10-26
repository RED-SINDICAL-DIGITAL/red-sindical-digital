import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto, randomUUID} from 'node:crypto';
import vm from 'node:vm';
import {sqliteD1} from './sqlite-d1.mjs';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default: worker, uadavJobToday} = await loadWorker();
const site = 'https://uadav-api-staging.uadavstream.workers.dev', path = '/api/admin/jobs/email-check';
const admin = 'synthetic-admin', providerKey = 'synthetic-brevo-key-' + 'x'.repeat(40);
const body = extra => ({request_id: randomUUID(), confirm: 'BREVO_SANDBOX_STAGING', ...extra});
const accepted = () => Response.json({messageId: '<synthetic-123@relay.example.invalid>'}, {status: 201});
async function fixture(provider) {
  const DB = sqliteD1(), calls = [], untouched = [], originalFetch = globalThis.fetch;
  for (const name of ['20261023_job_owner_credentials.sql', '20261024_job_store.sql']) {
    const sql = await readFile(new URL('../migrations/staging/' + name, import.meta.url), 'utf8');
    for (const s of sql.replace(/--[^\n]*/g, '').split(';').filter(s => s.trim())) await DB.prepare(s).run();
  }
  await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('migration_ready','true')").run();
  await DB.prepare("INSERT INTO job_store_meta(key,value) VALUES('cron:sentinel','private-existing-receipt')").run();
  const env = {ADMIN_KEY: admin, BREVO_API_KEY: providerKey, JOB_STORE_D1: 'true', DB,
    UADAV_DB: {get: async key => {untouched.push(key);return null;}, put: async () => {throw Error('KV must not change');}}};
  DB.withSession = mode => {assert.equal(mode, 'first-primary');return DB;};
  globalThis.fetch = async request => {
    assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(request.redirect, 'manual');assert.equal(request.credentials, 'omit');
    assert.equal(request.headers.get('api-key'), providerKey);
    assert.equal(request.headers.get('Authorization'), null);assert.equal(request.headers.get('Cookie'), null);
    const sent = await request.clone().json();
    assert.equal(sent.headers['X-Sib-Sandbox'], 'drop');assert.deepEqual(sent.to, [{email: 'uadav-sandbox@example.invalid'}]);
    assert.equal(sent.sender.email, 'acceso@correo-staging.uadavstream.com.ar');
    assert.equal(sent.htmlContent, undefined);assert.equal(sent.attachment, undefined);assert.equal(sent.cc, undefined);
    calls.push({request, sent});return provider ? provider(request, sent) : accepted();
  };
  const call = async ({method = 'GET', data, raw, origin = site, host = site, key = admin, route = path, contentType = 'application/json'} = {}) => {
    const r = await worker.fetch(new Request(host + route, {method,
      headers: {...(origin ? {Origin: origin} : {}), ...(key ? {Authorization: 'Bearer ' + key} : {}), 'Content-Type': contentType},
      ...(['GET', 'HEAD'].includes(method) ? {} : {body: raw === undefined ? JSON.stringify(data ?? {}) : raw})}), env, {});
    return {status: r.status, data: await r.json(), headers: r.headers};
  };
  const get = async key => {const r = await DB.prepare('SELECT value FROM job_store_meta WHERE key=?').bind(key).first();return r ? JSON.parse(r.value) : null;};
  const put = (key, value) => DB.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, JSON.stringify(value)).run();
  return {DB, env, calls, untouched, call, get, put, close() {globalThis.fetch = originalFetch;DB.close();}};
}

test('probe authenticates and checks exact HTTPS host and origin before secret or database access', async () => {
  const env = new Proxy({ADMIN_KEY: admin}, {get(target, name) {if (name === 'ADMIN_KEY') return target[name];throw Error('Unexpected binding read: ' + String(name));}});
  const call = (host, key, origin = site) => worker.fetch(new Request(host + path, {headers: {Origin: origin, ...(key ? {Authorization: 'Bearer ' + key} : {})}}), env, {});
  assert.equal((await call(site)).status, 401);
  for (const host of ['https://uadav-api.uadavstream.workers.dev', 'http://uadav-api-staging.uadavstream.workers.dev', site + ':4430']) assert.equal((await call(host, admin)).status, 403);
  assert.equal((await call(site, admin, 'https://evil.example')).status, 403);
  assert.equal((await call(site, admin, 'https://uadav-stream-staging.pages.dev')).status, 403);
});

test('public probe page has no credentials, external resources or automatic provider operation', async () => {
  const env = new Proxy({}, {get() {throw Error('HTML must not read bindings');}});
  const r = await worker.fetch(new Request(site + '/qa/correo'), env, {}), html = await r.text();
  assert.equal(r.status, 200);assert.match(r.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.match(r.headers.get('Content-Security-Policy'), /connect-src 'self'/);
  assert.equal(r.headers.get('Cache-Control'), 'no-store');assert.equal(r.headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(html, /autocomplete="current-password"/);assert.doesNotMatch(html, /localStorage|sessionStorage|<script[^>]+src=|<img|%%NONCE%%/);
  assert(!html.includes(providerKey));assert(!html.includes('Bearer ' + admin));
  assert.equal((await worker.fetch(new Request('https://uadav-api.uadavstream.workers.dev/qa/correo'), env, {})).status, 403);
});

test('readiness is private, read-only and never calls Brevo', async () => {
  const f = await fixture();try {
    const before = (await f.DB.prepare('SELECT total_changes() AS n').first()).n;
    const r = await f.call();assert.equal(r.status, 200);assert.equal(r.data.ready, true);assert.equal(r.data.api_key_present, true);assert.equal(r.data.remaining_today, 5);
    assert.equal(r.data.emails_sent, 0);assert.equal(r.data.delivery_verified, false);assert.equal(r.data.recovery_enabled, false);
    assert.equal((await f.DB.prepare('SELECT total_changes() AS n').first()).n, before);assert.equal(f.calls.length, 0);assert.deepEqual(f.untouched, []);
    for (const secret of [admin, providerKey, 'private-existing-receipt']) assert(!JSON.stringify(r.data).includes(secret));
  } finally {f.close();}
});

test('missing key, maintenance, non-D1, missing schema and unready migration fail before provider access', async () => {
  const f = await fixture();try {
    delete f.env.BREVO_API_KEY;const status = await f.call();assert.equal(status.data.ready, false);assert.equal(status.data.api_key_present, false);
    assert.equal((await f.call({method: 'POST', data: body()})).status, 503);f.env.BREVO_API_KEY = providerKey;
    f.env.JOB_STORE_MAINTENANCE = 'true';assert.equal((await f.call({method: 'POST', data: body()})).status, 423);delete f.env.JOB_STORE_MAINTENANCE;
    f.env.JOB_STORE_D1 = 'false';assert.equal((await f.call({method: 'POST', data: body()})).status, 503);f.env.JOB_STORE_D1 = 'true';
    await f.DB.prepare("UPDATE job_store_meta SET value='false' WHERE key='migration_ready'").run();assert.equal((await f.call({method: 'POST', data: body()})).status, 503);
    await f.DB.prepare('DROP TABLE job_store_meta').run();assert.equal((await f.call()).status, 503);assert.equal(f.calls.length, 0);
  } finally {f.close();}
});

test('input cannot select recipient, mode, sender, payload, URL or arbitrary headers', async () => {
  const f = await fixture();try {
    for (const extra of [{to: 'real@example.com'}, {sandbox: false}, {sender: 'other@example.com'}, {url: 'https://evil.test'}, {headers: {}}, {token: 'secret'}]) assert.equal((await f.call({method: 'POST', data: body(extra)})).status, 400);
    for (const data of [null, [], {request_id: randomUUID()}, body({confirm: 'SEND'}), body({request_id: '../private'})]) assert.equal((await f.call({method: 'POST', data})).status, 400);
    for (const raw of ['{', 'x'.repeat(300)]) assert.equal((await f.call({method: 'POST', raw})).status, 400);
    assert.equal((await f.call({method: 'POST', data: body(), contentType: 'text/plain'})).status, 400);
    assert.equal((await f.call({method: 'POST', data: body(), route: path + '?to=other'})).status, 400);
    assert.equal((await f.call({route: path + '?request_id=bad'})).status, 400);assert.equal(f.calls.length, 0);
    for (const method of ['PUT', 'DELETE', 'PATCH']) {const r = await f.call({method});assert.equal(r.status, 405);assert.equal(r.headers.get('Allow'), 'GET,POST');}
  } finally {f.close();}
});

test('sandbox acceptance is recorded without claiming delivery, changing jobs, credentials, recovery or cron', async () => {
  const f = await fixture();try {
    const schema = (await f.DB.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all()).results;
    const b = body(), r = await f.call({method: 'POST', data: b});assert.equal(r.status, 200);assert.equal(r.data.result, 'accepted');assert.equal(r.data.emails_sent, 0);assert.equal(r.data.delivery_verified, false);assert.equal(r.data.recovery_enabled, false);
    assert.equal(f.calls.length, 1);assert.equal(f.calls[0].sent.headers.idempotencyKey, b.request_id);assert.equal(r.data.remaining_today, 4);
    const saved = await f.get('brevo:sandbox:request:' + b.request_id);assert.equal(saved.state, 'accepted');assert.match(saved.receipt, /^brevo:[a-f0-9]{64}$/);
    for (const table of ['job_store_records', 'job_owner_credentials', 'job_owner_recovery_v2', 'job_store_checks']) assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM ' + table).first()).n, 0);
    assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='cron:sentinel'").first()).value, 'private-existing-receipt');
    assert.deepEqual((await f.DB.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all()).results, schema);assert.deepEqual(f.untouched, []);
    assert(!JSON.stringify(r.data).includes(providerKey));assert(!JSON.stringify(r.data).includes('relay.example.invalid'));
  } finally {f.close();}
});

test('same request replays and GET status do not call Brevo or consume another reservation', async () => {
  const f = await fixture();try {
    const b = body(), first = await f.call({method: 'POST', data: b});
    assert.equal((await f.call({method: 'POST', data: b})).data.result, 'accepted');
    assert.deepEqual((await f.call({route: path + '?request_id=' + b.request_id})).data, first.data);
    assert.equal(f.calls.length, 1);assert.equal((await f.get('brevo:sandbox:daily')).count, 1);
    assert.equal((await f.call({route: path + '?request_id=' + randomUUID()})).status, 404);
  } finally {f.close();}
});

test('simultaneous identical requests reserve and call provider only once', async () => {
  let release, entered;const waiting = new Promise(resolve => entered = resolve), gate = new Promise(resolve => release = resolve);
  const f = await fixture(async () => {entered();await gate;return accepted();});try {
    const b = body(), first = f.call({method: 'POST', data: b});await waiting;
    const other = await f.call({method: 'POST', data: b});assert.equal(other.status, 202);assert.equal(other.data.result, 'pending');
    release();assert.equal((await first).data.result, 'accepted');assert.equal(f.calls.length, 1);assert.equal((await f.get('brevo:sandbox:daily')).count, 1);
  } finally {release?.();f.close();}
});

test('six simultaneous distinct requests share an atomic limit of five', async () => {
  const f = await fixture();try {
    const results = await Promise.all(Array.from({length: 6}, () => f.call({method: 'POST', data: body()})));
    assert.equal(results.filter(r => r.status === 200).length, 5);assert.equal(results.filter(r => r.status === 429).length, 1);
    assert.equal(f.calls.length, 5);assert.equal((await f.get('brevo:sandbox:daily')).count, 5);
    assert.equal((await f.call({method: 'POST', data: body()})).status, 429);assert.equal(f.calls.length, 5);
  } finally {f.close();}
});

test('reservation SQL failure rolls back the counter and never contacts provider', async () => {
  const f = await fixture();try {
    const batch = f.DB.batch;f.DB.batch = statements => batch([...statements, f.DB.prepare("INSERT INTO job_store_checks(id,valid) VALUES('synthetic-failure',0)")]);
    const r = await f.call({method: 'POST', data: body()});assert.equal(r.status, 503);assert.equal(f.calls.length, 0);assert.equal(await f.get('brevo:sandbox:daily'), null);
    f.DB.batch = batch;assert.equal((await f.call({method: 'POST', data: body()})).data.result, 'accepted');assert.equal(f.calls.length, 1);
  } finally {f.close();}
});

test('a missing request row cannot reuse the counter last-request ID to bypass the daily limit', async () => {
  const f=await fixture();try{
    for(let i=0;i<5;i++)await f.call({method:'POST',data:body()});const last=await f.get('brevo:sandbox:daily');
    await f.DB.prepare('DELETE FROM job_store_meta WHERE key=?').bind('brevo:sandbox:request:'+last.request_id).run();
    assert.equal((await f.call({method:'POST',data:body({request_id:last.request_id})})).status,429);assert.equal(f.calls.length,5);
  }finally{f.close();}
});

test('lost reservation acknowledgement stays pending and cannot authorize an uncertain send', async () => {
  const f = await fixture();try {
    const batch = f.DB.batch;f.DB.batch = async statements => {await batch(statements);throw Error('synthetic lost ack');};
    const b = body(), r = await f.call({method: 'POST', data: b});assert.equal(r.status, 202);assert.equal(r.data.result, 'pending');assert.equal(f.calls.length, 0);
    assert.equal((await f.call({method: 'POST', data: b})).status, 202);assert.equal(f.calls.length, 0);
  } finally {f.close();}
});

test('provider failures are unconfirmed, sanitized and never automatically retried', async () => {
  for (const status of [401, 403, 429, 500]) {
    const f = await fixture(async () => Response.json({message: providerKey + 'private'}, {status}));try {
      const b = body(), r = await f.call({method: 'POST', data: b});assert.equal(r.data.result, 'unconfirmed');assert.equal(r.data.emails_sent, 0);
      assert(!JSON.stringify(r.data).includes(providerKey));assert(!JSON.stringify(r.data).includes('private'));
      assert.equal((await f.call({method: 'POST', data: b})).data.result, 'unconfirmed');assert.equal(f.calls.length, 1);
    } finally {f.close();}
  }
});

test('final SQL failure and lost acknowledgement can be queried without another provider call', async () => {
  for (const committed of [false, true]) {
    const f = await fixture();try {
      const prepare = f.DB.prepare;f.DB.prepare = sql => {const statement = prepare(sql);if(sql.startsWith('UPDATE job_store_meta SET value=')){const run = statement.run;statement.run = async () => {if(committed)await run.call(statement);throw Error('synthetic SQL/ack failure');};}return statement;};
      const b = body(), r = await f.call({method: 'POST', data: b});assert.equal(r.status, committed ? 200 : 503);
      const read = await f.call({route: path + '?request_id=' + b.request_id});assert.equal(read.data.result, committed ? 'accepted' : 'pending');assert.equal(f.calls.length, 1);
      await f.call({method: 'POST', data: b});assert.equal(f.calls.length, 1);
    } finally {f.close();}
  }
});

test('an ownership change during provider call cannot be overwritten by the first request', async () => {
  let f;f = await fixture(async (_request, sent) => {
    const key = 'brevo:sandbox:request:' + sent.headers.idempotencyKey, value = await f.get(key);value.owner = randomUUID();await f.put(key, value);return accepted();
  });try {
    const b = body(), r = await f.call({method: 'POST', data: b});assert.equal(r.status, 503);assert.equal((await f.get('brevo:sandbox:request:' + b.request_id)).state, 'pending');assert.equal(f.calls.length, 1);
  } finally {f.close();}
});

test('corrupt history fails closed before provider and retention deletes only old probe records', async () => {
  const f = await fixture();try {
    await f.put('brevo:sandbox:daily', {version: 1, day: uadavJobToday(), count: -1, request_id: randomUUID()});assert.equal((await f.call({method: 'POST', data: body()})).status, 503);assert.equal(f.calls.length, 0);
    await f.DB.prepare("DELETE FROM job_store_meta WHERE key='brevo:sandbox:daily'").run();
    const old = 'brevo:sandbox:request:' + randomUUID();await f.put(old, {created_at: Date.now() - 8 * 86400000});
    assert.equal((await f.call({method: 'POST', data: body()})).data.result, 'accepted');assert.equal(await f.get(old), null);
    assert.equal((await f.DB.prepare("SELECT value FROM job_store_meta WHERE key='cron:sentinel'").first()).value, 'private-existing-receipt');
  } finally {f.close();}
});

test('Argentina date resets the daily counter and older requests remain non-replayable', async () => {
  const f = await fixture(), realNow = Date.now;try {
    const b = body();await f.call({method: 'POST', data: b});const before = realNow();Date.now = () => before + 86400000;
    assert.equal((await f.call()).data.remaining_today, 5);assert.equal((await f.call({method: 'POST', data: body()})).data.remaining_today, 4);
    assert.equal((await f.call({method: 'POST', data: b})).data.result, 'accepted');assert.equal(f.calls.length, 2);
  } finally {Date.now = realNow;f.close();}
});

test('public recovery routes remain 503 even with the provider secret configured', async () => {
  const f = await fixture();try {
    for (const name of ['solicitar', 'restablecer']) assert.equal((await f.call({route: '/api/bolsa_trabajo/acceso/' + name, method: 'POST', key: '', data: {}})).status, 503);
    assert.equal(f.calls.length, 0);
  } finally {f.close();}
});

const html = await readFile(new URL('../scripts/brevo-probe-page.html', import.meta.url), 'utf8');
const uiResponse = data => Response.json({build:'11765',scope:'brevo-sandbox-staging',sandbox:true,emails_sent:0,delivery_verified:false,recovery_enabled:false,...data});
const ui = html.match(/<script nonce="%%NONCE%%">([\s\S]*?)<\/script>/)[1];
function page(fetchImpl) {
  const nodes = new Map(), events = {}, requests = [], copied = [];
  const node = id => {if(!nodes.has(id))nodes.set(id,{id,value:'',textContent:'',hidden:false,disabled:false,focus(){this.focused=true;},addEventListener(type,fn){this[type]=fn;}});return nodes.get(id);};
  const context = {document: {getElementById: node}, window: {addEventListener: (name, fn) => events[name] = fn},
    fetch: async (url, options) => {requests.push({url,options});return fetchImpl ? fetchImpl(url,options) : uiResponse({ready:true,remaining_today:5});},
    navigator: {clipboard: {writeText: async text => copied.push(text)}}, Date, crypto, AbortController, setTimeout, clearTimeout, encodeURIComponent};
  vm.runInNewContext(ui, context);
  const login = async () => {node('adminKey').value=admin;await node('loginForm').submit({preventDefault(){}});};
  return {node, events, requests, copied, login};
}
test('probe UI does not send automatically and clears the password field after login', async () => {
  const p=page();assert.equal(p.requests.length,0);await p.login();assert.equal(p.requests.length,1);assert.equal(p.requests[0].options.method,'GET');assert.equal(p.node('adminKey').value,'');assert.equal(p.node('checkButton').disabled,false);
});
test('probe UI sends only after a click and copies a fixed report without either credential', async () => {
  const p=page(async (_url,options)=>uiResponse(options.method==='POST'?{build:'11765',result:'accepted',remaining_today:4,private_secret:providerKey}:{ready:true,remaining_today:5}));
  await p.login();await p.node('checkButton').onclick();assert.equal(p.requests.filter(r=>r.options.method==='POST').length,1);
  await p.node('copyButton').onclick();assert.equal(p.copied.length,1);assert(!p.copied[0].includes(admin));assert(!p.copied[0].includes(providerKey));assert.equal(JSON.parse(p.copied[0]).delivery_verified,false);
});
test('logout during an outstanding UI request prevents a late result from reopening the session', async () => {
  let release;const p=page(async(_url,options)=>options.method==='GET'?uiResponse({ready:true,remaining_today:5}):new Promise(resolve=>release=()=>resolve(uiResponse({result:'accepted',build:'11765',remaining_today:4}))));
  await p.login();const pending=p.node('checkButton').onclick();p.node('logoutButton').onclick();release();await pending;
  assert.equal(p.node('loginPanel').hidden,false);assert.equal(p.node('copyButton').disabled,true);assert.equal(p.node('resultText').textContent,'');
});
test('failed new UI check cannot leave a previous accepted report available for copying', async () => {
  let checks=0;const p=page(async(_url,options)=>options.method==='GET'?uiResponse({ready:true,remaining_today:5}):++checks===1?uiResponse({result:'accepted',build:'11765',remaining_today:4}):Response.json({error:'No se confirmó la comprobación.'},{status:503}));
  await p.login();await p.node('checkButton').onclick();assert.equal(p.node('copyButton').disabled,false);await p.node('checkButton').onclick();assert.equal(p.node('copyButton').disabled,true);assert.equal(p.node('resultText').textContent,'');
});

test('UI cannot turn an unexpected scope or delivery response into a safe accepted report',async()=>{
  for(const patch of [{sandbox:false},{emails_sent:1},{delivery_verified:true},{recovery_enabled:true},{scope:'production'},{build:'11764'}]){
    const p=page(async(_url,options)=>options.method==='GET'?uiResponse({ready:true,remaining_today:5}):uiResponse({result:'accepted',remaining_today:4,...patch}));
    await p.login();await p.node('checkButton').onclick();assert.equal(p.node('copyButton').disabled,true);assert.match(p.node('status').textContent,/respuesta no corresponde/);
  }
});

test('UI authentication failure returns to login and pagehide clears a successful session',async()=>{
  const denied=page(async()=>Response.json({error:'No autorizado'},{status:401}));await denied.login();assert.equal(denied.node('loginPanel').hidden,false);assert.equal(denied.node('loginButton').disabled,false);assert.match(denied.node('status').textContent,/clave Admin/);
  const p=page();await p.login();p.events.pagehide();await p.node('checkButton').onclick();assert.equal(p.requests.length,1);assert.equal(p.node('copyButton').disabled,true);
});
