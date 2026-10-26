import {readFile, writeFile} from 'node:fs/promises';
const root = new URL('../', import.meta.url), target = new URL('worker.js', root);
const sources = await Promise.all(['scripts/brevo-request.mjs', 'scripts/brevo-probe-runtime.js', 'scripts/brevo-probe-page.html'].map(path => readFile(new URL(path, root), 'utf8')));
const start = '/* BEGIN BREVO SANDBOX STAGING */', end = '/* END BREVO SANDBOX STAGING */';
const block = start + '\nconst uadavBrevoSandboxRoute = (() => {\n' + sources[0].replace('export async function ', 'async function ') + '\nconst UADAV_BREVO_PROBE_HTML = ' + JSON.stringify(sources[2]) + ';\n' + sources[1] + '\nreturn uadavBrevoSandboxRoute;\n})();\n' + end;
let worker = await readFile(target, 'utf8');
if (process.argv.includes('--check')) {
  if (!worker.includes(block)) throw Error('Brevo probe source is stale. Run node scripts/embed-brevo-probe.mjs.');
  console.log('Brevo sandbox probe matches the standalone staging Worker.');
} else {
  if (worker.includes(start)) worker = worker.slice(0, worker.indexOf(start)) + block + worker.slice(worker.indexOf(end) + end.length);
  else worker = worker.replace('const uadavWorker = {', block + '\n\nconst uadavWorker = {');
  await writeFile(target, worker);
}
