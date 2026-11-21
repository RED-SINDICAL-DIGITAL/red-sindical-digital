import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
test('legacy worker retires without cache purge or navigation of open tabs',async()=>{
 const handlers={};let skipped=0,unregistered=0,completion;
 vm.runInNewContext(source,{self:{addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting(){skipped++},registration:{async unregister(){unregistered++;return true}}},caches:{keys(){throw Error('origin caches must remain untouched')},delete(){throw Error('cache deletion forbidden')}},clients:{matchAll(){throw Error('open work must not be navigated')}}});
 handlers.install();handlers.activate({waitUntil:p=>completion=p});await completion;
 assert.equal(skipped,1);assert.equal(unregistered,1);assert.equal(handlers.fetch,undefined);
 assert.deepEqual(Object.keys(handlers).sort(),['activate','install']);
});
