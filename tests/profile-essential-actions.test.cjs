const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
test('four immediately discoverable profile tasks remain',()=>{
 const tasks=html.split('id="profileTasks"')[1].split('</section>')[0];
 assert.match(tasks,/<h2 id="profileTasksTitle">¿Qué querés hacer\?<\/h2>/);
 assert.equal((tasks.match(/class="profile-task"/g)||[]).length,4);
 for(const link of ['/usuario.html?vista=artista','/usuario.html?vista=trabajos','/usuario.html?vista=eventos','/biblioteca.html'])assert.ok(tasks.includes('href="'+link+'"'),link);
 assert.match(tasks,/<details class="profile-more"><summary>Otras acciones<\/summary>/);
 assert.match(tasks,/href="\/radio-studio\.html"/);
 assert.match(tasks,/href="\/usuario\.html\?vista=cuenta"/);
});
test('library has one primary route, with collections under optional details',()=>{
 assert.equal((html.match(/href="\/biblioteca\.html"/g)||[]).length,1);
 assert.match(html,/class="panel profile-library-details"/);
 for(const tab of ['favorites','playlists','following','radios'])assert.ok(html.includes('href="/biblioteca.html?tab='+tab+'"'),tab);
 assert.match(html,/id="librarySummary"/);
});
test('recent history label is accurate and does not change the playback binding',()=>{
 assert.match(html,/<h2 id="continueTitle">Tu historial reciente<\/h2>/);
 assert.match(html,/id="recent" class="rail"/);
 assert.match(html,/id="recentStatus"/);
 assert.match(html,/href="\/biblioteca\.html\?tab=recent"/);
});
test('security and professional task state remain available',()=>{
 for(const id of ['profileSettings','accountAdvanced','accountDevices','syncConflict','profileJobImportBtn','artistAccessRetry','profileOwnedEventEditor','radioStudioEntry','noticePanel'])assert.ok(html.includes('id="'+id+'"'),id);
});
