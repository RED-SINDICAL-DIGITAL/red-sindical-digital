const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync('admin.html','utf8');
const start=html.indexOf('window.togglePodcastsVisibility=async()=>{');
const end=html.indexOf('window.saveSystemModules=async()=>',start);
assert(start>0&&end>start,'Podcast button handler must exist');
const code=html.slice(start,end);
function harness({visible=true,allow=true,fail=false}={}){
 const cache={config:{branding:{name:'UADAV STREAM'},modules:{podcasts:visible,radio:true,artists:true}}};
 const calls=[];let serverConfig=JSON.parse(JSON.stringify(cache.config));
 const context={
 S:{cache},
 obj:value=>value&&typeof value==='object'?value:{},
 effectiveModules:cfg=>({podcasts:true,...(cfg?.modules||{})}),
 confirm:()=>allow,
 saveJSON:async(path,data)=>{calls.push({action:'save',path,data});if(fail)throw Error('Fallo local sintético');serverConfig=JSON.parse(JSON.stringify(data))},
 api:async(path)=>{calls.push({action:'read',path});return serverConfig},
 renderNav:()=>calls.push({action:'nav'}),
 go:async(view)=>calls.push({action:'go',view}),
 toast:message=>calls.push({action:'toast',message})
 };
 context.window=context;
 vm.createContext(context);vm.runInContext(code,context);
 return {click:()=>context.togglePodcastsVisibility(),calls,cache};
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
