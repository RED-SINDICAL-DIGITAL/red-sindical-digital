const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','biblioteca.html'),'utf8');
const begin=html.indexOf('function emptyLibraryState('),end=html.indexOf('function render(k)',begin);
assert.ok(begin>0&&end>begin);
const make=vm.runInNewContext(html.slice(begin,end)+'\nemptyLibraryState;',{},{timeout:1000});
test('empty collections explain their next action without needing new screens',()=>{
 const cases=[
  ['recent','/descubrir.html'],
  ['favorites','/descubrir.html'],
  ['later','/descubrir.html'],
  ['following','/artistas.html'],
  ['radios','/en-vivo.html#radios']
 ];
 for(const [kind,path] of cases){
  const output=make(kind,false);
  assert.ok(output.includes('data-empty-destination="'+path+'"'),kind);
  assert.match(output,/type="button"/);
  assert.match(output,/<div class="empty">/);
 }
});
test('search with no matching items never suggests switching section or discarding search',()=>{
 for(const kind of ['recent','favorites','later','following','radios','playlists']){
  const output=make(kind,true);
  assert.match(output,/Probá otra palabra o borrá la búsqueda/);
  assert.doesNotMatch(output,/data-empty-destination/);
 }
});
test('playlist empty state keeps create button and does not suggest unnecessary navigation',()=>{
 const output=make('playlists',false);
 assert.match(output,/Crear playlist/);
 assert.doesNotMatch(output,/data-empty-destination/);
 for(const id of ['playlistName','createPlaylist','playlistbar','grid','librarySearch'])assert.ok(html.includes('id="'+id+'"'),id);
});
test('all existing collections, storage keys and account-data refresh remain',()=>{
 for(const k of ['uadav_recent_v11','uadav_favorites_v1','uadav_watch_later_v1','uadav_playlists_v1','uadav_following_v1','uadav_radio_favorites_v1'])assert.ok(html.includes(k),k);
 assert.match(html,/window\.addEventListener\('uadav:account-data',refreshLibrary\)/);
 assert.match(html,/grid'\)\.addEventListener\('click',e=>/);
 for(const k of ['recent','favorites','later','playlists','following','radios'])assert.ok(html.includes('data-kind="'+k+'"'),k);
});
