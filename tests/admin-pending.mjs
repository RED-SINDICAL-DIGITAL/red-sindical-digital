import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const ctx={};vm.runInNewContext(await readFile(new URL('../uadav-pending-admin-v146.js',import.meta.url),'utf8'),ctx);const {sources,normalize}=ctx.UADAVPendingAdmin;
for(const s of sources){const rows=normalize(s,[{id:'old',status:'approved'},{id:'a',status:s.states[0],artist_id:'artist',scope:'profile'}]);assert.equal(rows.length,1);assert.equal(rows[0].key,s.type+':a');const r=s.request(rows[0].item);assert.equal(r.body.decision||r.body.status,'reject'===r.body.decision?'reject':'rejected');}
for(const s of sources.filter(s=>s.states.length===2&&s.type!=='payments'))assert.equal(normalize(s,[{id:'x',status:s.states[1]}])[0].processing,true);
assert.throws(()=>normalize(sources[0],{}));console.log('PASS: completed requests excluded, processing states protected, correct rejection contracts');
