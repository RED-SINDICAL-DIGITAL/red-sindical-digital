import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/_middleware.js';
test('Public access ignores retired pause settings and old pause actions are gone', async () => {
  const origin = 'https://uadavstream.com.ar';
  const visit = path => onRequest({request:new Request(origin + path), env:{DEMO_EMERGENCY_PAUSE:'1'}, next:() => new Response('Contenido')});
  assert.equal(await visit('/app.html').text(), 'Contenido');
  assert.equal(visit('/invitacion').headers.get('location'), origin + '/app.html');
  assert.equal(visit('/demo/admin/pausar').status, 410);
});
