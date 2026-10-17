import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const source=await readFile(new URL('../uadav-presskit-v138.js',import.meta.url),'utf8');
function renderer(details=[]){const events={},ctx={URL,document:{addEventListener(){},querySelectorAll(selector){assert.equal(selector,'.kit-document details:not([open])');return details.filter(x=>!x.open)}},addEventListener:(event,fn)=>events[event]=fn};vm.runInNewContext(source,ctx);return {kit:ctx.UADAVPressKit,events};}
test('public presentation renders only explicitly public kit/show fields',()=>{
 const {kit}=renderer();const html=kit.render({kit:{name:'Maga',bio:'Public bio',contact:'Public contact',private_notes:'PRIVATE-KIT-NOTE'},shows:[{name:'Public show',requirements:'Public technical rider',price:'PRIVATE-SHOW-PRICE',notes:'PRIVATE-SHOW-NOTE'}],quotes:[{client:'PRIVATE-CLIENT'}],agenda:[{place:'PRIVATE-AGENDA'}],leads:[{email:'PRIVATE-LEAD'}]});
 assert.match(html,/Public bio/);assert.match(html,/Public technical rider/);assert.doesNotMatch(html,/PRIVATE-/);
});
test('hidden sections stay absent and unsafe links cannot become executable markup',()=>{
 const {kit}=renderer();const html=kit.render({kit:{name:'<script>alert(1)</script>',bio:'<img src=x onerror=alert(1)>',video:'javascript:alert(1)',photo:'https://secret:password@example.invalid/photo.jpg',contact:'HIDDEN-CONTACT',trajectory:'HIDDEN-TRAJECTORY',appearance:{hidden_sections:['contact','trajectory','shows']}},shows:[{name:'HIDDEN-SHOW'}]});
 assert.doesNotMatch(html,/<script>|<img src=x|javascript:|secret:password|HIDDEN-/);assert.match(html,/&lt;script&gt;/);
});
test('printing opens only closed kit details and restores them after repeated beforeprint',()=>{
 const closed={open:false,isConnected:true},opened={open:true,isConnected:true};const {events}=renderer([closed,opened]);
 assert.equal(closed.open,false);events.beforeprint();assert.equal(closed.open,true);events.beforeprint();events.afterprint();assert.equal(closed.open,false);assert.equal(opened.open,true);
});
test('removed preview details are ignored during print cleanup',()=>{
 const detail={open:false,isConnected:true};const {events}=renderer([detail]);events.beforeprint();detail.isConnected=false;events.afterprint();assert.equal(detail.open,true);events.afterprint();
});
test('print lifecycle can run again for a subsequent document',()=>{
 const detail={open:false,isConnected:true};const {events}=renderer([detail]);for(let i=0;i<2;i++){events.beforeprint();assert.equal(detail.open,true);events.afterprint();assert.equal(detail.open,false);}
});
