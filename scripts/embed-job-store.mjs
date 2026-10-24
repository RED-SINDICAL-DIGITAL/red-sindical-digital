import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('worker.js',root);
const source=await readFile(new URL('scripts/job-store-runtime.js',root),'utf8');
const start='/* BEGIN JOB STORE STAGING */',end='/* END JOB STORE STAGING */';
let worker=await readFile(target,'utf8');
const block=start+'\n'+source+'\n'+end;
if(process.argv.includes('--check')){
  if(!worker.includes(block))throw Error('worker.js does not contain the current job storage source. Run node scripts/embed-job-store.mjs.');
  console.log('Job storage source matches the standalone Worker.');
  process.exit(0);
}
if(worker.includes(start))worker=worker.slice(0,worker.indexOf(start))+block+worker.slice(worker.indexOf(end)+end.length);
else worker=worker.replace('const uadavWorker = {',block+'\n\nconst uadavWorker = {');
await writeFile(target,worker);
