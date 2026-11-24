import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqliteD1} from './sqlite-d1.mjs';
const source=await readFile(new URL('../worker.js',import.meta.url));
const {default:worker}=await import('data:text/javascript;base64,'+source.toString('base64'));
const db=sqliteD1();
const env={DB:db,ADMIN_KEY:'qa-only',UADAV_DB:{get:async()=>null}};
const send=async body=>worker.fetch(new Request('https://qa.invalid/api/admin/announcements',{method:'POST',headers:{Authorization:'Bearer qa-only','Content-Type':'application/json'},body:JSON.stringify(body)}),env,{});
try{
  for(const push of [false,true]){
    const body={title:'Prueba',message:'Aviso sintético',days:1,push,request_id:crypto.randomUUID()};
    const first=await send(body);
    assert.equal(first.status,200);
    const retry=await send(body);
    assert.equal(retry.status,200);
    assert.equal((await first.json()).id,(await retry.json()).id);
  }
  assert.equal((await db.prepare('SELECT count(*) AS n FROM audience_announcements').first()).n,2);
  const subscription=id=>db.prepare('INSERT INTO audience_push_subscriptions VALUES(?,?,?,?,?,?,?)').bind(id,'test-account','test-hash','https://qa.invalid/'+id,'test','test',new Date().toISOString()).run();
  await subscription('first');
  const notice={title:'Campana',message:'Prueba de cola',push:true,request_id:crypto.randomUUID()};
  assert.equal((await send(notice)).status,200);
  await subscription('later');
  assert.equal((await send(notice)).status,200);
  const queued=await db.prepare('SELECT subscription_id FROM audience_push_deliveries').all();
  assert.deepEqual(queued.results.map(row=>row.subscription_id),['first']);
  assert.equal((await send({title:'QA',message:'QA',request_id:'incorrecto'})).status,400);
  console.log('PASS reintentos de avisos con SQLite aislado');
}finally{db.close()}
