import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),target=new URL('worker.js',root);
const sources=await Promise.all(['scripts/access-mail-message.mjs','scripts/brevo-request.mjs','scripts/brevo-recovery-message.mjs','scripts/brevo-staging-mail.mjs','scripts/job-recovery-outbox.mjs'].map(p=>readFile(new URL(p,root),'utf8')));
function wrap(source,names,deps=''){const code=source.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');if(/^\s*(?:import|export)\b/m.test(code))throw Error('Review mail module imports');return '(()=>{\n'+deps+'\n'+code+'\nreturn {'+names.join(',')+'};\n})()'}
const bundle='const uadavLiveMailCore=(()=>{\nconst access='+wrap(sources[0],['ACCESS_MAIL_TTL_MS','buildAccessMailMessage'])+';\nconst transport='+wrap(sources[1],['uadavBrevoRequest'])+';\nconst snapshot='+wrap(sources[2],['brevoStagingAddress','brevoTransportHash','prepareBrevoRecoveryMessage','validateBrevoRecoveryMessage'],'const {ACCESS_MAIL_TTL_MS,buildAccessMailMessage}=access;')+';\nconst brevo='+wrap(sources[3],['createBrevoStagingMail'],'const {ACCESS_MAIL_TTL_MS,buildAccessMailMessage}=access;const {uadavBrevoRequest}=transport;const {brevoStagingAddress,brevoTransportHash,prepareBrevoRecoveryMessage,validateBrevoRecoveryMessage}=snapshot;')+';\nconst outbox='+wrap(sources[4],['createJobRecoveryOutbox'],'')+';\nreturn {...brevo,...outbox,brevoStagingAddress:snapshot.brevoStagingAddress};\n})();';
const schema=(await readFile(new URL('migrations/staging/20261026_job_recovery_outbox.sql',root),'utf8')).replace(/--[^\n]*/g,'').split(';').map(x=>x.trim()).filter(Boolean);
const schemaHash=createHash('sha256').update(JSON.stringify(schema)).digest('hex');
const inbox=await readFile(new URL('scripts/job-inbox-runtime.js',root),'utf8');
const runtime=await readFile(new URL('scripts/job-mail-live-runtime.js',root),'utf8'),html=await readFile(new URL('scripts/job-mail-live-page.html',root),'utf8');
const start='/* BEGIN PRIVATE JOB MAIL LIVE QA */',end='/* END PRIVATE JOB MAIL LIVE QA */';
const block=start+'\n'+inbox+'\n'+bundle+'\nconst UADAV_LIVE_MAIL_SCHEMA='+JSON.stringify(schema)+';\nconst UADAV_LIVE_MAIL_SCHEMA_SHA='+JSON.stringify(schemaHash)+';\nconst UADAV_LIVE_MAIL_HTML='+JSON.stringify(html)+';\n'+runtime+'\n'+end;
let worker=await readFile(target,'utf8');
if(process.argv.includes('--check')){if(!worker.includes(block))throw Error('Rebuild private staging recovery QA');console.log('Private mail recovery QA matches its approved core and current sources.');}
else{worker=worker.includes(start)?worker.slice(0,worker.indexOf(start))+block+worker.slice(worker.indexOf(end)+end.length):worker.replace('const uadavWorker = {',block+'\n\nconst uadavWorker = {');await writeFile(target,worker);}
