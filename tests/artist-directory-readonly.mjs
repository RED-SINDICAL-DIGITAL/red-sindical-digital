import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sqliteD1} from './sqlite-d1.mjs';
const source=await readFile(new URL('../qa/admin-v2/worker.js',import.meta.url));
const {default:worker}=await import('data:text/javascript;base64,'+source.toString('base64'));
const DB=sqliteD1();
const catalog={artistas:[null,{id:'a',nombre:'QA'},{id:'b',visible:false}],secciones:[{tipo_contenido:'perfiles',items:[null,{id:'c',nombre:'QA 2'}]}]};
const env={DB,UADAV_DB:{get:async key=>JSON.stringify(catalog[key]??null)}};
async function ids(){
 const response=await worker.fetch(new Request('https://test.invalid/api/artistas'),env,{});
 assert.equal(response.status,200);
 return (await response.json()).map(a=>a.id);
}
try{
 assert.deepEqual(await ids(),['a','c']);
 assert.equal(await DB.prepare("SELECT name FROM sqlite_master WHERE name='artist_deletions'").first(),null);
 await DB.prepare('CREATE TABLE artist_deletions(artist_id TEXT PRIMARY KEY,channel_id TEXT)').run();
 await DB.prepare("INSERT INTO artist_deletions VALUES('c',NULL)").run();
 assert.deepEqual(await ids(),['a']);
}finally{DB.close()}
