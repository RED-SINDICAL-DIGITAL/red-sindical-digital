#!/usr/bin/env node
// Admin 2.0: validate navigation without needing a browser or API credentials.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const match = source.match(/const NAV=([\s\S]*?);\s*const TITLES=/);
assert.ok(match, 'No se encuentra la navegación principal');
const groups = runInNewContext('('+match[1]+')');
assert.ok(Array.isArray(groups), 'NAV debe ser una lista');
const viewIds = groups.flatMap(group => {
  assert.ok(group.g && Array.isArray(group.items), 'Grupo incompleto');
  return group.items.map(item => item[0]);
});
const expected = [
 'dashboard','pending','requests','announcements','artists','accounts','contacts',
 'producers','jobs','work','events','content','collections','radios','live',
 'playlists','podcasts','media','ads','monetization','commercialRequests',
 'home','siteState','agreements','pages','cct','sources','imports','prospecting',
 'restrictions','moderation','system','audit','diagnostics','manuals'
];
assert.equal(viewIds.length, expected.length, 'Cambió la cantidad de destinos');
assert.equal(new Set(viewIds).size, viewIds.length, 'Hay destinos duplicados');
assert.deepEqual([...viewIds].sort(), [...expected].sort(), 'Falta un destino existente');
for (const label of ['INICIO','PERSONAS Y PERFILES','PUBLICACIONES','CONTENIDOS','COMUNICACIONES']) {
  assert.ok(groups.some(g => g.g === label), 'Falta grupo: '+label);
}
for (const alias of ['accounts:', 'contacts:', 'announcements:', 'moderation:']) {
  assert.ok(source.includes(alias), 'Falta palabra de búsqueda: '+alias);
}
console.log('OK Admin 2.0: '+groups.length+' grupos; '+viewIds.length+' destinos; ninguno perdido ni duplicado.');
