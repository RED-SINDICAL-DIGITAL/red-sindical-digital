const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','entrar-correo.html'),'utf8');
const controller=readFileSync(join(__dirname,'..','uadav-account-email.js'),'utf8');
const match=html.match(/<script id="accountEmailBootstrap">([\s\S]*?)<\/script>/);
assert.ok(match,'Email bootstrap should exist');
function bootstrap(origin,hash='',search=''){
 const replaced=[];
 const context={location:{origin,pathname:'/entrar-correo.html',hash,search},history:{replaceState:(...a)=>replaced.push(a)},URLSearchParams,window:{}};
 vm.runInNewContext(match[1],context,{timeout:1000});
 return {intent:context.window.UADAVAccountEmailIntent.take(),replaced};
}
test('email access refuses arbitrary staging previews while retaining canonical staging',()=>{
 assert.equal(bootstrap('https://uadav-stream-staging.pages.dev').intent,null);
 const blocked=bootstrap('https://fcfa07de.uadav-stream-staging.pages.dev');
 assert.equal(blocked.intent.invalid,true);
 assert.deepEqual(blocked.replaced.map(x=>x.length),[3]);
});
test('email access rejects preview even with syntactically valid access link',()=>{
 const hash='#id=123e4567-e89b-42d3-a456-426614174000&purpose=access&token='+'a'.repeat(64);
 const canonical=bootstrap('https://uadav-stream-staging.pages.dev',hash).intent;
 assert.equal(canonical.purpose,'access');
 assert.equal(canonical.token,'a'.repeat(64));
 assert.equal(bootstrap('https://fcfa07de.uadav-stream-staging.pages.dev',hash).intent.invalid,true);
});
test('email controller keeps independent canonical-origin gate and staging worker routing',()=>{
 assert.match(controller,/https:\/\/uadav-stream-staging\.pages\.dev/);
 assert.match(controller,/uadav-api-staging\.uadavstream\.workers\.dev/);
 assert.match(controller,/Abrí este acceso desde el sitio autorizado/);
});
