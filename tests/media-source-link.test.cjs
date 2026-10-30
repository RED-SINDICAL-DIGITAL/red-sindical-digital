const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync('app.html','utf8');
test('shell never creates an external fallback and removes a stale link',()=>{
let removed=0;const context={$:()=>({remove(){removed++}})};vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('function syncMediaSource('),html.indexOf('// YouTube iframe API'))+';this.sync=syncMediaSource',context);
context.sync({external_id:'IBnshjEceKA'});context.sync(null);assert.equal(removed,2);
assert.doesNotMatch(html,/Abrir en YouTube|abrirlo en YouTube/);
});
test('active video and playlist errors offer recovery inside the app without outbound links',()=>{
for(const file of ['uadav-video-feedback-v151.js','uadav-playlist-player-v136.js']){
const source=fs.readFileSync(file,'utf8');assert.doesNotMatch(source,/Abrir en YouTube|abrir YouTube|abrilo en YouTube|createElement\('a'\)/);
assert.match(source,/Reintentar/);
}
});
