const test=require('node:test'),assert=require('node:assert/strict');
const home=require('../uadav-home-sections.js'),picker=require('../uadav-section-picker.js');
const rows=[{id:'A',title:'Video',url:'https://www.youtube.com/watch?v=IBnshjEceKA',tipo:'video'},{id:'B',title:'Playlist',url:'https://www.youtube.com/playlist?list=PLnkpkdx4rUkYaNqdWDxsH9g2IGxeUGj2M',tipo:'playlist'},{id:'hidden',url:'https://example.test/private',visible:false}];
test('sections resolve only current public catalog records, preserving selected order',()=>{
assert.deepEqual(home.resolveItems(['B','hidden','missing','A','B'],rows,24).map(x=>x.id),['B','A']);
});
test('stale inline copies cannot republish hidden or absent catalog content',()=>{
assert.deepEqual(home.resolveItems([{id:'hidden',url:'https://example.test/private',visible:true},{id:'deleted',url:'https://example.test/deleted'}],rows,24),[]);
});
test('public sections reject credential URLs and unsafe schemes',()=>{
assert.deepEqual(home.resolveItems(['bad','auth'],[{id:'bad',url:'javascript:alert(1)'},{id:'auth',url:'https://name:secret@example.test/'}],24),[]);
});
test('section visibility and item limits are respected, unsupported modes are not falsely rendered',()=>{
const sections=[{id:'ok',items:['A','B'],max_items:1},{id:'hidden',activa:false,items:['A']},{id:'auto',modo:'auto',items:['A']},{id:'empty',items:['missing']}];
const result=home.models(sections,rows);assert.equal(result.length,1);assert.equal(result[0].items.length,1);assert.equal(result[0].id,'ok');
});
test('section picker preserves unknown legacy references when adding and reordering',()=>{
const original=[{id:'legacy',title:'Before'},'A'];const next=picker.toggle(original,'B',true);assert.deepEqual(next,[original[0],'A','B']);assert.deepEqual(original,[{id:'legacy',title:'Before'},'A']);assert.deepEqual(picker.move(next,2,-1),[original[0],'B','A']);
});
test('section picker removes duplicate selections without dropping unrelated references',()=>{
assert.deepEqual(picker.toggle(['A','A','B'],'A',false),['B']);assert.deepEqual(picker.toggle(['A','B'],'A',true),['A','B']);assert.throws(()=>picker.parse('{}'));assert.throws(()=>picker.parse('bad'));
});
