import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const store = new Map();
const env = {
  ADMIN_KEY: 'test-admin-key',
  UADAV_DB: {
    async get(key) { return store.get(key) ?? null; },
    async put(key, value) { store.set(key, String(value)); },
  },
};
const call = async (path, method='GET', body, authorized=true) => {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (authorized) headers.set('Authorization', 'Bearer test-admin-key');
  const response = await worker.fetch(new Request(`https://api.example${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, {});
  return { status: response.status, body: await response.json() };
};

assert.equal((await call('/api/admin/federated/sources', 'GET', undefined, false)).status, 401);
let result = await call('/api/admin/federated/sources');
assert.equal(result.status, 200);
assert.equal(result.body.length, 4, 'first run seeds starter sources');
const initial = result.body;
assert.equal((await call('/api/admin/federated/sources','PUT',{id:'rosario-cultura',name:'Insegura',kind:'event',url:'http://127.0.0.1'})).status, 400, 'reject insecure/local URL');

// Create a source, then edit its title and place; new sources default to paused.
result = await call('/api/admin/federated/sources','POST',{id:'fuente-nueva',name:'Agenda de prueba',kind:'event',url:'https://agenda.example/eventos',city:'Córdoba',province:'Córdoba'});
assert.equal(result.status, 200);
assert.equal(result.body.item.active, false);
assert.equal(result.body.item.city, 'Córdoba');
result = await call('/api/admin/federated/sources','PUT',{id:'fuente-nueva',name:'Agenda actualizada',kind:'event',url:'https://agenda.example/novedades',city:'Rosario',province:'Santa Fe',active:true});
assert.equal(result.status, 200);
assert.equal(result.body.item.name, 'Agenda actualizada');
assert.equal(result.body.item.active, true);

// Deleting a source clears only its unpublished discovery cache; published content remains.
store.set('federated_source_state', JSON.stringify({
  'rosario-cultura': { candidates:[{titulo:'Pendiente'}] },
  'agenda-cultural-federal': { candidates:[{titulo:'Otra pendiente'}] },
}));
store.set('cartelera_aprobada', JSON.stringify([{id:'EVT-PUBLISHED',titulo:'Evento publicado'}]));
store.set('bolsa_trabajo', JSON.stringify([{id:'JOB-PUBLISHED',titulo:'Trabajo publicado'}]));
assert.equal((await call('/api/admin/federated/sources','DELETE',{id:'rosario-cultura'},false)).status, 401);
result = await call('/api/admin/federated/sources','DELETE',{id:'rosario-cultura'});
assert.equal(result.status, 200);
assert.equal(result.body.published_items_preserved, true);
assert.deepEqual(JSON.parse(store.get('federated_source_state')), {'agenda-cultural-federal':{candidates:[{titulo:'Otra pendiente'}]}});
assert.equal(JSON.parse(store.get('cartelera_aprobada'))[0].id,'EVT-PUBLISHED');
assert.equal(JSON.parse(store.get('bolsa_trabajo'))[0].id,'JOB-PUBLISHED');

// Removing every source stays removed across GETs: no automatic reseed.
for (const item of [...JSON.parse(store.get('federated_sources'))]) await call('/api/admin/federated/sources','DELETE',{id:item.id});
assert.deepEqual((await call('/api/admin/federated/sources')).body, []);
assert.deepEqual((await call('/api/admin/federated/source-status')).body, []);
result = await call('/api/admin/federated/sources','POST',{id:'nueva-manual',name:'Mi fuente',kind:'job',url:'https://productora.example/castings'});
assert.equal(result.status,200);
assert.equal(result.body.item.active,false);
assert.equal((await call('/api/admin/federated/sources')).body.length,1);

// Admin page script remains parseable after adding edit/delete/review controls.
const admin = await readFile(new URL('../admin.html', import.meta.url), 'utf8');
for (const match of admin.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new (await import('node:vm')).Script(match[1]);
console.log('PASS: sources can be edited, added, activated, and deleted; deleting all is permanent; published listings remain; source URLs are validated.');
