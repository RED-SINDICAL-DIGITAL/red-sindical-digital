const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../uadav-jobs-account.js'),'utf8');
const ORIGIN='https://uadav-stream-staging.pages.dev',API='https://uadav-api-staging.uadavstream.workers.dev/api/',A='UAC-'+'a'.repeat(64),B='UAD-'+'b'.repeat(64);
const context={window:{},AbortController,setTimeout,clearTimeout};vm.runInNewContext(source,context);
const {createClient,parseProof}=context.window.UADAVJobsAccount;
const reply=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
const empty=()=>({success:true,enabled:true,items:[],next_offset:null});
const item=(title='Oferta ficticia')=>({tipo:'oferta',id:'JOB-QA-123',titulo:title,estado:'activa',recibe_postulaciones:true});
const tick=()=>new Promise(setImmediate);
function fixture(transport=async()=>reply(empty())){let credential=A,generation=0;const calls=[];const client=createClient({origin:ORIGIN,getCredential:()=>credential,getGeneration:()=>generation,transport:async(url,options)=>{calls.push({url,options});return transport(url,options)}});return {client,calls,switch(value){credential=value;generation++;}};}

test('client refuses production, lookalike origins and arbitrary destinations before issuing requests',()=>{
  for(const origin of ['https://uadavstream.com.ar',ORIGIN+'.evil.invalid','http://uadav-stream-staging.pages.dev'])assert.throws(()=>createClient({origin}),/staging/);
  assert.throws(()=>createClient({origin:ORIGIN,apiBase:'https://untrusted.invalid/api/'}),/staging/);
});
test('receipt importer accepts combined offer codes and both application receipt formats',()=>{
  const key='c'.repeat(64);
  for(const text of ['JOB-QA-123|'+key,'UADAV STREAM\nIdentificador: JOB-QA-123\nClave: '+key]){const p=parseProof(text);assert.equal(p.tipo,'oferta');assert.equal(p.id,'JOB-QA-123');assert.equal(p.clave,key);}
  for(const text of ['Postulación: POST-QA-12345\nClave: '+key,'Identificador: POST-QA-12345\nClave: '+key])assert.equal(parseProof(text).tipo,'postulacion');
  for(const text of ['JOB-QA-123','JOB-QA-123|short','POST-A|'+key,'x'.repeat(8193)])assert.throws(()=>parseProof(text));
});
test('account save is offered only after authenticated capability validation; credentials remain in the header',async()=>{
  const x=fixture();assert.throws(()=>x.client.selection(true));await x.client.list();const selection=x.client.selection(true);
  assert.equal(selection.save,true);assert.equal(selection.headers.Authorization,'Bearer '+A);assert.equal(x.client.selection(false).headers.Authorization,undefined);
  const call=x.calls[0];assert.equal(call.url,API+'bolsa_trabajo/cuenta?offset=0');assert.equal(call.options.headers.Authorization,'Bearer '+A);assert.equal(call.options.cache,'no-store');assert(!call.url.includes(A));assert.equal(call.options.body,undefined);
});
test('invalid lists or unavailable backend never enable automatic account saving',async()=>{
  for(const response of [reply({},200),reply({...empty(),enabled:false}),reply({...empty(),items:[{}]}),reply({...empty(),next_offset:0}),reply({error:'Unavailable'},503)]){
    const x=fixture(async()=>response);await assert.rejects(x.client.list());assert.throws(()=>x.client.selection(true));
  }
});
test('private inbox and list replies are discarded after account changes, including A to B to A',async()=>{
  for(const route of ['list','inbox']){
    let finish;const x=fixture(()=>new Promise(resolve=>finish=resolve));const pending=route==='list'?x.client.list():x.client.inbox('JOB-QA-123');
    x.switch(B);x.switch(A);finish(reply(route==='list'?empty():{success:true,items:[{nombre:'PRIVATE_A'}]}));await assert.rejects(pending,/cuenta cambió/);
  }
});
test('link and management calls require confirmed replies and send no account credential in body or URL',async()=>{
  const x=fixture(async()=>reply({success:true}));const p=parseProof('JOB-QA-123|'+'c'.repeat(64));await x.client.link(p);await x.client.manage(p.id,'cerrar');await x.client.unlink(p);
  assert.equal(JSON.parse(x.calls[0].options.body).confirm,'VINCULAR_A_MI_CUENTA');assert.equal(JSON.parse(x.calls[1].options.body).cuenta,true);
  for(const call of x.calls){assert(!call.url.includes(A));assert(!call.options.body.includes(A));assert.equal(call.options.headers.Authorization,'Bearer '+A)}
  const bad=fixture(async()=>reply({success:false}));await assert.rejects(bad.client.link(p),/no confirmó/);
});

