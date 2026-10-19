const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('index-v117.html','utf8');
function extract(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b)}
test('Home starts every catalog without waiting for Admin configuration',async()=>{
 const calls=[],ctx={wireHomeActions(){},renderContinue(){calls.push('recent')},loadVisits(){calls.push('visits')},applyAdminHome:()=>new Promise(()=>{}),timedFetch:async()=>({ok:false}),API:'https://example.test/api/'};for(const n of ['loadTrends','loadArtists','loadEvents','loadRadios','loadMedia'])ctx[n]=()=>calls.push(n);
 const a=source.indexOf('(async()=>{wireHomeActions();'),b=source.indexOf('})();',a)+5;await vm.runInNewContext(source.slice(a,b),ctx);assert.deepEqual(calls,['recent','visits','loadTrends','loadArtists','loadEvents','loadRadios','loadMedia']);
});
test('Home search uses the full search page and encodes the exact user query',()=>{
 const routes=[],ctx={go:href=>routes.push(href)};vm.runInNewContext(extract('function searchNow(','async function cfg('),ctx);ctx.searchNow(' @madonna & música ');ctx.searchNow(' ');assert.deepEqual(routes,['/buscar.html?q=%40madonna%20%26%20m%C3%BAsica']);
});
test('invalid local history cannot break Home and valid media objects remain',()=>{
 const ctx={localStorage:{getItem:()=>ctx.raw}};vm.runInNewContext(extract('function homeRecent(','function remember('),ctx);
 for(const value of ['null','{}','"text"','invalid','[null,1,[],false]']){ctx.raw=value;assert.equal(ctx.homeRecent().length,0)}
 ctx.raw='[{"title":"Audio"},null]';assert.equal(ctx.homeRecent()[0].title,'Audio');
});
test('Home remembers media artwork and kind without failing playback on storage errors',()=>{
 const data=new Map(),ctx={sourceOf:x=>x.url||'',localStorage:{getItem:k=>data.get(k)||'null',setItem:(k,v)=>data.set(k,v)},renderContinue(){ctx.refreshed=true}};
 vm.runInNewContext(extract('function homeRecent(','function play('),ctx);ctx.remember({url:'https://example.test/audio.mp3',title:'Audio',thumbnail:'cover',content_type:'audio'});const a=JSON.parse(data.get('uadav_recent_v11'));assert.equal(a[0].thumbnail,'cover');assert.equal(a[0].content_type,'audio');assert.equal(ctx.refreshed,true);ctx.localStorage.setItem=()=>{throw Error('Quota')};assert.doesNotThrow(()=>ctx.remember({url:'other'}));
});
test('Home playback preserves audio type and artwork for the persistent player',()=>{
 const played=[],ctx={shellHost:()=>({playContent:x=>played.push(x)}),remember:x=>ctx.remembered=x};vm.runInNewContext(extract('function play(','function closePlayer('),ctx);
 ctx.play('','Audio','https://example.test/audio.mp3','audio',{content_type:'audio',thumbnail:'cover'});assert.equal(played[0].content_type,'audio');assert.equal(played[0].thumbnail,'cover');assert.equal(ctx.remembered.thumbnail,'cover');
});
test('Home content uses separate native controls for playback and favorites',()=>{
 const ctx={idOf:()=>'',imgOf:()=>'',titleOf:()=>'<Audio>',subOf:()=>'',sourceOf:()=>'',esc:x=>String(x).replaceAll('<','&lt;').replaceAll('>','&gt;')};vm.runInNewContext(extract('function card(','const FAV_KEY='),ctx);const html=ctx.card({content_type:'audio'});
 assert.match(html,/class="homeCardOpen"/);assert.match(html,/class="saveCard"/);assert.doesNotMatch(html,/<article[^>]*role="button"/);assert.equal((html.match(/<button/g)||[]).length,2);assert.match(html,/&lt;Audio&gt;/);assert.match(html,/data-content-type="audio"/);
});
test('saving from Home updates pressed state without starting playback',()=>{
 const listeners={},button={classList:{toggle(){}},setAttribute(k,v){this[k]=v}},open={},el={dataset:{id:'id',title:'Test',provider:'youtube',contentType:'video'},querySelector:s=>s==='.saveCard'?button:open},ctx={homeFavs:()=>ctx.saved?[{id:'id'}]:[],homeKey:x=>x.id,homeToggleFav:()=>{ctx.saved=true},play:()=>{ctx.played=true},$:()=>({textContent:''})};
 vm.runInNewContext(extract('function wire(root){','function homeRecent('),ctx);ctx.wire({querySelectorAll:()=>[el]});assert.equal(button['aria-pressed'],'false');button.onclick({preventDefault(){},stopPropagation(){}});assert.equal(button['aria-pressed'],'true');assert.equal(ctx.played,undefined);open.onclick();assert.equal(ctx.played,true);
});
test('Home and Explore artist previews preserve channel identity through the shared resolver',()=>{
 const home=extract('async function loadArtists()','async function loadEvents()');assert.match(home,/UADAVArtistDiscovery\.profileHref/);assert.doesNotMatch(home,/artista\.html\?discover/);
 const explore=fs.readFileSync('descubrir.html','utf8');assert.match(explore,/link\.href=UADAVArtistDiscovery\.profileHref\(a\)/);
});

