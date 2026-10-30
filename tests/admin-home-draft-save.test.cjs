const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('admin.html','utf8');
const capture=html.slice(html.indexOf('function captureHomeFields('),html.indexOf('function renderHome('));
const start=html.indexOf('window.saveHome=async()=>{'),save=html.slice(start,html.indexOf('\n',start));
test('home draft keeps typed fields across section redraws without replacing untouched fields',()=>{
const fields={brandHeroTitle:{value:'  Nuevo título  '},promoDesc:{value:'Texto pendiente'},brandHeroEnabled:{value:'false'}};
const c={S:{cache:{landing:{brand_hero_image:'https://example.test/cover.jpg',hero_spotlights:[{title:'A'}]}}},document:{getElementById:id=>fields[id]}};
vm.runInNewContext(capture,c);c.captureHomeFields();assert.equal(c.S.cache.landing.brand_hero_title,'Nuevo título');assert.equal(c.S.cache.landing.promo_description,'Texto pendiente');assert.equal(c.S.cache.landing.brand_hero_enabled,false);assert.equal(c.S.cache.landing.brand_hero_image,'https://example.test/cover.jpg');
assert.match(html,/function renderHome\(\)\{captureHomeFields\(\)/);
});
function fixture(saveJSON){const button={disabled:false,textContent:'Guardar cambios'},notices=[],c={window:{},S:{cache:{landing:{hero_spotlights:[]},sections:[],visibility:{},layout:{}}},$:()=>button,captureHomeFields(){},arr:x=>Array.isArray(x)?x:[],saveJSON,toast:(...x)=>notices.push(x)};vm.runInNewContext(save,c);return{c,button,notices}}
test('double save cannot create overlapping requests and reenables the button when finished',async()=>{
let release;const gate=new Promise(r=>release=r);let requests=0;const f=fixture(async()=>{requests++;await gate;return{ok:true}});
const first=f.c.window.saveHome();assert.equal(f.button.disabled,true);await f.c.window.saveHome();assert.equal(requests,4);release();await first;assert.equal(f.button.disabled,false);assert.equal(f.c.S.homeSaving,false);assert.equal(f.notices.length,1);assert.equal(f.notices[0][1],'ok');
});
test('partial save failure is reported without a success and remains retryable',async()=>{
let fail=true;const f=fixture(async kind=>kind==='home_layout'&&fail?{success:false}:{ok:true});await f.c.window.saveHome();assert.equal(f.notices[0][1],'bad');assert.match(f.notices[0][0],/Orden/);assert.equal(f.button.disabled,false);fail=false;await f.c.window.saveHome();assert.equal(f.notices[1][1],'ok');
});
