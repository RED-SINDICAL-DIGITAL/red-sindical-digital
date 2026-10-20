// node --test scripts/test-radio-studio-hardening.mjs
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const studio=readFileSync(new URL('../radio-studio.html',import.meta.url),'utf8');
const inline=[...studio.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
test('radio studio inline scripts parse',()=>{assert.ok(inline.length>=1);for(const s of inline)new Function(s)});
test('operator access is checked against active grant',()=>{assert.match(worker,/radio_operators WHERE radio_id=\? AND account_id=\? AND status='active'/)});
test('station moderation query is scoped in SQL',()=>{assert.match(worker,/json_extract\(payload_json,'\$\.radio_id'\)=\?/);assert.match(worker,/json_extract\(payload_json,'\$\.id_stream'\)=\?/)});
test('settings require active operator permission and mode whitelist',()=>{assert.match(worker,/\['manual','automatic','paused'\]\.includes\(mode\)/);assert.match(worker,/radio_moderation_settings/);assert.match(worker,/WHERE EXISTS\(SELECT 1 FROM radio_operators/)});
test('automatic publication checks current station mode in publishing lock',()=>{assert.match(worker,/status='publishing' WHERE id=\? AND status='pending' AND EXISTS\(SELECT 1 FROM radio_moderation_settings WHERE radio_id=\? AND mode='automatic'\)/)});
test('operator inbox does not accept unscoped arbitrary moderation IDs',()=>{assert.match(worker,/!belongs\(row\)/);assert.match(worker,/Solicitud no disponible para esta emisora/)});
test('moderation cursor and return controls are present',()=>{assert.match(worker,/next_cursor/);assert.match(studio,/moderationMore/);assert.match(studio,/moderationCursor/)});
test('automatic moderation fails closed when D1 is unavailable',()=>{assert.match(worker,/stationScope&&!hasD1\(\)/)});
test('request final states and transitions enforced in D1',()=>{assert.match(worker,/status='pending' AND \? IN \('queued','played','rejected'\)/);assert.match(worker,/status='queued' AND \? IN \('played','rejected'\)/)});
test('staging hostname switches to staging API',()=>{assert.match(studio,/uadav-stream-staging\\.pages\\.dev/);assert.match(studio,/uadav-api-staging/)})
