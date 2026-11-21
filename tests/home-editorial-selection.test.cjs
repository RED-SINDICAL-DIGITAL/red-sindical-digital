const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index-v117.html','utf8');
const start=html.indexOf('function selectEditorialVideos('),end=html.indexOf('async function loadTrends()',start);
const context={idOf:x=>x.video_id};vm.createContext(context);vm.runInContext(html.slice(start,end)+';this.select=selectEditorialVideos',context);
test('editorial selection excludes hidden, draft, private, malformed and non-video records',()=>{
const rows=[null,{},[],{video_id:'public',title:'Public'},{video_id:'hidden',visible:false},{video_id:'draft',status:'draft'},{video_id:'private',private:true},{video_id:'playlist',tipo:'playlist'},{video_id:'off',activa:false}];
assert.deepEqual(Array.from(context.select(rows),x=>x.video_id),['public']);
});
test('editorial selection preserves order, deduplicates video identity and bounds the rail',()=>{
const rows=[{video_id:'first'},{video_id:'first'},...Array.from({length:20},(_,i)=>({video_id:'v'+i}))];
const result=Array.from(context.select(rows),x=>x.video_id);assert.equal(result.length,14);assert.equal(result[0],'first');assert.equal(new Set(result).size,14);
});
