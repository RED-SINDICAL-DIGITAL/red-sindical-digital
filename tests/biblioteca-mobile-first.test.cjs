const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','biblioteca.html'),'utf8');
test('library has concise mobile-first presentation with six usable scrollable tabs',()=>{
 assert.match(html,/<style id="uadav-library-mobile-v2">/);
 assert.match(html,/role="group" aria-label="Secciones de Mi biblioteca"/);
 assert.match(html,/\.tabs\{display:flex;flex-wrap:nowrap!important;overflow-x:auto!important/);
 assert.match(html,/\.grid\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
 for(const kind of ['recent','favorites','later','playlists','following','radios'])assert(html.includes('data-kind="'+kind+'"'),kind);
});
test('library keeps actual local storage keys, syncing, playlists and personal media player',()=>{
 for(const id of ['personalMediaSection','personalMediaFiles','personalMediaPlayer','personalMediaList','librarySearch','libraryStatus','playlistbar','createPlaylist','grid'])assert(html.includes('id="'+id+'"'),id);
 for(const key of ['uadav_recent_v11','uadav_favorites_v1','uadav_watch_later_v1','uadav_playlists_v1','uadav_following_v1','uadav_radio_favorites_v1'])assert(html.includes(key),key);
 assert.match(html,/window\.addEventListener\('uadav:account-data',refreshLibrary\)/);
 assert.match(html,/const initialParams=new URLSearchParams\(location\.search\)/);
 assert.match(html,/initialTab=Object\.prototype\.hasOwnProperty\.call\(KEYS,initialParams\.get\('tab'\)\)/);
});
test('library is responsive and visible to keyboard and motion-sensitive users',()=>{
 assert.match(html,/@media\(min-width:760px\)/);
 assert.match(html,/@media\(min-width:1120px\)/);
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/:focus-visible\{outline:3px solid #83e1ff/);
});
test('all inline JS scripts parse',()=>{
 for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
});
