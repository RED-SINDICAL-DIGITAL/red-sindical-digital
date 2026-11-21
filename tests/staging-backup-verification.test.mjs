import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyBackup} from '../scripts/verify-staging-backup.mjs';
const make=()=>({
 generated_at:'2026-11-10T13:00:00Z',
 kv:{bolsa_trabajo:[{id:'JOB-QA'}],postulaciones_trabajo:[],radios:[]},
 tables:{jobs:[{id:'JOB-QA'}],job_applications:[],events:[],radios:[],audience_accounts:[],audience_devices:[],audience_artist_links:[],radio_operators:[]},
 backup_integrity:{complete:true,d1_configured:true,missing_critical_kv:[]}
});
test('intact synthetic backup passes without revealing records',()=>{
 const outcome=verifyBackup(make());
 assert.equal(outcome.ok,true);
 assert.equal(outcome.kvCollections,3);
 assert.equal(outcome.d1Tables,8);
 assert.equal(JSON.stringify(outcome).includes('JOB-QA'),false);
});
test('missing or malformed critical KV blocks release',()=>{
 for(const invalid of [undefined,null,{},'not an array']){
  const data=make();data.kv.bolsa_trabajo=invalid;
  assert.equal(verifyBackup(data).ok,false);
 }
});
test('incomplete export cannot be treated as restorable',()=>{
 const data=make();data.backup_integrity.complete=false;
 assert.equal(verifyBackup(data).ok,false);
});
test('D1 tables must be arrays and configured',()=>{
 const data=make();data.tables.events={error:'unavailable'};
 assert.equal(verifyBackup(data).ok,false);
 const noD1=make();noD1.backup_integrity.d1_configured=false;
 assert.equal(verifyBackup(noD1).ok,false);
});
test('API may report KV failures and missing collections',()=>{
 const data=make();data.kv.other={error:'read failed'};
 assert.equal(verifyBackup(data).ok,false);
 const missing=make();missing.backup_integrity.missing_critical_kv=['bolsa_trabajo'];
 assert.equal(verifyBackup(missing).ok,false);
});
test('malformed document and timestamps are rejected',()=>{
 assert.equal(verifyBackup(null).ok,false);
 const data=make();data.generated_at='not-a-date';
 assert.equal(verifyBackup(data).ok,false);
});

test('empty D1 table inventory cannot pass even if report says complete',()=>{
 const data=make();data.tables={};
 assert.equal(verifyBackup(data).ok,false);
});
test('unspecified D1 binding cannot pass by omission',()=>{
 const data=make();delete data.backup_integrity.d1_configured;
 assert.equal(verifyBackup(data).ok,false);
});

test('account, content and radio permission tables cannot be omitted from a complete backup',()=>{
 for(const table of ['jobs','job_applications','events','radios','audience_accounts','audience_devices','audience_artist_links','radio_operators']){
  for(const invalid of [undefined,null,{},'not an array']){
   const data=make();
   if(invalid===undefined)delete data.tables[table];else data.tables[table]=invalid;
   const result=verifyBackup(data);
   assert.equal(result.ok,false,table);
   assert.ok(result.failures.includes('Critical D1 table missing or invalid: '+table));
  }
 }
});
test('radio catalog is required even if the backend declares the export complete',()=>{
 const data=make();delete data.kv.radios;
 assert.equal(verifyBackup(data).ok,false);
});
