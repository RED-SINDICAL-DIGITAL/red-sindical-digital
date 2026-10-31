import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {loadWorker} from './load-worker.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await loadWorker();
for(const period of ['esta-semana','este-mes']){
  test(`${period} excludes past, undated and out-of-period events`,async()=>{
    const today=new Date().toISOString().slice(0,10);
    const events=[{id:'old',fecha:'2000-01-01'},{id:'current',fecha:today},{id:'future',fecha:'2099-12-31'},{id:'undated'}].map(e=>({...e,titulo:e.id,estado:'published'}));
    const env={UADAV_DB:{get:async k=>k==='cartelera_aprobada'?JSON.stringify(events):null}};
    const r=await worker.fetch(new Request(`https://isolated.invalid/api/cartelera?when=${period}`),env,{});
    assert.equal(r.status,200);
    assert.deepEqual((await r.json()).map(e=>e.id),['current']);
  });
}
test('unfiltered catalog retains historical events for explicit browsing',async()=>{
  const env={UADAV_DB:{get:async k=>k==='cartelera_aprobada'?JSON.stringify([{id:'old',titulo:'Anterior',fecha:'2000-01-01',estado:'published'}]):null}};
  const r=await worker.fetch(new Request('https://isolated.invalid/api/cartelera'),env,{});
  assert.deepEqual((await r.json()).map(e=>e.id),['old']);
});

test('este-mes includes the last UTC day even when the runtime timezone is ahead of UTC',async()=>{
 const NativeDate=globalThis.Date,previousTZ=process.env.TZ;const fixed='2026-10-31T12:00:00.000Z';
 class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return NativeDate.parse(fixed)}}
 process.env.TZ='Pacific/Auckland';globalThis.Date=FixedDate;
 try{const events=[{id:'last-day',fecha:'2026-10-31'},{id:'next-month',fecha:'2026-11-01'}].map(e=>({...e,titulo:e.id,estado:'published'}));const env={UADAV_DB:{get:async k=>k==='cartelera_aprobada'?JSON.stringify(events):null}};const r=await worker.fetch(new Request('https://isolated.invalid/api/cartelera?when=este-mes'),env,{});assert.deepEqual((await r.json()).map(e=>e.id),['last-day']);}
 finally{globalThis.Date=NativeDate;if(previousTZ===undefined)delete process.env.TZ;else process.env.TZ=previousTZ;}
});
