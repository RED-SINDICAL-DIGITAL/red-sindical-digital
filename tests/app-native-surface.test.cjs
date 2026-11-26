const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const app=readFileSync(join(__dirname,'..','app.html'),'utf8');
const css=readFileSync(join(__dirname,'..','uadav-app-surface-v1.css'),'utf8');
test('final app layer loads after prior player styles without moving native controls',()=>{
 const layout=app.indexOf('/uadav-playback-layout.css');
 const surface=app.indexOf('/uadav-app-surface-v1.css');
 assert(layout>=0&&surface>layout,'app visual layer must be last');
 for(const id of ['mediaDock','mediaStage','radioDock','radioAudio','favMedia','laterMedia','playlistMedia','openLibrary'])assert(app.includes('id="'+id+'"'),id);
});
test('app visual layer remains scoped and preserves visibility and interaction state',()=>{
 assert.match(css,/body\[data-page="app"\]/);
 assert.doesNotMatch(css,/pointer-events\s*:\s*none|display\s*:\s*none|visibility\s*:\s*hidden|position\s*:\s*fixed/i);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/forced-colors/);
});
test('navigation and email account integrations stay present',()=>{
 for(const script of ['uadav-account-sync.js','uadav-playback-queue.js','uadav-navigation-context-v136.js'])assert(app.includes(script),script);
 assert.match(app,/id="view"/);
 assert.match(app,/id="mobile"/);
});
