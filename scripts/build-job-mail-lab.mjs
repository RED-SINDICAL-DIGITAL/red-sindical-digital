import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),target=new URL('releases/uadav-bolsa-mail-lab-11766.js',root);
const base=await readFile(new URL('releases/uadav-bolsa-lab-11764.js',root),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const baseHash=sha(base);if(baseHash!=='d4392464cf5b3c731fe49fe800ab1a3dedb37af1e1a584c11c98639382534013'||!base.endsWith('export default uadavBolsaLabWorker;\n'))throw Error('Approved base lab changed.');
const paths=['scripts/access-mail-message.mjs','scripts/brevo-request.mjs','scripts/brevo-recovery-message.mjs','scripts/brevo-staging-mail.mjs','scripts/job-recovery-outbox.mjs'];
const sources=await Promise.all(paths.map(p=>readFile(new URL(p,root),'utf8')));
function module(source,names,dependencies=''){const code=source.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');if(/^\s*(import|export)\b/m.test(code))throw Error('Review module imports/exports.');return '(()=>{\n'+dependencies+'\n'+code+'\nreturn {'+names.join(',')+'};\n})()'}
const bundle='const uadavMailCore=(()=>{\nconst access='+module(sources[0],['ACCESS_MAIL_TTL_MS','buildAccessMailMessage'])+';\n'+
 'const transport='+module(sources[1],['uadavBrevoRequest'])+';\n'+
 'const snapshot='+module(sources[2],['brevoStagingAddress','brevoTransportHash','prepareBrevoRecoveryMessage','validateBrevoRecoveryMessage'],'const {ACCESS_MAIL_TTL_MS,buildAccessMailMessage}=access;')+';\n'+
 'const brevo='+module(sources[3],['createBrevoStagingMail'],'const {ACCESS_MAIL_TTL_MS,buildAccessMailMessage}=access;const {uadavBrevoRequest}=transport;const {brevoStagingAddress,brevoTransportHash,prepareBrevoRecoveryMessage,validateBrevoRecoveryMessage}=snapshot;')+';\n'+
 'const engine='+module(sources[4],['createJobRecoveryOutbox','JOB_RECOVERY_MIN_IDEMPOTENCY_MS'])+';\nreturn {...brevo,...engine};\n})();';
const schema=(await readFile(new URL('migrations/staging/20261026_job_recovery_outbox.sql',root),'utf8')).replace(/--[^\n]*/g,'').split(';').map(x=>x.trim()).filter(Boolean);
const runtime=await readFile(new URL('scripts/job-mail-lab-runtime.js',root),'utf8'),html=await readFile(new URL('scripts/job-mail-lab-page.html',root),'utf8');
const mailHash=sha(JSON.stringify([...sources,runtime,html,schema]));
const metadata={version:'11766-mail-lab-1',scope:'isolated-synthetic-mail-recovery',base_lab_sha256:baseHash,mail_sha256:mailHash};
const output='/* SYNTHETIC MAIL RECOVERY QA ONLY. Existing approved uadav-bolsa-lab DB/key required. Never deploy to staging, production or restore QA. No real email network. */\n'+base.replace('export default uadavBolsaLabWorker;\n','')+'\n'+bundle+'\nconst UADAV_MAIL_LAB_METADATA='+JSON.stringify(metadata)+';\nconst UADAV_MAIL_LAB_SCHEMA='+JSON.stringify(schema)+';\nconst UADAV_MAIL_LAB_HTML='+JSON.stringify(html)+';\n'+runtime;
if(process.argv.includes('--check')){
 if(await readFile(target,'utf8')!==output)throw Error('Rebuild mail recovery lab.');
 const packaged=execFileSync('python3',['-c','import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;sys.stdout.buffer.write(z.read("worker.js"))',fileURLToPath(new URL('releases/uadav-bolsa-mail-lab-11766.zip',root))],{encoding:'utf8',maxBuffer:2000000});
 if(packaged!==output)throw Error('Mail lab ZIP differs from source.');
 console.log('Mail recovery lab source and ZIP match the frozen base and current preparatory modules.');
}else{await writeFile(target,output);console.log(JSON.stringify(metadata));}
