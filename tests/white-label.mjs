import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function instance(config,artist={}) {
  const data=new Map(Object.entries({config_global:config,artistas:[{id:'a1',nombre:'Artista',pro_active:true,afiliado_verificado:false,...artist}],secciones:[]}).map(([k,v])=>[k,JSON.stringify(v)]));
  const writes=[];
  return {data,writes,env:{ADMIN_KEY:'test-key',UADAV_DB:{async get(k){return data.get(k)||null},async put(k,v){writes.push(k);data.set(k,v)}}}};
}
async function request(site,path,method='GET',body,admin=false) {
 const r=await worker.fetch(new Request('https://instance.test'+path,{method,headers:{...(admin?{Authorization:'Bearer test-key'}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),site.env,{});
 return {status:r.status,data:await r.json()};
}
const commercial=instance({branding:{name:'BeatPlay',primary_color:'#00aaff',support_email:'hola@example.test'},modules:{union:false,marketplace:false,events:false}});
for(const path of ['/api/cct/categories','/api/admin/cct/config','/api/admin/cct/scales','/api/artist/cct/history','/api/marketplace/request','/api/admin/marketplace/requests','/api/contrataciones','/api/ticketing/orders']) {
 const result=await request(commercial,path,'POST',{});
 assert.equal(result.status,404,path);assert.equal(result.data.code,'MODULE_DISABLED',path);
}
assert.equal(commercial.writes.length,0,'disabled routes must not mutate KV');
const institutional=instance({modules:{union:true}});
assert.equal((await request(institutional,'/api/cct/categories')).status,200);
assert.equal((await request(institutional,'/api/admin/cct/config')).status,401,'module enabled must retain admin auth');
assert.equal((await request(institutional,'/api/admin/cct/config','GET',undefined,true)).status,200);
assert.equal((await request(instance({} ),'/api/cct/categories')).status,404,'union opt-in');
const seo=await request(commercial,'/api/seo/head');
assert.equal(seo.data.brand.name,'BeatPlay');assert.equal(seo.data.brand.primary_color,'#00aaff');
assert.equal(seo.data.brand.support_email,'hola@example.test');assert.equal(seo.data.modules.union,false);
assert.equal((await request(commercial,'/api/platform_info')).data.service,'BeatPlay');
const active=instance({modules:{marketplace:true}});
const form={artist_id:'a1',requester_name:'Cliente',requester_email:'cliente@example.test'};
assert.equal((await request(active,'/api/marketplace/request','POST',form)).status,200,'PRO without union affiliation');
assert.equal((await request(instance({}, {pro_active:false}),'/api/marketplace/request','POST',form)).status,200,'Free artists can receive marketplace requests');
assert.equal((await request(instance({}, {pro_expires:'2020-01-01'}),'/api/marketplace/request','POST',form)).status,200,'Expired PRO retains free marketplace access');
assert.equal((await request(instance({}, {visible:false}),'/api/marketplace/request','POST',form)).status,403,'hidden profile denied');
assert.equal((await request(instance({modules:{ticketing:false}}),'/api/ticketing/orders')).status,404);
assert.equal((await request(active,'/api/ticketing/orders')).status,404,'Ticket is disabled by default');
assert.equal((await request(instance({modules:{ticketing:true}}),'/api/ticketing/orders')).status,401,'Enabling Ticket does not bypass authorization');
const broken=instance({});broken.env.UADAV_DB.get=async()=>{throw Error('KV unavailable')};
assert.equal((await request(broken,'/api/cct/categories')).status,503,'do not enable institutional modules when config is unavailable');
console.log('PASS: Worker module gates, identity, authorization, independent KV and PRO without affiliation');
