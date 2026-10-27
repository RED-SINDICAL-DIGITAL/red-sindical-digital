// Isolated transaction experiment: never connects to staging or production.
import assert from 'node:assert/strict';
import {sqliteD1} from '../tests/sqlite-d1.mjs';
const db=sqliteD1();
try {
 await db.prepare('CREATE TABLE qa_requests (request_id TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, event_id TEXT NOT NULL)').run();
 await db.prepare('CREATE TABLE qa_events (id TEXT PRIMARY KEY, title TEXT NOT NULL)').run();
 async function publish(requestId,hash,eventId,title,{fault=false}={}) {
  const statements=[db.prepare('INSERT OR IGNORE INTO qa_requests VALUES(?,?,?)').bind(requestId,hash,eventId),db.prepare('INSERT OR IGNORE INTO qa_events SELECT ?,? WHERE EXISTS(SELECT 1 FROM qa_requests WHERE request_id=? AND payload_hash=? AND event_id=?)').bind(eventId,title,requestId,hash,eventId)];
  if(fault)statements.push(db.prepare('INSERT INTO qa_missing_table VALUES(1)'));
  await db.batch(statements);
  const saved=await db.prepare('SELECT * FROM qa_requests WHERE request_id=?').bind(requestId).first();
  return saved.payload_hash===hash?{id:saved.event_id}:{error:'conflict'};
 }
 const [a,b]=await Promise.all([publish('r1','hash-a','e1','Evento'),publish('r1','hash-a','e2','Evento')]);
 assert.equal(a.id,b.id);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM qa_events').first()).n,1);
 assert.equal((await publish('r1','hash-b','e3','Otro')).error,'conflict');
 await assert.rejects(()=>publish('r2','hash-c','e4','Falla',{fault:true}));
 assert.equal(await db.prepare('SELECT * FROM qa_requests WHERE request_id=?').bind('r2').first(),null);
 assert.equal((await publish('r2','hash-c','e5','Recuperado')).id,'e5');
 console.log(JSON.stringify({scope:'isolated-sqlite-transaction-prototype',same_id:true,one_event:true,conflicting_payload_rejected:true,rollback:true,retry:true,remote_writes:false}));
} finally {db.close()}
