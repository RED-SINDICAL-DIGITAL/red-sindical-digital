#!/usr/bin/env node
// Guardrail: direct artist self-registration stays automatic; legacy reviews remain separate.
// Static test does not replace an API/browser integration test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const admin=readFileSync(new URL('../admin.html',import.meta.url),'utf8');
const route=worker.slice(worker.indexOf("if(path==='/api/artista/claim' && request.method==='POST')"));
assert.ok(route.startsWith("if(path==='/api/artista/claim'"),'Artist claim route missing');
const direct=route.slice(route.indexOf("if(b.new_profile===true&&!artistId)"),route.indexOf("const signature=Array.from"));
assert.ok(direct.includes("if(accountId)"),'Self-registration must be tied to authenticated account');
assert.ok(direct.includes("status:'publicado'"),'Direct registration must publish immediately');
assert.ok(direct.includes("visible:true"),'Direct registration must be visible');
assert.ok(direct.includes("'self_registration'"),'Direct owner must be self-registered');
assert.ok(direct.includes("const conflict=()=>"),'Existing artist conflict must be handled');
assert.ok(route.includes("registration_pending:true"),'Historical manual requests must remain available');
assert.ok(admin.includes("Los perfiles nuevos creados desde una cuenta ingresan directamente al catálogo"),'Admin must explain direct publication');
assert.ok(admin.includes("Aprobar solicitud anterior"),'Old requests must be differentiated');
assert.ok(admin.includes("'Resuelta'"),'Resolved previous requests must not offer approve again');
console.log('OK: alta directa conservada y revisión histórica diferenciada.');