test('native Home navigation buttons use their current click action for keyboard activation',()=>{
 const button={tagName:'BUTTON',dataset:{homeNav:'/old-route'}},article={tagName:'ARTICLE',dataset:{homeNav:'/artists'}},routes=[],ctx={document:{querySelectorAll:s=>s==='[data-home-nav]'?[button,article]:[]},go:href=>routes.push(href)};
 vm.runInNewContext(extract('function wireHomeActions(){','function wire(root){'),ctx);ctx.wireHomeActions();assert.equal(button.onkeydown,undefined);article.onkeydown({key:'Enter',preventDefault(){}});assert.deepEqual(routes,['/artists']);
});
test('Home favorite notifications follow successful persistence and never fire on a failed save',()=>{
 const data=new Map(),events=[],ctx={homeFavs:()=>[],homeKey:x=>x.id,FAV_KEY:'favorites',localStorage:{setItem:(k,v)=>data.set(k,v)},window:{dispatchEvent:e=>{assert(data.has('favorites'));events.push(e.type)}},CustomEvent:class{constructor(type){this.type=type}},location:{origin:'https://example.test'}};ctx.window.parent=ctx.window;
 vm.runInNewContext(extract('function homeToggleFav(','function wireHomeActions(){'),ctx);ctx.homeToggleFav({id:'valid'});assert.deepEqual(events,['uadav:local-change']);ctx.localStorage.setItem=()=>{throw Error('Quota')};assert.throws(()=>ctx.homeToggleFav({id:'other'}));assert.equal(events.length,1);
});

test('Home distinguishes unavailable sources from an authoritative empty response',async()=>{
 const ctx={API:'https://example.test/api/',timedFetch:async()=>{throw Error('Offline')}};
 vm.runInNewContext(extract('async function yt(','async function loadTrends('),ctx);await assert.rejects(ctx.yt('test'),/consultar/);ctx.timedFetch=async()=>({ok:true,json:async()=>[]});assert.equal((await ctx.yt('test')).length,0);ctx.timedFetch=async()=>({ok:true,json:async()=>({unexpected:true})});await assert.rejects(ctx.yt('test'),/consultar/);
});
test('Home proposals expose a retry action when all providers fail',async()=>{
 const nodes={trendStatus:{},trendRail:{},trendRetry:{}},ctx={$:id=>nodes[id],yt:async()=>{throw Error('Offline')}};
 vm.runInNewContext(extract('async function loadTrends()','function arr('),ctx);await ctx.loadTrends();assert.match(nodes.trendStatus.textContent,/No pudimos cargar/);assert.match(nodes.trendRail.innerHTML,/Reintentar/);assert.equal(typeof nodes.trendRetry.onclick,'function');
});

test('artists opened from Home and Explore can return only to validated local origins',()=>{
 const artist=fs.readFileSync('artista.html','utf8'),a=artist.indexOf('function artistReturnRoute('),b=artist.indexOf('\nfunction navigate(',a),ctx={URL,location:{origin:'https://example.test'}};vm.runInNewContext(artist.slice(a,b),ctx);
 assert.equal(ctx.artistReturnRoute('/index-v117.html'),'/index-v117.html');assert.equal(ctx.artistReturnRoute('/descubrir.html?kind=escena'),'/descubrir.html?kind=escena');
 for(const route of ['/descubrir.html?kind=invalid','/descubrir.html?kind=musica&next=evil','/index-v117.html?next=evil','https://evil.test/index-v117.html'])assert.equal(ctx.artistReturnRoute(route),'/artistas.html');
});