class Node{
  constructor(tag='div',text=''){this.tag=tag;this.children=[];this.handlers={};this.style={};this.hidden=false;this.disabled=false;this.checked=false;this.value='';this.isConnected=true;this._text=text;}
  get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ')}set textContent(value){this._text=value;this.children=[]}
  append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node)}}replaceChildren(...nodes){for(const node of this.children)node.parentNode=null;this._text='';this.children=[];this.append(...nodes)}
  insertBefore(node,before){if(before==null){this.append(node);return}const index=this.children.indexOf(before);if(index<0)throw Error('NotFoundError: reference is not a child');node.parentNode=this;this.children.splice(index,0,node)}
  addEventListener(name,callback){this.handlers[name]=callback}setAttribute(name,value){this[name]=value}
  querySelector(selector){return selector==='.actions'?this.children.flatMap(walk).find(n=>n.className==='actions')||null:null}
}
const walk=node=>[node,...node.children.flatMap(walk)];
async function mount({profile=false,initial=A,transport}={}){
  const nodes={},handlers={},fetches=[];let credential=initial;
  for(const id of ['jobPostForm','applyForm']){const form=new Node('form'),actions=new Node();actions.className='actions';if(id==='applyForm'){const body=new Node();body.className='modal-body';body.append(actions);form.append(body)}else form.append(actions);nodes[id]=form}
  if(profile){nodes['mis-trabajos']=new Node('section');nodes['mis-trabajos'].append(new Node('h2'),new Node('p'),new Node('div'))}
  const root={location:{origin:ORIGIN},UADAVAccount:{code:()=>credential},addEventListener:(name,callback)=>handlers[name]=callback,fetch:async(url,options)=>{fetches.push({url,options});return transport?transport(url,options):reply(empty())}};
  const document={readyState:'loading',head:new Node('head'),createElement:tag=>new Node(tag),getElementById:id=>nodes[id]||null,addEventListener:(name,callback)=>handlers[name]=callback};root.document=document;
  vm.runInNewContext(source,{window:root,AbortController,setTimeout,clearTimeout,URL});handlers.DOMContentLoaded();await tick();
  return {root,nodes,handlers,fetches,switch(value){credential=value;handlers['uadav:account']()},choice:kind=>walk(nodes[kind==='oferta'?'jobPostForm':'applyForm']).find(n=>n.id==='saveJobAccount-'+kind)};
}
test('refreshing capabilities preserves an explicit choice not to save; switching accounts clears it',async()=>{
  const x=await mount();const choice=x.choice('oferta');assert.equal(choice.checked,true);choice.checked=false;x.handlers.focus();await tick();assert.equal(choice.checked,false);assert.equal(x.root.UADAVJobsAccount.selection('oferta').save,false);
  x.switch('');assert.equal(choice.checked,false);assert.equal(x.root.UADAVJobsAccount.selection('oferta').headers.Authorization,undefined);
  x.switch(B);await tick();assert.equal(choice.checked,true);assert.equal(x.root.UADAVJobsAccount.selection('oferta').headers.Authorization,'Bearer '+B);
});
test('anonymous visitors keep receipt tools and do not make private account requests',async()=>{
  const x=await mount({initial:''});assert.equal(x.fetches.length,0);assert.equal(x.choice('oferta').checked,false);assert.equal(x.choice('postulacion').checked,false);
});
test('account choices mount beside the actual actions even when application actions are nested in the modal body',async()=>{
  const x=await mount();assert.equal(x.choice('oferta').parentNode.parentNode,x.nodes.jobPostForm);assert.equal(x.choice('postulacion').parentNode.parentNode.className,'modal-body');assert.equal(x.choice('postulacion').checked,true);
});
test('switching accounts removes old cards and prevents a late private inbox response from rendering',async()=>{
  let finish;const x=await mount({profile:true,transport:async(url,options)=>url.endsWith('mis-postulantes')?new Promise(resolve=>finish=resolve):reply({...empty(),items:options.headers.Authorization==='Bearer '+A?[item('Old account offer')]:[]})});
  const button=walk(x.nodes['mis-trabajos']).find(n=>n.tag==='button'&&n.textContent==='Ver postulantes');assert(button);
  const pending=button.handlers.click({currentTarget:button});x.switch(B);await tick();finish(reply({success:true,items:[{nombre:'PRIVATE_A',email:'private-a@example.invalid'}]}));await pending;
  assert(!x.nodes['mis-trabajos'].textContent.includes('PRIVATE_A'));assert(!x.nodes['mis-trabajos'].textContent.includes('Old account offer'));
});
test('both pages load the same account module and keep existing private receipt tools',()=>{
  for(const file of ['usuario.html','bolsa-trabajo.html']){const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');assert.match(html,/src="\/uadav-jobs-account\.js/);for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1])}
  assert.match(fs.readFileSync(path.join(__dirname,'../usuario.html'),'utf8'),/id="profileJobLookup"/);
});
