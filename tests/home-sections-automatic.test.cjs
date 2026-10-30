const test=require('node:test'),assert=require('node:assert/strict');
const home=require('../uadav-home-sections.js');
const row=(id,title)=>({id,title,url:'https://www.youtube.com/watch?v='+id,provider:'youtube',tipo:'video'});
const a=row('IBnshjEceKA','Masterboy'),b=row('ZUSn9OI3l_g','Ballet clásico');
test('hybrid keeps manual items first and deduplicates the same YouTube video',async()=>{
const result=await home.loadModels([{id:'mix',modo:'hybrid',items:[a.id],query:'Ballet',max_items:3}],[a,b],{search:async()=>[{videoId:a.id,title:'same'},{videoId:b.id,title:'same ballet'},{videoId:'UIdwWJEfBH4',title:'Circo'}]});
assert.deepEqual(result[0].items.map(x=>x.external_id||x.id),[a.id,b.id,'UIdwWJEfBH4']);
});
test('a failed automatic source preserves manual content and reports incomplete results',async()=>{
const result=await home.loadModels([{id:'mix',modo:'hybrid',items:[a.id],query:'unknown'}],[a],{search:async()=>{throw Error('offline')}});
assert.equal(result[0].items[0].id,a.id);assert.equal(result[0].incomplete,true);
});
test('manual rows are delivered before a pending automatic search and shared queries run once',async()=>{
let finish,calls=0,initial;const pending=new Promise(resolve=>finish=resolve);const task=home.loadModels([{id:'manual',items:[a.id]},{id:'auto1',modo:'auto',query:' Ballet '},{id:'auto2',modo:'auto',query:'ballet'}],[a],{onInitial:rows=>initial=rows,search:()=>{calls++;return pending}});
await Promise.resolve();assert.equal(initial[0].id,'manual');assert.equal(initial[1].pending,true);assert.equal(calls,1);finish([{videoId:b.id,title:'Ballet'}]);const rows=await task;assert.deepEqual(rows.map(x=>x.id),['manual','auto1','auto2']);
});
test('local filtering searches the full catalog and matches accent-insensitively',()=>{
const catalog=Array.from({length:30},(_,i)=>row(String(i),'Other'));catalog.push(b);
assert.equal(home.automaticCatalog({query:'bállet clásico'},catalog,[])[0].id,b.id);
assert.deepEqual(home.automaticCatalog({},catalog,[]),[]);
});
test('collection scopes cannot escape a hidden or missing collection and external media exclude private records',async()=>{
assert.deepEqual(home.automaticCatalog({collection_id:'missing'},[a],[]),[]);
assert.deepEqual(home.automaticCatalog({collection_id:'hidden'},[a],[{id:'hidden',active:false,items:[a.id]}]),[]);
let called=false;const result=await home.loadModels([{id:'c',modo:'auto',collection_id:'base',query:'Masterboy'}],[a,b],{collections:[{id:'base',items:[a.id]}],search:async()=>{called=true;return[]}});assert.equal(called,false);assert.equal(result[0].items.length,1);
assert.equal(home.externalMedia([{videoId:a.id,private:true},{videoId:b.id},{id:'bad'}]).length,1);
});

test('empty successful searches retain their section with an explicit empty state',async()=>{const rows=await home.loadModels([{id:'empty',modo:'auto',query:'nothing'}],[],{search:async()=>[]});assert.equal(rows.length,1);assert.equal(rows[0].automatic,true);assert.equal(rows[0].items.length,0);assert.equal(rows[0].incomplete,undefined)});

test('external rows retain the source channel and never label missing authors as UADAV',()=>{const rows=home.externalMedia([{videoId:'IBnshjEceKA',channel:{name:'MasterboyVEVO'}},{videoId:'ZUSn9OI3l_g',canal:'Fundación Konex'},{videoId:'UIdwWJEfBH4'}]);assert.deepEqual(rows.map(x=>x.author),['MasterboyVEVO','Fundación Konex','YouTube'])});
