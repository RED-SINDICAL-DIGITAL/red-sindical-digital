const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const {webcrypto}=require('node:crypto');
const html=fs.readFileSync(path.join(__dirname,'../contratar-artista.html'),'utf8');
const helper=html.slice(html.indexOf('let submitting='),html.indexOf("document.getElementById('artistId').value=artist;"));
function formClient(store=new Map()){const context={artist:'QA-ARTIST',crypto:webcrypto,TextEncoder,Uint8Array,encodeURIComponent,FormData:class{constructor(data){return Object.entries(data)}},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}};vm.runInNewContext(helper+';globalThis.prepare=inquirySubmissionData;globalThis.clear=clearInquiryAttempt;',context);return {prepare:context.prepare,clear:context.clear,store};}
const payload={artist_id:'QA-ARTIST',nombre:'Synthetic client',email:'private@example.invalid'};
test('form retry and a reloaded tab reuse the key without storing contact text',async()=>{const c=formClient(),first=await c.prepare(payload),retry=await c.prepare(payload);assert.equal(first.request_id,retry.request_id);assert.equal((await formClient(c.store).prepare(payload)).request_id,first.request_id);assert.equal(JSON.stringify([...c.store]).includes(payload.email),false)});
test('changed form data or confirmed-clear creates a new request key',async()=>{const c=formClient(),first=await c.prepare(payload),changed=await c.prepare({...payload,nombre:'Another client'});assert.notEqual(first.request_id,changed.request_id);c.clear();assert.notEqual((await c.prepare(payload)).request_id,first.request_id)});
test('booking POST is not replayed against another API after a network error',async()=>{let attempts=0;const src=html.slice(html.indexOf('async function apiFetch('),html.indexOf('const artist=new URLSearchParams'));const c={AbortController,setTimeout,clearTimeout,API_REMOTE:'https://first.example/',API_BASES:['https://first.example/','https://second.example/'],fetch:async()=>{attempts++;throw Error('network lost')}};vm.runInNewContext(src+';globalThis.request=apiFetch;',c);await assert.rejects(c.request('contrataciones',{method:'POST'}),/network lost/);assert.equal(attempts,1)});

test('malformed cached retry identifiers are replaced by a valid request key',async()=>{
 for(const id of [null,12,'short',{},'bad key with spaces']){const first=formClient(),data=await first.prepare(payload),entry=JSON.parse([...first.store.values()][0]);entry.id=id;first.store.set([...first.store.keys()][0],JSON.stringify(entry));const restored=await formClient(first.store).prepare(payload);assert.match(restored.request_id,/^[a-f0-9]{32}$/);assert.notEqual(restored.request_id,data.request_id)}
});
test('a timed-out POST aborts once and never retries a second API',async()=>{
 let attempts=0;const src=html.slice(html.indexOf('async function apiFetch('),html.indexOf('const artist=new URLSearchParams'));
 const c={AbortController,setTimeout:fn=>{queueMicrotask(fn);return 1},clearTimeout(){},API_REMOTE:'https://first.example/',API_BASES:['https://first.example/','https://second.example/'],fetch:async(_url,opt)=>{attempts++;return new Promise((_resolve,reject)=>opt.signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'}))))}};
 vm.runInNewContext(src,c);await assert.rejects(c.apiFetch('contrataciones',{method:'POST'}),/demoró demasiado/);assert.equal(attempts,1);
});
function submissionClient(reply){
 const nodes={status:{},accept:{checked:true},artistId:{value:'QA-ARTIST'},artistName:{value:'Synthetic artist'},inquiryReceipt:{hidden:true},inquiryReference:{},receiptArtist:{},receiptStatus:{},inquiryReceiptTitle:{focus(){}}},name={value:'Synthetic client',disabled:false},button={disabled:false},form={hidden:false,elements:[name,nodes.accept,button],resets:0,reset(){this.resets++;name.value='';nodes.accept.checked=false}};nodes.f=form;
 const c={artist:'QA-ARTIST',artistReady:true,checkingArtist:false,artistDisplayName:'Synthetic artist',submitting:false,document:{getElementById:id=>nodes[id],querySelector:()=>button},inquirySubmissionData:async()=>({artist_id:'QA-ARTIST',request_id:'a'.repeat(32)}),apiFetch:async()=>typeof reply==='function'?reply():reply,clearInquiryAttempt(){c.cleared=true}};
 const validation=html.slice(html.indexOf('function confirmedInquiry('),html.indexOf("document.getElementById('f').prepend"));
 const submit=html.slice(html.indexOf('async function submitInquiry('),html.indexOf("document.getElementById('f').addEventListener('submit'"));
 const refresh=html.slice(html.indexOf('function refreshInquirySubmit('),html.indexOf('async function verifyBookingArtist('));
 vm.runInNewContext(refresh+validation+submit,c);return {c,nodes,form,name,button,submit:()=>c.submitInquiry({preventDefault(){},target:form})};
}
const receipt={success:true,item:{id:'CON-'+'a'.repeat(64),artist_id:'QA-ARTIST',estado:'pendiente'}};
test('confirmed receipt names the exact recipient, clears the draft and blocks another accidental submit',async()=>{
 const h=submissionClient(receipt);await h.submit();assert.equal(h.form.hidden,true);assert.equal(h.nodes.inquiryReceipt.hidden,false);assert.equal(h.nodes.inquiryReference.value,receipt.item.id);assert.match(h.nodes.receiptStatus.textContent,/Synthetic artist/);assert.equal(h.form.resets,1);assert.equal(h.button.disabled,true);assert.equal(h.c.cleared,true);await h.submit();assert.equal(h.form.resets,1);
});
test('incomplete or wrong-recipient success never clears the draft or shows a receipt',async()=>{
 for(const data of [{success:true},{...receipt,item:{...receipt.item,artist_id:'OTHER'}},{...receipt,item:{...receipt.item,estado:'invalid'}}]){const h=submissionClient(data);await h.submit();assert.equal(h.form.hidden,false);assert.equal(h.form.resets,0);assert.equal(h.name.value,'Synthetic client');assert.equal(h.nodes.inquiryReceipt.hidden,true);assert.equal(h.c.cleared,undefined);assert.match(h.nodes.status.textContent,/Conservamos tus datos/)}
});
test('duplicate clicks while awaiting a response cannot send a second inquiry',async()=>{
 let release,calls=0;const h=submissionClient(()=>{calls++;return new Promise(r=>release=r)}),pending=h.submit();await Promise.resolve();await h.submit();assert.equal(calls,1);release(receipt);await pending;assert.equal(h.form.resets,1);
});
