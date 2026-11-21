const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const email=readFileSync(join(__dirname,'..','uadav-profile-email.js'),'utf8');

test('primary actions have consistent local SVG icons and preserve navigation',()=>{
 const first=html.split('id="profileTasks"')[1].split('</section>')[0];
 assert.equal((first.match(/class="profile-task"/g)||[]).length,4);
 assert.equal((first.match(/<svg class="profile-icon"/g)||[]).length,10);
 for(const id of ['pi-work','pi-artist','pi-library','pi-calendar','pi-plus','pi-explore','pi-settings','pi-help','pi-edit']){
   assert(html.includes('id="'+id+'"'),id);
   assert(first.includes('href="#'+id+'"')||first.includes('href="/usuario.html?vista=trabajos"')||first.includes('href="/biblioteca.html"'));
 }
 for(const link of ['href="/usuario.html?vista=trabajos"','href="/usuario.html?vista=artista"','href="/biblioteca.html"','href="/usuario.html?vista=eventos"','href="/usuario.html?vista=cuenta"','href="/publicar-evento.html"'])assert(first.includes(link),link);
 assert(!first.includes('data-symbol='));
});
test('continue-watching precedes lower priority editing panels and preserves the player',()=>{
 const tasks=html.indexOf('id="profileTasks"'),recent=html.indexOf('id="recent" class="rail"'),jobs=html.indexOf('id="mis-trabajos"'),artist=html.indexOf('id="mi-artista"');
 assert(tasks<recent&&recent<jobs&&jobs<artist);
 assert.match(html,/el\.onclick=\(\)=>openRecent\(a\[Number\(el\.dataset\.i\)\]\)/);
 assert.match(html,/scroll-snap-type:x proximity/);
});
test('redundant library links are optional rather than a second always-visible card',()=>{
 assert.match(html,/<details class="panel profile-library-details"><summary>Tu biblioteca/);
 assert.match(html,/id="librarySummary"/);
 assert.match(html,/href="\/biblioteca\.html\?tab=playlists"/);
});
test('account recovery moves under security settings and keeps mail access',()=>{
 assert.match(email,/document\.querySelector\('#profileSettings \.settings-grid'\)/);
 assert.match(email,/settings\.prepend\(panel\)/);
 assert.match(email,/fetch\('https:\/\/uadav-api-staging\.uadavstream\.workers\.dev\/api\/access\/email\/status'/);
 assert.match(email,/link\.href='\/entrar-correo\.html'/);
 assert.match(html,/id="profileSettings"/);
});
test('duplicate legacy profile design layers are replaced by one coherent stylesheet',()=>{
 assert.doesNotMatch(html,/\/\* Mi Perfil · beta sencilla:/);
 assert.doesNotMatch(html,/\/\* Perfil 2026 · identidad editorial/);
 assert.equal((html.match(/\/\* Mi Perfil · estilo app de música/g)||[]).length,1);
});
test('inline JavaScript continues to parse and private account controls remain available',()=>{
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 for(const id of ['profileForm','photo','avatar','createAccount','showRecovery','recoverAccount','accountDevices','profileJobLookup','profileJobImportBtn','recentStatus','deleteAccount'])assert(html.includes('id="'+id+'"'),id);
});
