import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readdir,readFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const dest=join(root,'dist-admin-v2-qa-test-'+process.pid);
const qa='https://uadav-api-admin-v2-qa.uadavstream.workers.dev';
try{
 const run=spawnSync(process.execPath,['scripts/build-admin-v2-qa-frontend.mjs',dest],{cwd:root,encoding:'utf8'});
 assert.equal(run.status,0,run.stderr||run.stdout);
 async function walk(dir){
  let files=[];
  for(const ent of await readdir(dir,{withFileTypes:true})){
   const path=join(dir,ent.name);
   if(ent.isDirectory())files.push(...await walk(path));
   else files.push(path);
  }
  return files;
 }
 const files=await walk(dest);
 assert.ok(files.length>30,'QA frontend must include functional public assets');
 assert.ok(files.some(f=>f.endsWith('/admin.html')));
 assert.ok(files.some(f=>f.endsWith('/usuario.html')));
 assert.ok(files.some(f=>f.endsWith('/app.html')));
 assert.ok(!files.some(f=>f.endsWith('/worker.js')||f.endsWith('/CNAME')||f.endsWith('/wrangler.staging.toml')));
 for(const file of ['AUDIT-V9.1.txt','SHA256SUMS-V9.2.3.txt','VALIDATION-V8.3.json','VALIDATION-V8.4.json','VALIDATION-V8.5.json','ejemplos-editoriales-staging.html','qa-responsive-staging.html','staging-preflight.html','publicidad-demo.html','vivo-prueba.html'])assert.ok(!files.some(f=>f.endsWith('/'+file)),'Non-QA document or test fixture leaked: '+file);
 for(const file of ['index.html','admin.html','app.html','usuario.html','manifest.json','version.json','uadav-api-config.js'])assert.ok(files.some(f=>f.endsWith('/'+file)),'Required public runtime file missing: '+file);
 for(const file of ['vendor/qrcode.js','vendor/xlsx-0.20.3.full.min.js','vendor/qrcode-LICENSE.txt','vendor/xlsx-LICENSE.txt'])assert.ok(files.some(f=>f.endsWith('/'+file)),'Required vendor dependency or license missing: '+file);
 const adminHtml=await readFile(join(dest,'admin.html'),'utf8'),profileHtml=await readFile(join(dest,'usuario.html'),'utf8');
 assert.ok(adminHtml.includes('/vendor/xlsx-0.20.3.full.min.js'),'Admin must reference XLSX');
 assert.ok(profileHtml.includes('/vendor/qrcode.js'),'Mi Perfil must reference QR library');
 assert.ok(!files.some(f=>f.endsWith('/service-worker.js')||f.endsWith('/uadav-push-sw.js')),'No notification worker may be bundled in QA');
 const push=await readFile(join(dest,'uadav-push-ui-v150.js'),'utf8');
 assert.ok(push.includes('no PushManager subscription'));
 assert.ok(!push.includes('requestPermission')&&!push.includes('serviceWorker.register'),'QA must never ask for push permission');
 const config=await readFile(join(dest,'uadav-api-config.js'),'utf8');
 assert.ok(config.includes(qa+'/api/'));
 assert.match(config,/invalid Pages origin/);
 for(const file of files.filter(x=>/\.(html|js|css|json|svg|txt|xml|webmanifest)$/.test(x))){
  const content=await readFile(file,'utf8');
  assert.ok(!content.includes('https://uadav-api.uadavstream.workers.dev'),'Production API leaked in '+file);
  assert.ok(!content.includes('https://uadav-api-staging.uadavstream.workers.dev'),'Frozen staging API leaked in '+file);
  assert.ok(!content.includes('https://uadav-stream-staging.pages.dev'),'Staging Pages link leaked in '+file);
  assert.ok(!content.includes('https://uadavstream.com.ar'),'Production site link leaked in '+file);
 }
 const headers=await readFile(join(dest,'_headers'),'utf8');
 assert.match(headers,/connect-src 'self' https:\/\/uadav-api-admin-v2-qa\.uadavstream\.workers\.dev https:\/\/challenges\.cloudflare\.com/);
 assert.doesNotMatch(headers,/connect-src[^\n]*(?:uadav-api-staging|uadav-api\.uadavstream)/);
 assert.match(headers,/X-Robots-Tag: noindex, nofollow/);
 assert.equal(await readFile(join(dest,'robots.txt'),'utf8'),'User-agent: *\nDisallow: /\n');
 const original=await readFile(join(root,'uadav-api-config.js'),'utf8');
 assert.ok(original.includes('https://uadav-api-staging.uadavstream.workers.dev/api/'),'Build must not modify original API config');
 const forbidden=spawnSync(process.execPath,['scripts/build-admin-v2-qa-frontend.mjs',root],{cwd:root,encoding:'utf8'});
 assert.notEqual(forbidden.status,0,'Never permit output that overwrites repository');
 console.log('PASS: isolated QA Pages assets, no production/staging API literals, original files unchanged, unsafe destinations blocked.');
}finally{await rm(dest,{recursive:true,force:true})}
