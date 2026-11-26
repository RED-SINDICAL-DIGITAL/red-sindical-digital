const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','admin.html'),'utf8');
const navStart=html.indexOf('const NAV=['),navEnd=html.indexOf('\nconst TITLES=',navStart);
const renderStart=html.indexOf('function renderNav(){'),renderEnd=html.indexOf('\nfunction toggleSidebar(',renderStart);
assert(navStart>=0&&navEnd>navStart);
assert(renderStart>=0&&renderEnd>renderStart);
const navSource=html.slice(navStart,navEnd),renderSource=html.slice(renderStart,renderEnd);
function runNavigation({query='',view='dashboard',modules={}}={}){
 const nav={innerHTML:'',querySelectorAll:()=>[]},input={value:query};
 const ctx={S:{view},effectiveModules:()=>modules,$:id=>id==='navFilter'?input:nav,go:()=>{},Set,Array,Object,String};
 vm.runInNewContext(navSource+'\n'+renderSource+'\nrenderNav();',ctx,{timeout:1000});
 return (nav.innerHTML.match(/data-view="[^"]+"/g)||[]).map(x=>x.slice(11,-1));
}
test('every enabled admin operation appears exactly once in daily or advanced navigation',()=>{
 const ids=runNavigation();
 assert.equal(ids.length,new Set(ids).size);
 for(const expected of ['dashboard','pending','requests','artists','accounts','contacts','jobs','events','radios','ads','monetization','audit','diagnostics','imports','system','manuals'])assert.ok(ids.includes(expected),expected);
 assert.match(renderSource,/USO DIARIO/);
 assert.match(renderSource,/aria-current="page"/);
});
test('search still finds advanced tools without permanent daily shortcut duplication',()=>{
 const ids=runNavigation({query:'respaldo'});
 assert.deepEqual(ids,['audit']);
 assert.deepEqual(runNavigation({query:'diagnostico'}),['diagnostics']);
 assert.deepEqual(runNavigation({query:'cartelera'}),['events']);
});
test('admin navigation continues to respect feature flags and preserve unrelated tools',()=>{
 const ids=runNavigation({modules:{radio:false,events:false,jobs:false,artists:false}});
 for(const hidden of ['radios','events','jobs','work','artists'])assert.ok(!ids.includes(hidden),hidden);
 for(const keep of ['dashboard','pending','system','audit','imports','accounts'])assert.ok(ids.includes(keep),keep);
});
