const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const app=readFileSync(join(__dirname,'..','app.html'),'utf8');

test('PWA supplies modern mobile installation meta without removing Apple compatibility',()=>{
 assert.match(app,/<meta name="mobile-web-app-capable" content="yes">/);
 assert.match(app,/<meta name="apple-mobile-web-app-capable" content="yes">/);
 assert.match(app,/<link rel="manifest" href="\/manifest\.json">/);
});
test('navigation restores top on a new view but respects deep link hashes',()=>{
 assert.match(app,/if\(to!==current\)view\.dataset\.resetScrollOnLoad=new URL\(to,location\.origin\)\.hash\?'':'1'/);
 assert.match(app,/if\(view\.dataset\.resetScrollOnLoad==='1'\)\{view\.contentWindow\?\.scrollTo\(0,0\);delete view\.dataset\.resetScrollOnLoad\}/);
 assert.match(app,/view\.onload=\(\)=>/);
});
test('install prompt stays tied to actual user action',()=>{
 assert.match(app,/addEventListener\('beforeinstallprompt',event=>\{event\.preventDefault\(\);pending=event/);
 assert.match(app,/btn\.addEventListener\('click',async\(\)=>\{if\(!pending\)return/);
 assert.match(app,/await prompt\.prompt\(\)/);
});
test('existing PWA shell routes remain unchanged',()=>{
 assert.match(app,/if\(p==='\/usuario'\|\|p==='\/usuario\/'\)p='\/usuario\.html'/);
 assert.match(app,/frameURL\.searchParams\.set\('rev',routePath\(to\)==='\/usuario\.html'/);
});
test('all inline scripts remain valid JavaScript',()=>{
 for(const m of app.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
