/* Private connection probe only. Every provider request is hard-wired to
 * X-Sib-Sandbox: drop and a reserved .invalid recipient. No email delivery,
 * account token, recovery mutation, schedule, schema or production operation. */
async function uadavBrevoSandboxRoute(request, env) {
  const url = new URL(request.url), origin = request.headers.get('Origin');
  const site = 'https://uadav-api-staging.uadavstream.workers.dev';
  const allowed = [site];
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    Pragma: 'no-cache', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin',
    ...(origin && allowed.includes(origin) ? {'Access-Control-Allow-Origin': origin} : {})};
  const reply = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {status, headers: {...headers, ...extra}});
  const base = {scope: 'brevo-sandbox-staging', build: BUILD, sandbox: true, emails_sent: 0, delivery_verified: false, recovery_enabled: false};
  const providerCodes = new Set(['MAIL_RESPONSE', 'MAIL_REDIRECT', 'MAIL_RATE_LIMIT', 'MAIL_QUOTA', 'MAIL_CONFIGURATION', 'MAIL_UNAVAILABLE', 'MAIL_DELIVERY_UNCONFIRMED', 'MAIL_REJECTED', 'MAIL_RECEIPT', 'MAIL_TIMEOUT', 'MAIL_CANCELLED']);
  const fail = (code, error, status = 503, extra = {}) => reply({...base, result: 'error', code, error}, status, extra);
  if (url.pathname === '/qa/correo') {
    if (url.origin !== site) return fail('BREVO_STAGING_ONLY', 'Esta prueba solo está disponible en staging.', 403);
    if (request.method !== 'GET') return fail('BREVO_METHOD', 'Abrí la página de prueba.', 405);
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
    return new Response(UADAV_BREVO_PROBE_HTML.replaceAll('%%NONCE%%', nonce), {headers: {...headers,
      'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow',
      'Content-Security-Policy': "default-src 'none'; script-src 'nonce-" + nonce + "'; style-src 'nonce-" + nonce + "'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"}});
  }
  // Authenticate before touching the provider secret, D1 or other bindings.
  const admin = String(env.ADMIN_KEY || '').trim();
  if (!admin || request.headers.get('Authorization') !== 'Bearer ' + admin) return fail('BREVO_AUTH', 'Ingresá con la clave del Centro de Control de staging.', 401);
  if (url.origin !== site) return fail('BREVO_STAGING_ONLY', 'Esta prueba solo está disponible en staging.', 403);
  if (origin && !allowed.includes(origin)) return fail('BREVO_ORIGIN', 'Abrí la prueba desde el sitio de staging.', 403);
  if (!['GET', 'POST'].includes(request.method)) return fail('BREVO_METHOD', 'Método no permitido.', 405, {'Allow': 'GET,POST'});
  if (env.JOB_STORE_MAINTENANCE === 'true') return fail('BREVO_MAINTENANCE', 'Staging está en mantenimiento.', 423);
  let input;
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
  if (request.method === 'POST') {
    if (url.search || !/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return fail('BREVO_INPUT', 'Solicitud de prueba inválida.', 400);
    try { input = await uadavSecurityJSON(request, 256); } catch { return fail('BREVO_INPUT', 'Solicitud de prueba inválida o demasiado grande.', 400); }
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).length !== 2 || !uuid.test(input.request_id || '') || input.confirm !== 'BREVO_SANDBOX_STAGING') return fail('BREVO_INPUT', 'Confirmá la prueba desde su botón.', 400);
  } else if ([...url.searchParams.keys()].some(key => key !== 'request_id') || url.searchParams.getAll('request_id').length > 1 ||
    url.searchParams.has('request_id') && !uuid.test(url.searchParams.get('request_id'))) return fail('BREVO_INPUT', 'Referencia de prueba inválida.', 400);
  const apiKey = env.BREVO_API_KEY;
  const keyPresent = typeof apiKey === 'string' && /^[A-Za-z0-9._-]{32,512}$/.test(apiKey);
  if (!keyPresent) return request.method === 'GET' ? reply({...base, result: 'status', ready: false, api_key_present: false, remaining_today: 0}) : fail('BREVO_KEY_MISSING', 'No detectamos BREVO_API_KEY como secreto válido en este Worker.');
  if (env.JOB_STORE_D1 !== 'true' || !env.DB) return fail('BREVO_STORAGE', 'La prueba requiere la base D1 de staging ya preparada.');
  const now = Date.now(), day = uadavJobToday(now), rateKey = 'brevo:sandbox:daily', prefix = 'brevo:sandbox:request:';
  let db;
  const read = async key => {
    const row = await db.prepare('SELECT value FROM job_store_meta WHERE key=?').bind(key).first();
    return row ? JSON.parse(row.value) : null;
  };
  function record(raw) {
    if (!raw || raw.version !== 1 || !uuid.test(raw.request_id || '') || !['pending', 'accepted', 'unconfirmed'].includes(raw.state) ||
      !Number.isSafeInteger(raw.created_at) || raw.created_at <= 0 || typeof raw.owner !== 'string' || !uuid.test(raw.owner)) throw Error('invalid_probe_record');
    if (raw.state !== 'pending' && (!Number.isSafeInteger(raw.completed_at) || raw.completed_at < raw.created_at)) throw Error('invalid_probe_record');
    if (raw.state === 'accepted' && !/^brevo:[a-f0-9]{64}$/.test(raw.receipt || '')) throw Error('invalid_probe_record');
    if (raw.code !== undefined && !providerCodes.has(raw.code)) throw Error('invalid_probe_record');
    return raw;
  }
  function count(raw) {
    if (!raw) return 0;
    if (raw.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(raw.day || '') || raw.day > day || !Number.isInteger(raw.count) || raw.count < 1 || raw.count > 5 || !uuid.test(raw.request_id || '') || !uuid.test(raw.owner || '')) throw Error('invalid_probe_rate');
    return raw.day === day ? raw.count : 0;
  }
  function result(raw, remaining) {
    const r = record(raw);
    return {...base, result: r.state, request_id: r.request_id, remaining_today: remaining,
      checked_at: r.completed_at ? new Date(r.completed_at).toISOString() : null, ...(r.code ? {code: r.code} : {}),
      ...(r.state === 'pending' && now - r.created_at > 30000 ? {interrupted: true} : {})};
  }
  try {
    db = uadavJobDB(env);
    const ready = await db.prepare("SELECT value FROM job_store_meta WHERE key='migration_ready'").first();
    if (ready?.value !== 'true') return fail('BREVO_STORAGE', 'Primero debe estar preparada la base D1 de staging.');
    const remaining = 5 - count(await read(rateKey));
    const requestId = request.method === 'POST' ? input.request_id : url.searchParams.get('request_id');
    if (requestId) {
      const prior = await read(prefix + requestId);
      if (prior) return reply(result(prior, remaining), prior.state === 'pending' ? 202 : 200);
      if (request.method === 'GET') return fail('BREVO_NOT_FOUND', 'No se encontró esa comprobación.', 404);
    }
    if (request.method === 'GET') return reply({...base, result: 'status', ready: true, api_key_present: true, remaining_today: remaining});
    if (remaining === 0) return fail('BREVO_LIMIT', 'Ya se usaron las cinco comprobaciones de hoy. Podés volver a consultar sus resultados.', 429);
    const owner = crypto.randomUUID(), key = prefix + requestId;
    const pending = {version: 1, request_id: requestId, owner, state: 'pending', created_at: now};
    const rate = {version: 1, day, count: 1, request_id: requestId, owner};
    const writes = [
      db.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=json_set(excluded.value,\'$.count\',CASE WHEN json_extract(job_store_meta.value,\'$.day\')<? THEN 1 ELSE json_extract(job_store_meta.value,\'$.count\')+1 END) WHERE json_extract(job_store_meta.value,\'$.version\')=1 AND json_type(job_store_meta.value,\'$.count\')=\'integer\' AND json_extract(job_store_meta.value,\'$.count\') BETWEEN 1 AND 5 AND (json_extract(job_store_meta.value,\'$.day\')<? OR (json_extract(job_store_meta.value,\'$.day\')=? AND json_extract(job_store_meta.value,\'$.count\')<5))').bind(rateKey, JSON.stringify(rate), day, day, day),
      ...uadavJobGuard(db, "EXISTS(SELECT 1 FROM job_store_meta WHERE key=? AND json_extract(value,'$.request_id')=? AND json_extract(value,'$.owner')=? AND json_extract(value,'$.count') BETWEEN 1 AND 5)", [rateKey, requestId, owner]),
      db.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?)').bind(key, JSON.stringify(pending)),
      db.prepare("DELETE FROM job_store_meta WHERE substr(key,1,?)=? AND CASE WHEN json_valid(value) THEN json_extract(value,'$.created_at')<? ELSE 0 END").bind(prefix.length, prefix, now - 7 * 86400000),
    ];
    try { await db.batch(writes); } catch {
      // A lost reservation acknowledgement never authorizes another send.
      const saved = await read(key);
      if (saved) return reply(result(saved, 5 - count(await read(rateKey))), 202);
      if (count(await read(rateKey)) >= 5) return fail('BREVO_LIMIT', 'Ya se usaron las cinco comprobaciones de hoy.', 429);
      return fail('BREVO_STORAGE', 'No se confirmó la preparación de la prueba. No se contactó a Brevo.');
    }
    let receipt, providerCode;
    try {
      receipt = await uadavBrevoRequest({mode: 'staging-only', apiKey, body: JSON.stringify({
        sender: {name: 'UADAV STREAM · pruebas', email: 'acceso@correo-staging.uadavstream.com.ar'},
        to: [{email: 'uadav-sandbox@example.invalid'}],
        headers: {'X-Sib-Sandbox': 'drop', idempotencyKey: requestId},
        subject: 'UADAV STREAM · comprobación sin entrega',
        textContent: 'Prueba técnica de conexión de staging. Este mensaje no debe entregarse.',
      })});
    } catch (error) { providerCode = error.code; }
    const finished = { ...pending, state: receipt ? 'accepted' : 'unconfirmed', completed_at: Date.now(), ...(receipt ? {receipt: receipt.id} : {}), ...(providerCode ? {code: providerCodes.has(providerCode) ? providerCode : 'MAIL_UNAVAILABLE'} : {})};
    const update = db.prepare("UPDATE job_store_meta SET value=? WHERE key=? AND json_extract(value,'$.owner')=? AND json_extract(value,'$.state')='pending'").bind(JSON.stringify(finished), key, owner);
    try {
      const saved = await update.run();
      if (saved.meta?.changes !== 1) throw Error('probe_commit_not_confirmed');
    } catch {
      const saved = await read(key);
      if (saved && record(saved).state === finished.state && saved.owner === owner && (receipt ? saved.receipt === receipt.id : true)) return reply(result(saved, 5 - count(await read(rateKey))));
      return fail('BREVO_STORAGE', 'Brevo pudo responder, pero no se confirmó el registro. Consultá el resultado antes de iniciar otra prueba.');
    }
    return reply(result(finished, 5 - count(await read(rateKey))));
  } catch { return fail('BREVO_STORAGE', 'No se pudo comprobar el estado de la prueba. No se habilitó el correo.'); }
}
