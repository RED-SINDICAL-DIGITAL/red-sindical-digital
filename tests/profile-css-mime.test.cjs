const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'..','usuario.html'),'utf8');
const sources=['uadav-ui-tokens-v2.css','uadav-ui-components-v2.css','uadav-profile-home-v2.css'];
test('all three critical profile design styles are embedded with byte-identical source',()=>{
 for(const file of sources){
  const css=readFileSync(join(__dirname,'..','design',file),'utf8');
  assert(html.includes('<style data-uadav-inline-source="'+file+'">\n'+css+'\n</style>'),'embedded missing '+file);
  assert(!html.includes('href="/design/'+file),'broken CSS link remains '+file);
 }
});
test('native layout also remains embedded and profile routes retain account recovery',()=>{
 assert.match(html,/<style id="profileNativeInlineCSS">/);
 assert.match(html,/<script id="profileNativeInlineJS">/);
 assert.match(html,/data-ui-revision="profile-native-v4-inline-styles"/);
 for(const id of ['profileNativeHome','profileTasks','recent','mi-artista','mis-trabajos','profileSettings','recoverAccount']){
  assert(html.includes('id="'+id+'"'),id);
 }
});
test('embedded style elements close correctly and do not contain malformed URL references',()=>{
 assert.equal((html.match(/<style\b/g)||[]).length,(html.match(/<\/style>/g)||[]).length);
 assert.doesNotMatch(html,/<link[^>]+href="\/design\/[^"]+\.css/);
});
