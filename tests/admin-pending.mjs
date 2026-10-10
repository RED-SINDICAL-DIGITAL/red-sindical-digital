import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const ctx={};
vm.runInNewContext(await readFile(new URL('../uadav-pending-admin-v146.js',import.meta.url),'utf8'),ctx);
const {sources,normalize}=ctx.UADAVPendingAdmin;
for(const s of sources){
  const pending=s.match?{id:'a',destacado_solicitado:true,titulo:'Show'}:{id:'a',status:s.states[0],artist_id:'artist',scope:'profile'};
  const rows=normalize(s,[{id:'old',status:'approved'},pending]);
  assert.equal(rows.length,1);assert.equal(rows[0].key,s.type+':a');
  const r=s.request(rows[0].item);
  if(s.type==='inquiries'){assert.equal(r.body.estado,'cerrada');continue}
  if(s.type==='eventHighlights'){assert.equal(r.path,'eventos');assert.equal(r.method,'PUT');assert.equal(r.body.action,'reject_feature');continue}
  assert.equal(r.body.decision||r.body.status,r.body.decision==='reject'?'reject':'rejected');
}
for(const s of sources.filter(s=>s.states?.length===2&&s.type!=='payments'))assert.equal(normalize(s,[{id:'x',status:s.states[1]}])[0].processing,true);
assert.throws(()=>normalize(sources[0],{}));
const wrapped=normalize(sources[0],{items:[{id:'wrapped',status:'pendiente',nombre:'Consulta'}]});assert.equal(wrapped.length,1);assert.equal(wrapped[0].item.id,'wrapped');
const highlights=sources.find(s=>s.type==='eventHighlights');
assert.equal(normalize(highlights,[{id:'not-highlighted',estado:'published'},{id:'featured',estado:'published',destacado_estado:'pendiente_revision'}]).length,1);
console.log('PASS: completed items excluded, event highlights normalized, processing states protected, correct action contracts');
const api=async path=>{const source=sources.find(x=>x.path===path);if(source.type==='moderation')throw Error('simulated unavailable');if(source.type==='eventHighlights')return[{id:'event-pending',estado:'published',destacado_solicitado:true,titulo:'Show'},{id:'event-published',estado:'published'}];return[{id:source.type+'-pending',status:source.states[0]},{id:source.type+'-done',status:'approved'}]};
const loaded=await ctx.UADAVPendingAdmin.load(api);assert.equal(loaded.rows.length,sources.length-1);assert.equal(loaded.failures.length,1);assert.equal(loaded.failures[0],'Moderación');assert.equal(loaded.counts.payments,1);assert.equal(loaded.counts.eventHighlights,1);assert.equal(loaded.counts.moderation,0);
console.log('PASS: summary loader counts pending highlights and reports failed inboxes');
const admin=await readFile(new URL('../admin.html',import.meta.url),'utf8'),start=admin.indexOf('VIEWS.dashboard=async'),end=admin.indexOf('\n};',start),dashboard=admin.slice(start,end);
assert.ok(dashboard.includes('UADAVPendingAdmin.load(api)'));assert.ok(!dashboard.includes("api('eventos')"));assert.ok(dashboard.includes('pendingSummary.failures'));
console.log('PASS: dashboard uses same pending loader and surfaces incomplete counts');
assert.ok(admin.includes("window.UADAVOpenPendingEventHighlights=()=>{S.eventTab='pending';go('events')};"));assert.ok((await readFile(new URL('../uadav-pending-admin-v146.js',import.meta.url),'utf8')).includes('g.UADAVOpenPendingEventHighlights()'));console.log('PASS: reviewing an event highlight opens the exact Cartelera review tab');
