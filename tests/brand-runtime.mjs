import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../platform-brand-runtime.js',import.meta.url),'utf8');
class Element {
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={setProperty(k,v){this[k]=v}}}
 setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]??null}
 hasAttribute(k){return k in this.attrs}removeAttribute(k){delete this.attrs[k]}
 append(...nodes){this.children.push(...nodes)}appendChild(node){this.append(node)}
 replaceChildren(...nodes){this.children=nodes}
 matches(selector){return selector==='a[href]'&&this.tag==='a'&&this.hasAttribute('href')}
 querySelectorAll(selector){
  const result=[];
  for(const child of this.children){
   if(selector.split(',').some(s=>{
    const m=s.match(/^(?:([a-z]+))?\[([\w-]+)(?:="([^"]*)")?\]$/);
    return m&&(!m[1]||child.tag===m[1])&&child.hasAttribute(m[2])&&(m[3]===undefined||child.getAttribute(m[2])===m[3]);
   }))result.push(child);
   result.push(...child.querySelectorAll(selector));
  }return result;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
}
async function boot(config,path='/app.html',headFails=false,instance={}){
 const documentElement=new Element('html'),head=new Element('head'),body=new Element('body');
 documentElement.append(head,body);
 const name=new Element('span');name.setAttribute('data-brand-name','');
 const market=new Element('a');market.setAttribute('href','/marketplace.html');
 const radio=new Element('a');radio.setAttribute('href','/radio.html');body.append(name,market,radio);
 const document={documentElement,head,body,readyState:'complete',querySelectorAll:s=>documentElement.querySelectorAll(s),createElement:t=>new Element(t),dispatchEvent(){}};
 let observer;
 const window={PLATFORM_API_BASE:'https://instance.test/api/'};
 const context={window,document,location:{href:'https://instance.test'+path,pathname:path,origin:'https://instance.test',search:''},URL,AbortController,setTimeout,clearTimeout,
  CustomEvent:class{},MutationObserver:class{constructor(callback){observer=callback}observe(){}},
  fetch:async url=>({ok:!headFails||!url.endsWith('seo/head'),json:async()=>url.endsWith('/platform-instance.json')?instance:url.endsWith('config')?config:{brand:config.branding,modules:config.modules}})
 };
 vm.runInNewContext(source,context);await window.PlatformBrandReady;
 return {window,document,name,market,radio,observer};
}
const page=await boot({branding:{name:'BeatPlay',primary_color:'#00aaff'},modules:{marketplace:false,radio:true}},'/app.html',true);
assert.equal(page.name.textContent,'BeatPlay','config survives SEO failure');
assert.equal(page.market.hidden,true);assert.notEqual(page.radio.hidden,true);
assert.equal(page.document.documentElement.style['--blue'],'#00aaff');
const late=new Element('a');late.setAttribute('href','/marketplace.html');page.document.body.append(late);page.observer([{addedNodes:[late]}]);assert.equal(late.hidden,true);
const injection='<img src=x onerror="window.injected=true">';
const blocked=await boot({branding:{name:injection,primary_color:'red;display:none'},modules:{marketplace:false}},'/marketplace.html');
const main=blocked.document.body.children[0];assert.equal(main.tag,'main');
assert.equal(main.children[0].textContent,'Módulo no disponible');
assert.equal(main.children[1].textContent,'Esta función no está habilitada en '+injection+'.');
assert.equal(blocked.window.injected,undefined);
assert.equal(blocked.window.PlatformBrand.primary_color,'#2f6df6');
assert.equal(blocked.window.PlatformBrand.logo_url,'');
for(const path of ['/evento.html','/marketplace.html','/podcasts.html','/planes-artistas.html','/nested/marketplace.html']){
 const state=await boot({modules:{events:false,marketplace:false,podcasts:false,pro:false}},path);
 assert.equal(state.document.body.children[0].tag,'main',path);
}
console.log('PASS: runtime DOM fixture: SEO failure, brand color, async links, disabled routes, literal brand text');

const local=await boot({},'/app.html',true,{branding:{name:'UADAV STREAM',icon:'★',primary_color:'#2f6df6'}});
assert.equal(local.name.textContent,'UADAV STREAM','instance identity survives missing remote configuration');
const override=await boot({branding:{name:'BeatPlay'}},'/app.html',false,{branding:{name:'UADAV STREAM'}});
assert.equal(override.name.textContent,'BeatPlay','configured identity overrides installation fallback');
console.log('PASS: local instance branding and remote override');
