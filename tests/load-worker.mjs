import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
// Keep stack traces readable: a failed test must not print a base64 copy of the
// entire Worker into CI logs. The generated module is removed after loading.
export async function loadWorker(){
  const dir=await mkdtemp(join(tmpdir(),'uadav-worker-test-'));
  try{
    const file=join(dir,'worker.mjs');
    await writeFile(file,await readFile(new URL('../worker.js',import.meta.url)));
    return await import(pathToFileURL(file).href);
  }finally{await rm(dir,{recursive:true,force:true})}
}
