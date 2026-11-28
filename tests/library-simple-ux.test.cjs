const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','biblioteca.html'),'utf8');
test('simple library preserves six categories and cloud-sync storage identifiers',()=>{
 for(const key of ['recent','favorites','later','playlists','following','radios']){
  assert.match(html,new RegExp('data-kind="'+key+'"'));
  assert.match(html,new RegExp("\\b"+key+":'uadav_"));
 }
 assert.match(html,/window\.addEventListener\('uadav:account-data',refreshLibrary\)/);
 assert.match(html,/uadav:library-change/);
});
test('search is clearable and category-aware without rewriting stored collections',()=>{
 assert.match(html,/id="librarySearchLabel"/);
 assert.match(html,/id="clearLibrarySearch"/);
 assert.match(html,/function updateSearchUI\(k\)/);
 assert.match(html,/function emptyLibraryState\(kind,hasSearch\)/);
 assert.match(html,/clearLibrarySearch'\)\.addEventListener\('click'/);
 assert.match(html,/input\.value=''/);
});
test('library inline scripts parse',()=>{
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
