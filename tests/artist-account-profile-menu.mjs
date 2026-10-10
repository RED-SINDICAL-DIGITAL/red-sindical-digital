import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

class Element {
  constructor(tag){this.tag=tag;this.childNodes=[];this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.isConnected=true;this.className='';this.href='';this.textContent=''}
  append(...nodes){this.childNodes.push(...nodes)}
  appendChild(node){this.append(node)}
  replaceChildren(...nodes){this.childNodes=nodes}
  setAttribute(k,v){this.attributes[k]=v}
  removeAttribute(k){delete this.attributes[k]}
}
const box=new Element('section'),status=new Element('p'),storage=new Map([['uadav_account_access_v1','ACCOUNT-TEST']]);
const location={search:'',origin:'https://uadavstream.com.ar',href:''};
const document={readyState:'loading',addEventListener(){},getElementById:id=>id==='linkedArtists'?box:id==='artistAccountStatus'?status:null,createElement:tag=>new Element(tag)};
const calls=[];
const ctx=vm.createContext({URL,URLSearchParams,AbortController,setTimeout,clearTimeout,location,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},addEventListener(){},confirm:()=>false,fetch:async(url,opt={})=>{calls.push([String(url),opt]);if(String(url).includes('public/artista'))return{ok:true,json:async()=>({id:'ART-1',nombre:'Artista demo',visible:true})};if(String(url).includes('account/artist-session'))return{ok:true,json:async()=>({token:'SESSION-1'})};return{ok:true,json:async()=>({artists:[{artist_id:'ART-1',name:'Artista demo',published:true}]})}},UADAVShare:{prepare(){},open(){}}});
vm.runInContext(await readFile(new URL('../uadav-artist-account-v142.js',import.meta.url),'utf8'),ctx);
await ctx.UADAVArtistAccount.refresh();
await new Promise(resolve=>setImmediate(resolve));
const card=box.childNodes.find(x=>x.className==='linked-artist-card');
assert(card,'linked artist card is rendered');
const actions=card.childNodes.find(x=>x.className==='prefs');
const visible=actions.childNodes.filter(x=>!x.hidden).map(x=>x.textContent);
assert.deepEqual(visible,['Abrir mi espacio','Mi presentación y herramientas','Ver perfil público','Compartir perfil']);
const more=card.childNodes.find(x=>x.tag==='details');
assert.equal(more.childNodes[0].textContent,'Más opciones');
for(const label of ['Consultas recibidas','Mi PRO','Desvincular artista','Eliminar perfil de artista'])assert(more.childNodes.some(x=>x.textContent===label),label+' remains accessible');
const plan=more.childNodes.find(x=>x.textContent==='Mi PRO');
let prevented=false;await plan.onclick({preventDefault(){prevented=true}});
assert(prevented);assert.equal(location.href,'/gestionar-artista.html?tab=plan&artist_id=ART-1');
assert(calls.some(([url,opts])=>url.includes('account/artist-session')&&opts.method==='POST'));
console.log('PASS: Mi perfil presents one primary artist workspace, keeps tools and profile sharing available, and opens Consultas/PRO through a session for the correct artist');
