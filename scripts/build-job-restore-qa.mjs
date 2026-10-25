import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),target=new URL('releases/uadav-bolsa-restore-qa-11762.js',root);
const original=await readFile(new URL('worker.js',root),'utf8');
if(!original.includes("const BUILD = '11762';"))throw Error('Update the QA adapter version and review its fixtures for the new core.');
const named=original.match(/^export \{[^}]+\};\s*$/gm)||[];
if(named.length!==2||!original.includes('export default uadavStagingWorker;'))throw Error('Unexpected core exports; review isolated adapter.');
const core=original.replace(/^export \{[^}]+\};\s*$/gm,'').replace(/^export default uadavStagingWorker;\s*$/m,'');
if(/^\s*export\s/m.test(core))throw Error('Unexpected exported platform entrypoint.');
const parents=[
 'CREATE TABLE audience_accounts(id TEXT PRIMARY KEY,data_json TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL)',
 'CREATE TABLE audience_devices(credential_hash TEXT PRIMARY KEY,id TEXT UNIQUE NOT NULL,account_id TEXT NOT NULL,name TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,revoked_at INTEGER)',
 'CREATE TABLE audience_recovery_keys(credential_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL,revoked_at INTEGER)',
 'CREATE TABLE audience_deletions(account_id TEXT PRIMARY KEY,deleted_at INTEGER NOT NULL)',
 'CREATE TABLE audience_announcements(id TEXT PRIMARY KEY,title TEXT NOT NULL,message TEXT NOT NULL,account_id TEXT,created_at TEXT NOT NULL,expires_at TEXT NOT NULL)'
];
const schema=[...parents];
for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql','20261024_job_accounts.sql','20261024_job_expiry_notices.sql']){
 const sql=await readFile(new URL('migrations/staging/'+file,root),'utf8');schema.push(...sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(s=>s&&!/^SELECT\b/i.test(s)));
}
schema.push('CREATE TABLE qa_restore_guard(purpose TEXT PRIMARY KEY,secret_hash TEXT NOT NULL,phase INTEGER NOT NULL CHECK(phase BETWEEN 0 AND 6),messages TEXT NOT NULL,lease_until INTEGER NOT NULL,lock_owner TEXT)');
const tables=schema.flatMap(sql=>{const hit=sql.match(/^CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);return hit?[hit[1]]:[]});
const runtime=await readFile(new URL('scripts/job-restore-qa-runtime.js',root),'utf8');
const output='/* QA ONLY: deploy as uadav-restore-qa with a NEW empty DB. Never replace uadav-api-staging or production. */\n'+core+'\nconst UADAV_RESTORE_QA_CORE_SHA256='+JSON.stringify(createHash('sha256').update(original).digest('hex'))+';\nconst UADAV_RESTORE_QA_SCHEMA='+JSON.stringify(schema)+';\nconst UADAV_RESTORE_QA_TABLES='+JSON.stringify(tables)+';\n'+runtime;
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==output)throw Error('QA adapter is stale. Run node scripts/build-job-restore-qa.mjs.');console.log('Isolated QA adapter matches its core and schema sources.')}else{await writeFile(target,output);console.log('Prepared isolated QA Worker; no deployment or remote database changes.');}
