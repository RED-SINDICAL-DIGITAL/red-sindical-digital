const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const read=p=>readFileSync(p,'utf8');
test('public routes share one versioned visual stylesheet',()=>{
 for(const path of ['app.html','usuario.html','index-v117.html','en-vivo.html','cartelera.html','bolsa-trabajo.html','artistas.html','biblioteca.html','radio.html','radio-studio.html','publicar-evento.html']){
  const html=read(path);
  assert.equal((html.match(/href="\/uadav-stream-2026\.css\?v=[^"]+"/g)||[]).length,1,path);
 }
});
test('desktop and mobile reuse the same navigation routes and accessible SVG icons',()=>{
 const html=read('app.html');
 const desktop=html.split('aria-label="Navegación principal"')[1].split('</nav>')[0];
 const mobile=html.split('<nav id="mobile"')[1].split('</nav>')[0];
 for(const route of ['/index-v117.html','en-vivo.html','cartelera.html','bolsa-trabajo.html']){
  assert.ok(desktop.includes(route),route);assert.ok(mobile.includes(route),route);
 }
 assert.equal((desktop.match(/<svg /g)||[]).length,4);
 assert.equal((mobile.match(/<svg /g)||[]).length,5);
});
test('retired profile override is absent and the maintained native CSS is embedded once',()=>{
 const html=read('usuario.html'),css=read('design/uadav-profile-native-v3.css');
 assert.ok(!html.includes('beta-profile-visual-20261108'));
 assert.ok(html.includes(css));
 assert.equal((html.match(/id="profileNativeInlineCSS"/g)||[]).length,1);
});

test("commercial inquiry opts into the common visual system",()=>{assert.match(read("consultar-publicidad.html"),/<body data-page="consultar-publicidad">/)});

test('operator workspace and media catalogs opt into the shared theme',()=>{
 for(const name of ['radio-studio','playlists','podcasts'])assert.ok(read(name+'.html').includes('data-page="'+name+'"'),name);
});

test('artist portal is distinct from the personal account and keeps both existing professional workflows',()=>{
 assert.match(read('app.html'),/class="artist" data-route="\/para-artistas.html"/);
 const portal=read('para-artistas.html');
 for(const href of ['/soy-artista.html','/usuario.html?vista=artista','/usuario.html'])assert.ok(portal.includes('href="'+href+'"'),href);
 assert.match(portal,/cuenta personal/);
});
