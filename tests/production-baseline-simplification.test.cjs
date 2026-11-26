const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const modulePolicy=require('../uadav-module-policy.js');
const file=path=>readFileSync(join(__dirname,'..',path),'utf8');
test('a simple profile has one primary library entry and no misleading optional podcast shortcut',()=>{
 const html=file('usuario.html');
 const first=html.split('id="profileTasks"')[1]?.split('</section>')[0]||'';
 assert.equal((first.match(/class="profile-task"/g)||[]).length,4);
 assert.ok(first.includes('href="/biblioteca.html"'));
 assert.match(html,/id="librarySummary"/);
 assert.doesNotMatch(html,/<a class="chip" href="\/podcasts\.html">Podcasts · Audio y video<\/a>/);
});
test('removed optional shortcut does not delete features or admin control',()=>{
 const home=file('index-v117.html'),admin=file('admin.html');
 assert.match(home,/data-home-nav="\/podcasts\.html" data-module="podcasts"/);
 assert.match(admin,/\['podcasts','◉','Podcasts'\]/);
 assert.equal(modulePolicy.required('/podcasts.html').includes('podcasts'),true);
 assert.equal(modulePolicy.disabled('/podcasts.html',{podcasts:false}),'podcasts');
});
test('retired commercial membership remains disabled and ticketing defaults off',()=>{
 assert.equal(modulePolicy.flags({pro:true}).pro,false);
 assert.equal(modulePolicy.defaults.ticketing,false);
 assert.equal(modulePolicy.defaults.marketplace,true);
 for(const route of ['/usuario.html','/artistas.html','/cartelera.html','/bolsa-trabajo.html','/biblioteca.html'])assert.ok(file(route.slice(1)).includes('data-page='),route);
});
test('player, library and security anchors remain intact',()=>{
 const html=file('app.html'),account=file('uadav-account-sync.js');
 for(const id of ['mediaDock','mediaStage','radioDock','radioAudio','favMedia','laterMedia','playlistMedia','openLibrary'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const key of ['uadav_favorites_v1','uadav_watch_later_v1','uadav_playlists_v1','uadav_following_v1','uadav_radio_favorites_v1','uadav_recent_v11'])assert.ok(account.includes(key),key);
});
