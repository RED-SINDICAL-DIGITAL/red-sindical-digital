const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const page=readFileSync('usuario.html','utf8');
const shell=readFileSync('app.html','utf8');
test('native profile visual overrides are scoped to the profile home',()=>{
 assert.match(page,/<style id="beta-profile-visual-20261108">/);
 assert.match(page,/body\[data-page="usuario"\] #profileNativeHome \.profile-empty-recent/);
 assert.match(page,/body\[data-page="usuario"\] #profileNativeHome \.profile-empty-action/);
 assert.match(page,/id="profileNativeHome"/);
 assert.match(page,/id="profileLegacyViews"/);
});
test('profile empty history gives an accessible route to explore content',()=>{
 assert.match(page,/class="empty profile-empty-recent"/);
 assert.match(page,/class="profile-empty-action" href="\/descubrir\.html"/);
 assert.match(page,/Tu próxima reproducción empieza acá/);
});
test('desktop navigation uses four clear destinations and mobile keeps five',()=>{
 const desktop=shell.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/);
 const mobile=shell.match(/<nav id="mobile"[^>]*>([\s\S]*?)<\/nav>/);
 assert(desktop&&mobile,'Both navigation bars must exist');
 assert.deepEqual([...desktop[1].matchAll(/data-route="([^"]+)"/g)].map(m=>m[1]),['/descubrir.html','/en-vivo.html','/cartelera.html','/trabajo.html']);
 assert.deepEqual([...mobile[1].matchAll(/data-route="([^"]+)"/g)].map(m=>m[1]),['/descubrir.html','/en-vivo.html','/cartelera.html','/bolsa-trabajo.html','/usuario.html']);
 assert.match(shell,/id="userBtn"/);
});
