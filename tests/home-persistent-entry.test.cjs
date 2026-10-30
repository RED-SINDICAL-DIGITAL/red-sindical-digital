const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index-v117.html','utf8');
const source=html.match(/<script id="home-app-entry">([\s\S]*?)<\/script>/)[1];
function run(pathname,search='',hash='',embedded=false){const redirects=[],window={};window.parent=embedded?{}:window;vm.runInNewContext(source,{window,location:{pathname,search,hash,replace:url=>redirects.push(url)},encodeURIComponent});return redirects}
test('direct home links enter the persistent player on desktop and mobile without a separate modal',()=>{
for(const path of ['/index-v117','/index-v117.html']){const results=run(path);assert.equal(results.length,1);const url=new URL(results[0],'https://staging.example');assert.equal(url.pathname,'/app.html');assert.equal(url.searchParams.get('view'),path)}
});
test('entry retains the home filter and section anchor as an inner route',()=>{
const [to]=run('/index-v117','?category=musica','#artistsSection');assert.equal(new URL(to,'https://staging.example').searchParams.get('view'),'/index-v117?category=musica#artistsSection');
});
test('embedded home and responsive previews never create a nested shell or redirect loop',()=>{
assert.deepEqual(run('/index-v117','?rev=12059','',true),[]);
assert.ok(html.indexOf('id="home-app-entry"')<html.indexOf('/uadav-api-config.js'));
});