function rotationHarness({reduced=false,count=3}={}){
 const nodes={},listeners={},timers=new Map(),shown=[];let seq=0;
 for(const id of ['hero','heroControls','heroPause','heroPosition','heroPrevious','heroNext'])nodes[id]={style:{},setAttribute(k,v){this[k]=v},addEventListener(k,v){this[k]=v},removeEventListener(k,v){if(this[k]===v)delete this[k]},contains:el=>el===nodes.heroPause};
 const ctx={$:id=>nodes[id],window:{matchMedia:()=>({matches:reduced})},document:{hidden:false,addEventListener:(k,v)=>listeners[k]=v,removeEventListener:k=>delete listeners[k]},setInterval:fn=>{timers.set(++seq,fn);return seq},clearInterval:id=>timers.delete(id)};
 vm.runInNewContext(extract('function createHeroRotation(','function applyHero('),ctx);const controller=ctx.createHeroRotation(count,i=>shown.push(i));return {ctx,nodes,listeners,timers,shown,controller};
}
test('hero previous, next and pause controls preserve a single bounded timer',()=>{
 const h=rotationHarness();assert.equal(h.timers.size,1);h.nodes.heroNext.onclick();assert.equal(h.nodes.heroPosition.textContent,'2 de 3');h.nodes.heroPrevious.onclick();assert.equal(h.nodes.heroPosition.textContent,'1 de 3');assert.equal(h.timers.size,1);h.nodes.heroPause.onclick();assert.equal(h.timers.size,0);assert.equal(h.nodes.heroPause['aria-pressed'],'true');h.nodes.heroPause.onclick();assert.equal(h.timers.size,1);
});
test('hero never automatically rotates with reduced motion or a single proposal',()=>{
 assert.equal(rotationHarness({reduced:true}).timers.size,0);const single=rotationHarness({count:1});assert.equal(single.timers.size,0);assert.equal(single.nodes.heroControls.hidden,true);
});
test('hero suspends rotation while hidden, hovered or focused and cleans listeners',()=>{
 const h=rotationHarness();h.ctx.document.hidden=true;h.listeners.visibilitychange();assert.equal(h.timers.size,0);h.ctx.document.hidden=false;h.listeners.visibilitychange();assert.equal(h.timers.size,1);h.nodes.hero.mouseenter();assert.equal(h.timers.size,0);h.nodes.hero.mouseleave();assert.equal(h.timers.size,1);h.nodes.hero.focusin();assert.equal(h.timers.size,0);h.nodes.hero.focusout({relatedTarget:h.nodes.heroPause});assert.equal(h.timers.size,0);h.nodes.hero.focusout({relatedTarget:null});assert.equal(h.timers.size,1);h.controller.destroy();assert.equal(h.timers.size,0);assert.equal(h.nodes.hero.mouseenter,undefined);assert.equal(h.listeners.visibilitychange,undefined);
});
test('hero slides cannot inherit the previous description, category or image',()=>{
 const nodes={};for(const id of ['heroKicker','heroTitle','heroText','back','heroPrimary','heroSecondary'])nodes[id]={style:{}};
 const ctx={$:id=>nodes[id],heroRotation:null,createHeroRotation:(_count,show)=>{ctx.show=show;return{destroy(){}}}};vm.runInNewContext(extract('function applyHero(','async function applyAdminHome('),ctx);
 ctx.applyHero({hero_spotlights:[{title:'First',description:'Old copy',category:'Old category',image:'https://example.test/old.jpg'},{title:'Second'}]});ctx.show(1);assert.equal(nodes.heroTitle.textContent,'Second');assert.notEqual(nodes.heroText.textContent,'Old copy');assert.notEqual(nodes.heroKicker.textContent,'Old category');assert.equal(nodes.back.style.backgroundImage,'');
});
test('shared readable text decodes once, preserves invalid Unicode and never renders HTML',()=>{
 const ctx={};vm.runInNewContext(fs.readFileSync('uadav-readable-text.js','utf8'),ctx);assert.equal(ctx.UADAVText.readable('La K&#39;onga &amp; amigos'),"La K'onga & amigos");assert.equal(ctx.UADAVText.readable('&#x1f3b5;'),'🎵');assert.equal(ctx.UADAVText.readable('&amp;lt;'),'&lt;');assert.equal(ctx.UADAVText.readable('&#xD800;'),'&#xD800;');assert.equal(ctx.UADAVText.readable('&#9999999;'),'&#9999999;');
});
