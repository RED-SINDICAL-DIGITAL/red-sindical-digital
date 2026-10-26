import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root=new URL('../',import.meta.url),target=new URL('releases/uadav-bolsa-lab-11764.js',root);
const archive=fileURLToPath(new URL('releases/uadav-api-staging-11764.zip',root));
const original=execFileSync('python',['-c','import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("worker.js"))',archive],{encoding:'utf8',maxBuffer:2000000});
const digest=createHash('sha256').update(original).digest('hex');
if(digest!=='c98d9c5bcffec76beb68fb4075f8b967c019667923c425081d794191f0cff90f'||!original.includes("const BUILD = '11764';"))throw Error('The approved 11764 core changed. Review the lab before rebuilding.');
const named=original.match(/^export \{[^}]+\};\s*$/gm)||[];
if(named.length!==2||!original.includes('export default uadavStagingWorker;'))throw Error('Unexpected core exports.');
const core=original.replace(/^export \{[^}]+\};\s*$/gm,'').replace(/^export default uadavStagingWorker;\s*$/m,'');
if(/^\s*export\s/m.test(core))throw Error('An unexpected platform entrypoint remains.');
const accountStart=original.indexOf('async function uadavAccountSchema(db){');
const arrayStart=original.indexOf('for(const sql of [',accountStart)+'for(const sql of '.length;
const arrayEnd=original.indexOf('])await db.prepare(sql).run()',arrayStart)+1;
if(accountStart<0||arrayStart<accountStart||arrayEnd<=arrayStart)throw Error('Review the frozen audience schema.');
const schema=new Script('('+original.slice(arrayStart,arrayEnd)+')').runInNewContext();
if(!Array.isArray(schema)||schema.length<10||schema.some(sql=>typeof sql!=='string'||! /^(CREATE|UPDATE)\b/.test(sql)))throw Error('Unexpected audience schema.');
// The deployed platform already has these tables. Prepare their exact frozen
// definitions so a fresh lab does not invoke the unrelated full-platform bootstrap.
const bootstrapStart=original.indexOf('const D1_BOOTSTRAP_SQL = `')+'const D1_BOOTSTRAP_SQL = `'.length;
const bootstrapEnd=original.indexOf('`;',bootstrapStart);
const required=['cct_assessments','artist_plan_state','pro_payment_orders','audience_events','artist_owners','artist_claim_evidence','audit_log','notifications'];
const bootstrap=original.slice(bootstrapStart,bootstrapEnd).replace(/--[^\n]*/g,'').split(/;\s*(?:\n|$)/).map(s=>s.trim());
for(const table of required){const sql=bootstrap.find(s=>new RegExp('^CREATE TABLE IF NOT EXISTS '+table+' \\(').test(s));if(!sql)throw Error('Frozen platform readiness schema missing: '+table);schema.push(sql)}
for(const file of ['20261023_job_owner_credentials.sql','20261024_job_store.sql','20261024_job_accounts.sql','20261024_job_expiry_notices.sql']){
 const sql=await readFile(new URL('migrations/staging/'+file,root),'utf8');
 schema.push(...sql.replace(/--[^\n]*/g,'').split(';').map(x=>x.trim()).filter(x=>x&&!/^SELECT\b/i.test(x)));
}
schema.push("CREATE TABLE qa_bolsa_guard(purpose TEXT PRIMARY KEY,secret_hash TEXT NOT NULL,core_hash TEXT NOT NULL,seed TEXT NOT NULL,phase INTEGER NOT NULL CHECK(phase BETWEEN 0 AND 8),messages TEXT NOT NULL CHECK(json_valid(messages)),lease_until INTEGER NOT NULL,lock_owner TEXT)");
schema.push("CREATE TABLE qa_bolsa_attempts(phase INTEGER NOT NULL,slot INTEGER NOT NULL,state TEXT NOT NULL CHECK(state IN ('pending','done')),status INTEGER NOT NULL DEFAULT 0,data_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(data_json)),lease_until INTEGER NOT NULL DEFAULT 0,owner TEXT,PRIMARY KEY(phase,slot))");
schema.push('CREATE TABLE qa_bolsa_signals(key TEXT PRIMARY KEY,value INTEGER NOT NULL)');
const tables=[...new Set(schema.flatMap(sql=>{const m=sql.match(/^CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);return m?[m[1]]:[]}))];
const runtime=await readFile(new URL('scripts/job-lab-runtime.js',root),'utf8');
const output='/* SYNTHETIC QA ONLY. Deploy as uadav-bolsa-lab with a NEW EMPTY DB. Never replace staging, production or restore QA. */\n'+core+'\nconst UADAV_BOLSA_LAB_CORE_SHA256='+JSON.stringify(digest)+';\nconst UADAV_BOLSA_LAB_SCHEMA='+JSON.stringify(schema)+';\nconst UADAV_BOLSA_LAB_TABLES='+JSON.stringify(tables)+';\n'+runtime;
if(process.argv.includes('--check')){
 if(await readFile(target,'utf8')!==output)throw Error('Rebuild the synthetic Bolsa lab.');
 const packaged=execFileSync('python',['-c','import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;sys.stdout.buffer.write(z.read("worker.js"))',fileURLToPath(new URL('releases/uadav-bolsa-lab-11764.zip',root))],{encoding:'utf8',maxBuffer:2000000});
 if(packaged!==output)throw Error('The laboratory ZIP differs from the reviewed standalone source.');
 console.log('Synthetic Bolsa lab matches the frozen 11764 core and its schema.');
}else{await writeFile(target,output);console.log('Prepared a separate synthetic Bolsa lab; no deployment or live database changes.');}
