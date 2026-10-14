import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {webcrypto} from 'node:crypto';import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../worker.js',import.meta.url),'utf8')).toString('base64'));
const DB=sqliteD1(),kv=new Map(),id='QA-KIT-PRIVACY',token='ART-kit-privacy-123456789';
const env={DB,ADMIN_KEY:'local-kit-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}};
kv.set('artistas',JSON.stringify([{id,nombre:'Ficticio',visible:true,presskit_enabled:true}]));kv.set('moderation_settings',JSON.stringify({enabled:false}));kv.set('artist_access_'+token,JSON.stringify({artist_id:id,expires:Date.now()+3600000}));
async function call(route,method='GET',body,auth=token){const r=await worker.fetch(new Request('https://isolated.example/api/'+route,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{});return {status:r.status,data:await r.json(),cache:r.headers.get('Cache-Control')};}
try{
 await call('artist/plan?token='+token);
 assert.equal((await call('admin/artist-plan','PUT',{artist_id:id,plan:'pro',pro_expires_at:new Date(Date.now()+86400000).toISOString(),ai_enabled:false},env.ADMIN_KEY)).status,200);
 const data={kit:{name:'Presentación ficticia',bio:'Biografía pública',contact:'HIDDEN-CONTACT',trajectory:'HIDDEN-TRAJECTORY',video:'https://example.invalid/HIDDEN-VIDEO',appearance:{hidden_sections:['contact','trajectory','video','shows'],accent:'blue'}},shows:[{name:'HIDDEN-SHOW',price:'PRIVATE-PRICE'}],quotes:[{client:'PRIVATE-CLIENT',fee:'PRIVATE-FEE'}],agenda:[{notes:'PRIVATE-AGENDA'}],leads:[{contact:'PRIVATE-LEAD'}]};
 const published=await call('artist/workspace','PUT',{revision:0,data,publication:'publish'});assert.equal(published.status,200);assert.equal(published.data.published,true);
 const stored=await DB.prepare('SELECT public_json FROM artist_workspaces WHERE artist_id=?').bind(id).first();assert.equal(stored.public_json.includes('HIDDEN-CONTACT'),false,'new published snapshots must omit hidden data');
 // Legacy/oversized snapshots must be filtered at read time as well.
 await DB.prepare('UPDATE artist_workspaces SET public_json=? WHERE artist_id=?').bind(JSON.stringify({artist_id:'incorrect-legacy-id',...data,updated_at:new Date().toISOString()}),id).run();
 const publicKit=await call('public/presskit?artist_id='+id,'GET',null,'');assert.equal(publicKit.status,200);assert.equal(publicKit.cache,'no-store');
 assert.equal(publicKit.data.artist_id,id);assert.equal(publicKit.data.quotes,undefined);assert.equal(publicKit.data.agenda,undefined);assert.equal(publicKit.data.leads,undefined);
 for(const marker of ['HIDDEN-CONTACT','HIDDEN-TRAJECTORY','HIDDEN-VIDEO','HIDDEN-SHOW','PRIVATE-PRICE','PRIVATE-CLIENT','PRIVATE-FEE','PRIVATE-AGENDA','PRIVATE-LEAD'])assert.equal(JSON.stringify(publicKit.data).includes(marker),false,marker+' must stay private');
 assert.equal((await call('artist/workspace','GET',null,'')).status,401);
 const privateKit=await call('artist/workspace');assert.equal(privateKit.data.data.kit.contact,'HIDDEN-CONTACT');assert.equal(privateKit.data.data.quotes[0].client,'PRIVATE-CLIENT');
 data.kit.bio='Nueva versión privada';await call('artist/workspace','PUT',{revision:1,data});assert.equal((await call('public/presskit?artist_id='+id,'GET',null,'')).data.kit.bio,'Biografía pública');
 kv.set('moderation_settings',JSON.stringify({enabled:true,provider:'groq',daily_limit:10}));
 const pending=await call('artist/workspace','PUT',{revision:2,data,publication:'publish'});assert.equal(pending.data.moderation_pending,true);assert.equal((await call('public/presskit?artist_id='+id,'GET',null,'')).data.kit.bio,'Biografía pública');
 const removed=await call('artist/workspace','PUT',{revision:3,data,publication:'unpublish'});assert.equal(removed.status,200);assert.equal(removed.data.published,false);assert.equal((await call('public/presskit?artist_id='+id,'GET',null,'')).status,404);
 assert.equal((await call('artist/workspace')).data.data.kit.contact,'HIDDEN-CONTACT');
 console.log('PASS: actual Worker + SQLite Press Kit privacy, hidden fields absent from public JSON, private tools retained, draft isolation, moderation preserves published version and unpublish retains private data.');
}finally{DB.close()}
