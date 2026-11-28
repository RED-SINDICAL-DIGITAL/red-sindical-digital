const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const app=readFileSync(join(__dirname,'..','app.html'),'utf8');
const library=readFileSync(join(__dirname,'..','biblioteca.html'),'utf8');
const sync=readFileSync(join(__dirname,'..','uadav-account-sync.js'),'utf8');
test('existing recent history key remains synced and progress remains in the existing collection',()=>{
 assert.match(app,/RECENT_KEY='uadav_recent_v11'/);
 assert.match(sync,/'uadav_recent_v11'/);
 assert.match(app,/function saveHistoryProgress\(force=false\)/);
 assert.match(app,/resume_seconds:seconds/);
 assert.match(app,/window\.dispatchEvent\(new CustomEvent\('uadav:local-change'\)\)/);
});
test('progress is bounded and only saved for playable YouTube IDs',()=>{
 assert.match(app,/!yid\(currentMedia\)/);
 assert.match(app,/seconds<10\|\|seconds>86400/);
 assert.match(app,/Date\.now\(\)-lastHistoryProgressSave<15000/);
 assert.match(app,/saveHistoryProgress\(true\);saveMediaForReload\(\)/);
});
test('library explicit continue action resumes at saved seconds and preserves normal play',()=>{
 assert.match(library,/▶ Continuar/);
 assert.match(library,/__uadavStartSeconds:Math\.min\(86400/);
 assert.match(library,/▶ Reproducir/);
});
test('inline scripts parse',()=>{
 for(const html of [app,library])for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
