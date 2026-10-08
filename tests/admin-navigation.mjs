import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const source=await readFile(new URL('../uadav-admin-v126.js',import.meta.url),'utf8');const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(source,ctx);const next=ctx.window.UADAVAdminLayout.next;
const candidates=[{id:'left',x:20,y:100},{id:'right',x:180,y:100},{id:'below',x:100,y:180},{id:'above',x:100,y:20},{id:'diagonal',x:110,y:400}];
assert.equal(next({x:100,y:100},candidates,'ArrowRight').id,'right');assert.equal(next({x:100,y:100},candidates,'ArrowLeft').id,'left');assert.equal(next({x:100,y:100},candidates,'ArrowDown').id,'below');assert.equal(next({x:100,y:100},candidates,'ArrowUp').id,'above');assert.equal(next({x:100,y:100},[],'ArrowDown'),null);
for(const p of ['admin.html','artista.html','gestionar-artista.html']){const html=await readFile(new URL('../'+p,import.meta.url),'utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1])}
console.log('PASS: directional navigation selects the nearest control, handles boundaries, and preserves valid Admin/profile scripts');
