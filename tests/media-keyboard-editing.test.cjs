const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('app.html','utf8'),start=source.indexOf("window.addEventListener('keydown',e=>{"),script=source.slice(start,source.indexOf('let touchY=0;',start));
function setup(active={},mode='expanded'){let keydown,prevented=0;const changes=[],ctx={window:{addEventListener(type,fn){assert.equal(type,'keydown');keydown=fn}},document:{activeElement:active,querySelectorAll:()=>[]},currentMedia:{id:'test'},media:{classList:{contains:x=>x===mode}},setMediaMode:x=>changes.push(x)};vm.runInNewContext(script,ctx);return{changes,press:(key,extra={})=>keydown({key,preventDefault(){prevented++},...extra}),prevented:()=>prevented,ctx}}
test('editing controls keep arrows and Escape while media is open',()=>{
 for(const active of [{tagName:'INPUT'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{tagName:'DIV',isContentEditable:true}])for(const mode of ['mini','expanded']){const h=setup(active,mode);for(const key of ['ArrowUp','ArrowDown','Escape'])h.press(key);assert.equal(h.changes.length,0);assert.equal(h.prevented(),0)}
});
test('modifier, composition and already handled keys do not trigger player shortcuts',()=>{
 for(const extra of [{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true},{defaultPrevented:true}]){const h=setup({tagName:'BODY'});h.press('ArrowDown',extra);assert.equal(h.changes.length,0);assert.equal(h.prevented(),0)}
});
test('player shortcuts still work outside editing controls',()=>{
 const open=setup({tagName:'BODY'});open.press('ArrowDown');open.press('Escape');assert.deepEqual(open.changes,['mini','mini']);assert.equal(open.prevented(),2);
 const mini=setup({tagName:'BODY'},'mini');mini.press('ArrowUp');assert.deepEqual(mini.changes,['expanded']);
});
test('horizontal navigation keys still move focus between visible section buttons',()=>{
 let focused=false;const first={offsetParent:{}},second={offsetParent:{},focus(){focused=true}},h=setup(first);h.ctx.document.querySelectorAll=()=>[first,second];h.ctx.currentMedia=null;h.press('ArrowRight');assert.equal(focused,true);assert.equal(h.prevented(),1);
});
