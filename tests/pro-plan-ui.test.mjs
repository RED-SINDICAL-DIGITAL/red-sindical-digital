import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../gestionar-artista.html',import.meta.url),'utf8');
const start=source.indexOf('async function loadProOrder()'),end=source.indexOf('async function refreshProStatus()',start),fn=source.slice(start,end);
function client(order=null,enabled=false,pro=false){
 const box={isConnected:true},button={disabled:false};
 const c={artist:{id:'ART-QA'},token:'synthetic',currentTab:'plan',document:{getElementById:id=>id==='proOrderBox'?box:id==='createProOrder'?button:null},encodeURIComponent,esc:x=>String(x??''),artistHasCurrentPro:()=>pro,reportProPayment(){},get:async path=>path.startsWith('pro/payment-orders/current')?{order}:{enabled,monthly_amount:500,currency:'ARS'}};
 vm.createContext(c);vm.runInContext(fn,c);return {c,box,button};
}
test('PRO button starts disabled while checking configuration',()=>{assert(source.includes('id="createProOrder" disabled>Elegir mi PRO'))});
test('disabled collection never enables creating an order',async()=>{const x=client();await x.c.loadProOrder();assert.equal(x.button.disabled,true);assert.match(x.box.innerHTML,/todavía no habilitado/)});
test('enabled configuration with a price permits creating an order',async()=>{const x=client(null,true);await x.c.loadProOrder();assert.equal(x.button.disabled,false)});
test('approved historical payment does not claim expired PRO is active',async()=>{const x=client({id:'ORDER-QA',status:'approved'},false,false);await x.c.loadProOrder();assert.match(x.box.innerHTML,/Pago confirmado/);assert.match(x.box.innerHTML,/vigencia actual/);assert(!x.box.innerHTML.includes('Tu PRO está activo'));assert(x.button.disabled)});
test('approved payment with current PRO shows current access',async()=>{const x=client({id:'ORDER-QA',status:'approved'},false,true);await x.c.loadProOrder();assert.match(x.box.innerHTML,/Tu PRO está activo/)});
test('response after artist change cannot enable another artist purchase button',async()=>{const x=client(null,true);x.c.get=async()=>{x.c.artist={id:'OTHER'};return {enabled:true,monthly_amount:500}};await x.c.loadProOrder();assert.equal(x.button.disabled,true);assert.equal(x.box.innerHTML,undefined)});
test('late failure after navigation cannot write into removed plan',async()=>{const x=client();x.c.get=async()=>{x.c.currentTab='perfil';throw Error('late failure')};await x.c.loadProOrder();assert.equal(x.box.textContent,undefined)});

test('expired confirmed order permits renewal only with enabled priced periods',async()=>{const x=client({id:'ORDER-QA',status:'approved'},true,false);await x.c.loadProOrder();assert.equal(x.button.disabled,false);assert.match(x.box.innerHTML,/Nuevo período PRO/);assert.match(x.box.innerHTML,/value="monthly"/)});
test('pending order cannot start a duplicate purchase',async()=>{const x=client({id:'ORDER-QA',status:'pending'},true,false);await x.c.loadProOrder();assert.equal(x.button.disabled,true);assert(!x.box.innerHTML.includes('Nuevo período PRO'))});
