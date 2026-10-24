import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {sqliteD1} from './sqlite-d1.mjs';
test('el SQL unificado es idempotente y conserva credenciales ya existentes',async()=>{
  const db=sqliteD1();
  try{
    const source=await readFile(new URL('../migrations/staging/20261024_bolsa_completa.sql',import.meta.url),'utf8');
    const statements=source.replace(/--[^\n]*/g,'').split(';').map(x=>x.trim()).filter(Boolean);
    assert(statements.every(x=>/^(CREATE|SELECT)\b/i.test(x)),'el instalador no puede borrar, actualizar ni migrar datos');
    const install=async()=>{for(const sql of statements)await db.prepare(sql).run()};
    await install();
    const hash='a'.repeat(64);await db.prepare('INSERT INTO job_owner_credentials(job_id,secret_hash,revision,updated_at) VALUES(?,?,3,?)').bind('JOB-SCHEMA-QA',hash,'2026-10-24T00:00:00Z').run();
    await install();
    const saved=await db.prepare('SELECT secret_hash,revision FROM job_owner_credentials WHERE job_id=?').bind('JOB-SCHEMA-QA').first();assert.equal(saved.secret_hash,hash);assert.equal(saved.revision,3);
    const tables=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'job_%'").all()).results.map(x=>x.name);assert.equal(tables.length,7);
  }finally{db.close()}
});
test('el instalador funciona pegado en una sola línea en la consola D1',async()=>{
  const source=await readFile(new URL('../migrations/staging/20261024_bolsa_completa.sql',import.meta.url),'utf8');
  assert.doesNotMatch(source,/--|\/\*/,'un comentario puede ocultar todo el SQL al perderse los saltos de línea');
  const flattened=source.replace(/\s+/g,' ');
  const result=execFileSync('python3',['-c',"import sys,sqlite3,json; db=sqlite3.connect(':memory:'); db.executescript(sys.stdin.read()); print(json.dumps([x[0] for x in db.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'job_%' ORDER BY name\")]))"],{input:flattened,encoding:'utf8'});
  const tables=JSON.parse(result);assert.equal(tables.length,7);assert(tables.includes('job_owner_credentials'));assert(tables.includes('job_store_records'));
});
