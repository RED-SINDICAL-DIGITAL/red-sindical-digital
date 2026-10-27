import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {loadWorker} from './load-worker.mjs';
import {sqliteD1} from './sqlite-d1.mjs';
globalThis.crypto ||= webcrypto;
const {default:worker}=await loadWorker();
const fixture=()=>{const DB=sqliteD1(),kv=new Map();return {DB,kv,env:{DB,ADMIN_KEY:'synthetic-admin',UADAV_DB:{get:async k=>kv.get(k)||null,put:async(k,v)=>kv.set(k,v)}}}};
const base={titulo:'Prueba local de fecha',fecha:'2028-02-29',lugar:'Sala ficticia',funciones:[{fecha:'2028-02-29',hora:'20:30'}]};
async function call(f,body,{route='eventos',method='POST',admin=true}={}){return worker.fetch(new Request('https://isolated.invalid/api/'+route,{method,headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer synthetic-admin'}:{})},body:JSON.stringify(body)}),f.env,{})}
test('invalid dates and functions fail before any KV write, including public and admin routes',async()=>{for(const patch of [{fecha:'2026-02-30'},{fecha:'2027-02-29'},{fecha:'2026-13-01'},{fecha:'2026-12-01T25:00'},{fecha_fin:'2027-01-01'},{funciones:[{fecha:'2026-02-30',hora:'20:30'}]},{funciones:[{fecha:'2028-02-29',hora:'24:00'}]},{funciones:Array(51).fill(base.funciones[0])},{funciones:'bad'}])for(const route of ['eventos','cartelera']){const f=fixture();try{const r=await call(f,{...base,...patch},{route});assert.equal(r.status,400,JSON.stringify(patch));assert.equal(f.kv.size,0)}finally{f.DB.close()}}});
test('public event rejects invalid schedule without authentication',async()=>{const f=fixture();try{const r=await call(f,{...base,fecha:'2026-02-30'},{admin:false});assert.equal(r.status,400);assert.equal(f.kv.size,0)}finally{f.DB.close()}});
test('valid leap day and function remain intact in the published event',async()=>{const f=fixture();try{const r=await call(f,base);assert.equal(r.status,200);const result=await r.json();assert.deepEqual(result.item.funciones,base.funciones);assert.equal(result.item.fecha,base.fecha)}finally{f.DB.close()}});
test('admin edits reject invalid supplied dates before mutation',async()=>{const f=fixture();try{const r=await call(f,{id:'missing',fecha:'2026-02-30'},{route:'cartelera',method:'PUT'});assert.equal(r.status,400);assert.equal(f.kv.size,0)}finally{f.DB.close()}});
test('editing only the end compares against the stored start without modifying it',async()=>{const f=fixture();try{const original={id:'EV-QA',titulo:'Existente',fecha_inicio:'2028-02-29',fecha:'2028-02-29',estado:'published'};f.kv.set('cartelera_aprobada',JSON.stringify([original]));const before=f.kv.get('cartelera_aprobada');const r=await call(f,{id:original.id,fecha_fin:'2028-02-28'},{route:'cartelera',method:'PUT'});assert.equal(r.status,400);assert.equal(f.kv.get('cartelera_aprobada'),before)}finally{f.DB.close()}});
