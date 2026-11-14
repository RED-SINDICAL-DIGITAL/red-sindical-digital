const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync('admin.html','utf8');
const start=html.indexOf('let moduleSettingsBusy=false;');
const end=html.indexOf('window.saveSystemModules=async()=>',start);
assert(start>0&&end>start,'Podcast button handler must exist');
const code=html.slice(start,end);
function harness({visible=true,allow=true,fail=false,pending=false}={}){
 const cache={config:{branding:{name:'UADAV STREAM'},modules:{podcasts:visible,radio:true,artists:true}}};
 const calls=[];let serverConfig=JSON.parse(JSON.stringify(cache.config));let unblock=()=>{};
 const context={
 S:{cache},
 obj:value=>value&&typeof value==='object'?value:{},
 effectiveModules:cfg=>({podcasts:true,...(cfg?.modules||{})}),
 confirm:()=>allow,
 saveJSON:async(path,data)=>{calls.push({action:'save',path,data});if(fail)throw Error('Fallo local sintético');if(pending)await new Promise(resolve=>{unblock=resolve});serverConfig=JSON.parse(JSON.stringify(data))},
 api:async(path)=>{calls.push({action:'read',path});return serverConfig},
 renderNav:()=>calls.push({action:'nav'}),
 go:async(view)=>calls.push({action:'go',view}),
 toast:message=>calls.push({action:'toast',message})
 };
 context.window=context;
 vm.createContext(context);vm.runInContext(code,context);
 return {click:()=>context.togglePodcastsVisibility(),calls,cache,unblock:()=>unblock()};
}
test('Podcasts is only hidden with explicit Admin confirmation, other modules are untouched',async()=>{
 const x=harness();
 await x.click();
 assert.equal(x.cache.config.modules.podcasts,false);
 assert.equal(x.cache.config.modules.radio,true);
 assert.equal(x.cache.config.modules.artists,true);
 assert.equal(x.calls.filter(c=>c.action==='save').length,1);
 assert.equal(x.calls.find(c=>c.action==='save').path,'config');
});
test('Podcasts can be shown again without modifying catalog',async()=>{
 const x=harness({visible:false});await x.click();
 assert.equal(x.cache.config.modules.podcasts,true);
 assert.equal(x.calls.filter(c=>c.action==='save').length,1);
});
test('cancel does not change any module settings',async()=>{
 const x=harness({allow:false});await x.click();
 assert.equal(x.cache.config.modules.podcasts,true);
 assert.equal(x.calls.filter(c=>c.action==='save').length,0);
});
test('failed save leaves local configuration unchanged and does not claim success',async()=>{
 const x=harness({fail:true});await x.click();
 assert.equal(x.cache.config.modules.podcasts,true);
 assert.equal(x.calls.some(c=>c.action==='toast'&&c.message.startsWith('Podcasts ocultos')),false);
});
test('Admin maintains editable Podcasts section when public module is off',()=>{
 assert.match(html,/podcasts:'Podcast'/);
 const nav=html.slice(html.indexOf('function renderNav(){'),html.indexOf('function toggleSidebar(',html.indexOf('function renderNav(){')));
 const go=html.slice(html.indexOf('async function go(view,'),html.indexOf('window.UADAVOpenPendingEventHighlights',html.indexOf('async function go(view,')));
 assert.doesNotMatch(nav,/podcasts:'podcasts'/);
 assert.doesNotMatch(go,/podcasts:'podcasts'/);
 assert.match(html,/id="podcastsVisibilityToggle"/);
 assert.match(html,/Ocultar no borra episodios, fuentes ni el reproductor/);
});

test('the direct Podcast page obeys its installation-wide visibility policy',()=>{
 const podcastPage=fs.readFileSync('podcasts.html','utf8');
 assert.match(podcastPage,/src="\/uadav-module-policy\.js\?/);
 assert.match(podcastPage,/src="\/platform-brand-runtime\.js\?/);
 const runtime=fs.readFileSync('platform-brand-runtime.js','utf8');
 assert.match(runtime,/"podcasts\.html":\["podcasts"\]/);
 assert.match(runtime,/if\(disabled\(pageKey\(location\.pathname\)\)\)/);
});

test('System opens the same Modules tab it marks selected',()=>{
 assert.match(html,/function renderSystemTab\(mods,d1,h,yt\)\{const tab=S\.systemTab\|\|'modules'/);
 assert.match(html,/\(S\.systemTab\|\|'modules'\)===id/);
});
function moduleSaveHarness({fail=false,serverOverride=null}={}){
 const cache={config:{branding:{name:'UADAV STREAM'},modules:{podcasts:false,radio:true,artists:true}}};
 let server={...cache.config,modules:{...cache.config.modules}};
 const events=[];
 const context={
  S:{cache},window:null,moduleSettingsBusy:false,setModuleSettingsBusy:value=>{context.moduleSettingsBusy=value},
  obj:x=>x&&typeof x==='object'?x:{},
  moduleValues:()=>({podcasts:false,radio:false,artists:true}),
  saveJSON:async(path,data)=>{events.push('write');if(fail)throw Error('Network error');server={...data,modules:serverOverride||{...data.modules}}},
  api:async()=>{events.push('read');return server},
  effectiveModules:c=>({podcasts:true,radio:true,artists:true,...c.modules}),
  renderNav:()=>events.push('nav'),
  toast:message=>events.push(message),
  go:async()=>events.push('go')
 };
 context.window=context;
 const a=html.indexOf('window.saveSystemModules=async()=>'),b=html.indexOf('window.runMaintenance=',a);
 vm.createContext(context);vm.runInContext(html.slice(a,b),context);
 return {save:()=>context.saveSystemModules(),cache,events};
}
test('Admin verifies module settings against the server before claiming success',async()=>{
 const x=moduleSaveHarness();await x.save();
 assert.equal(x.cache.config.modules.radio,false);
 assert(x.events.includes('read'));
 assert(x.events.includes('Módulos de la marca guardados y verificados'));
});
test('Admin refuses to claim success when server retains old module state',async()=>{
 const x=moduleSaveHarness({serverOverride:{podcasts:false,radio:true,artists:true}});await x.save();
 assert.equal(x.cache.config.modules.radio,true);
 assert.equal(x.events.some(t=>t.includes('Módulos de la marca guardados y verificados')),false);
});
test('Admin save failure does not mutate visible cached configuration',async()=>{
 const x=moduleSaveHarness({fail:true});await x.save();
 assert.equal(x.cache.config.modules.radio,true);
 assert.equal(x.events.some(t=>t.includes('Módulos de la marca guardados y verificados')),false);
});

test('rapid double click on Podcasts sends only one write',async()=>{
 const x=harness({pending:true});
 const first=x.click();
 await Promise.resolve();
 const second=x.click();
 assert.equal(x.calls.filter(c=>c.action==='save').length,1);
 x.unblock();
 await Promise.all([first,second]);
 assert.equal(x.cache.config.modules.podcasts,false);
});
test('save locks until server verification and unlocks on network error',async()=>{
 const x=moduleSaveHarness({fail:true});
 await x.save();
 assert.equal(x.events.filter(v=>v==='write').length,1);
 assert.equal(x.cache.config.modules.radio,true);
});
test('module save guard is shared with the Podcasts toggle',()=>{
 assert.match(html,/if\(moduleSettingsBusy\)return;/);
 assert.match(html,/finally\{setModuleSettingsBusy\(false\);\}/);
 assert.match(html,/id="saveSystemModulesButton"/);
});
