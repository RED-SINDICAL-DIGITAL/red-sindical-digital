import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('worker.js',root);
const runtime=await readFile(new URL('scripts/job-backup-runtime.js',root),'utf8'),digest=(await readFile(new URL('scripts/job-backup-digest.mjs',root),'utf8')).replace(/^export /gm,'');
if(/^\s*(import|export)\b/m.test(digest))throw Error('Review browser digest imports');
const html=(await readFile(new URL('scripts/job-closure-page.html',root),'utf8')).replace('%%DIGEST_JS%%',digest);
const start='/* BEGIN JOB BACKUP STAGING */',end='/* END JOB BACKUP STAGING */';
const block=start+'\nconst UADAV_JOB_CLOSURE_HTML='+JSON.stringify(html)+';\n'+runtime+'\n'+end;
let worker=await readFile(target,'utf8');
if(process.argv.includes('--check')){if(!worker.includes(block))throw Error('Rebuild staging backup/closure source');console.log('Staging backup/closure source matches standalone Worker.');}
else{worker=worker.includes(start)?worker.slice(0,worker.indexOf(start))+block+worker.slice(worker.indexOf(end)+end.length):worker.replace('const uadavWorker = {',block+'\n\nconst uadavWorker = {');await writeFile(target,worker);}
