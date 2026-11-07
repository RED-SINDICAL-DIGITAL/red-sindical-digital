import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');

// Read-only contract checks. No network requests or production writes.
test('Bolsa loads shared API configuration before inline application code', () => {
  const html = read('bolsa-trabajo.html');
  assert.ok(html.includes('<script src="/uadav-api-config.js"></script>'));
  assert.ok(html.includes('window.PLATFORM_API_BASE||window.UADAV_API_BASE'));
  assert.ok(!html.includes("const API_REMOTE='https://uadav-api-staging.uadavstream.workers.dev/api/'"));
});

test('Bolsa keeps idempotent publication and application tracking', () => {
  const html = read('bolsa-trabajo.html');
  assert.match(html, /request_id:publishRequestId/);
  assert.match(html, /applicationRequestId/);
  assert.match(html, /apiFetch\('bolsa_trabajo',\{method:'POST'/);
  assert.match(html, /applyConsent/);
});

test('Bolsa request cancellation and timeout release listeners', () => {
  const html = read('bolsa-trabajo.html');
  assert.match(html, /setTimeout\(cancel,10000\)/);
  assert.match(html, /opt\.signal\.addEventListener\('abort',cancel,\{once:true\}\)/);
  assert.match(html, /opt\.signal\?\.removeEventListener\('abort',cancel\)/);
  assert.match(html, /clearTimeout\(timer\)/);
});

test('Commercial inquiry preserves unique references and opt-in consent', () => {
  const js = read('consultar-publicidad.js');
  const html = read('consultar-publicidad.html');
  assert.match(js, /request_id:attempt\.id/);
  assert.match(js, /attempt\.snapshot!==snapshot/);
  assert.match(js, /data\?\.success===false/);
  assert.match(js, /clearTimeout\(timer\)/);
  assert.match(html, /name="consent"[^>]*required/);
});

test('Commercial requests are not silently retried or auto-activated', () => {
  const js = read('consultar-publicidad.js');
  assert.doesNotMatch(js, /setInterval\s*\(/);
  assert.match(js, /advertising\/inquiries\/capabilities/);
  assert.match(js, /advertising\/inquiries'/);
});
