#!/usr/bin/env node
// Local-only backup integrity checker. Does not connect to Cloudflare or send/print data.
// Usage: node scripts/verify-staging-backup.mjs /private/path/staging-backup.json
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export function verifyBackup(value){
 const failures=[];
 if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,failures:['Invalid backup object']};
 if(typeof value.generated_at!=='string'||!Number.isFinite(Date.parse(value.generated_at)))failures.push('Missing or invalid generation timestamp');
 if(!value.kv||typeof value.kv!=='object'||Array.isArray(value.kv))failures.push('Missing KV object');
 if(!value.tables||typeof value.tables!=='object'||Array.isArray(value.tables))failures.push('Missing D1 tables object');
 if(value.backup_integrity?.complete!==true)failures.push('Backup integrity not explicitly confirmed complete');
 if(value.backup_integrity?.d1_configured===false)failures.push('D1 is not configured');
 const kv=value.kv&&typeof value.kv==='object'&&!Array.isArray(value.kv)?value.kv:{};
 const tables=value.tables&&typeof value.tables==='object'&&!Array.isArray(value.tables)?value.tables:{};
 for(const name of ['bolsa_trabajo','postulaciones_trabajo']){
  if(!Array.isArray(kv[name]))failures.push('Critical KV collection invalid: '+name);
 }
 for(const [name,rows] of Object.entries(kv)){
  if(rows&&typeof rows==='object'&&!Array.isArray(rows)&&Object.hasOwn(rows,'error'))failures.push('KV error: '+name);
 }
 for(const [name,rows] of Object.entries(tables)){
  if(!Array.isArray(rows))failures.push('D1 table invalid: '+name);
 }
 if(Array.isArray(value.backup_integrity?.missing_critical_kv)&&value.backup_integrity.missing_critical_kv.length)failures.push('Declared missing critical KV collections');
 if(value.backup_integrity?.errors?.length)failures.push('Declared integrity errors');
 return {ok:failures.length===0,failures,kvCollections:Object.keys(kv).length,d1Tables:Object.keys(tables).length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path=process.argv[2];
 if(!path){console.error('Usage: node scripts/verify-staging-backup.mjs /private/path/backup.json');process.exitCode=2}
 else {
  try{
   const bytes=await readFile(path);
   const sha256=createHash('sha256').update(bytes).digest('hex');
   const result=verifyBackup(JSON.parse(bytes.toString('utf8')));
   // Never show filenames, record values, email addresses, tokens, or source rows.
   console.log(JSON.stringify({verified:result.ok,sha256,kvCollections:result.kvCollections,d1Tables:result.d1Tables,failures:result.failures},null,2));
   if(!result.ok)process.exitCode=1;
  }catch(error){console.error('Backup could not be parsed or read locally. No changes were made.');process.exitCode=2}
 }
}
