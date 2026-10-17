// Isolated, read-only Admin preview. Run: node tests/serve-admin-preview.mjs
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import assert from 'node:assert/strict';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const assets=new Set(['admin.html','uadav-responsive-v120.css','uadav-admin-v126.css','uadav-admin-v151.css','uadav-profile-display-v126.js','uadav-community-admin-v144.js','uadav-pending-admin-v146.js','uadav-profile-removal-v147.js','uadav-accounts-admin-v147.js','uadav-announcements-admin-v149.js','admin-v117-model.js','uadav-responsive.js','uadav-admin-v126.js']);
const artists=[{id:'QA-ARTIST-1',nombre:'Artista de prueba',rubro:'Magia',ciudad:'Rosario',visible:true,claim_status:'pending'},{id:'QA-ARTIST-2',nombre:'Perfil por sincronizar',rubro:'Música',visible:false,claim_status:'pending'}];
const claims=[{id:'QA-CLAIM-1',artist_id:'QA-ARTIST-1',name:'Solicitante ficticio',email:'prueba@example.invalid',status:'pending',note:'Datos de muestra sin valor real'},{id:'QA-CLAIM-2',artist_id:'QA-ARTIST-2',name:'Aprobación ficticia',email:'aprobado@example.invalid',status:'approved',review_note:'Prueba de sincronización'}];
const owners=[{id:'QA-OWNER-2',artist_id:'QA-ARTIST-2',claim_id:'QA-CLAIM-2',contact_email:'aprobado@example.invalid',status:'active',verification_level:'admin_approved'}];
const policy="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'self'; form-action 'self'";
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1'),path=url.pathname;
 res.setHeader('Content-Security-Policy',policy);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))};
 if(path.startsWith('/api/')){
  if(!['GET','HEAD'].includes(req.method))return json({error:'Esta vista es de solo lectura. No guarda ni publica cambios.'},405);
  const route=path.slice(5);
  if(route==='health')return json({ok:true,success:true,service:'UADAV · PRUEBA LOCAL',version:'PREVIEW',kv:false,d1:false});
  if(route==='config')return json({branding:{name:'UADAV · PRUEBA LOCAL'}});
  if(route==='admin_check')return req.headers.authorization==='Bearer PREVIEW-LOCAL'?json({success:true}):json({error:'Usá PREVIEW-LOCAL. No ingreses tu clave real.'},401);
  if(req.headers.authorization!=='Bearer PREVIEW-LOCAL')return json({error:'Vista local: usá PREVIEW-LOCAL'},401);
  if(route==='artistas'||route==='admin/artistas')return json(artists);
  if(route==='admin/artist-claims')return json(claims);
  if(route==='admin/artist-owners')return json(owners);
  if(route==='admin/exceptions')return json({count:0,red:0,yellow:0,items:[]});
  if(route==='admin/accounts')return json({items:[]});
  return json([]);
 }
 if(path==='/uadav-api-config.js'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end("window.PLATFORM_API_BASE=location.origin+'/api/';window.UADAV_API_BASE=window.PLATFORM_API_BASE;window.PLATFORM_USE_LOCAL_API=false;")}
 if(path==='/platform-instance.json')return json({branding:{name:'UADAV · PRUEBA LOCAL'}});
 const name=path==='/'?'admin.html':path.slice(1);if(!assets.has(name))return json({error:'Archivo no incluido en la vista aislada'},404);
 try{let content;try{content=await readFile(join(root,name),'utf8')}catch{content=await readFile(join(root,'visual-assets',name),'utf8')}
  if(name==='admin.html'){content=content.replace('<body data-page="admin">','<body data-page="admin"><div style="padding:12px;background:#1e3a5f;color:white;text-align:center">PRUEBA LOCAL · Datos ficticios · Clave: PREVIEW-LOCAL · No guarda cambios</div>');content=content.replace(/<script src="https:\/\/cdn\.jsdelivr[^>]+><\/script>/g,'');}
  res.writeHead(200,{'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8'});res.end(content);
 }catch{json({error:'Falta un archivo del repositorio para esta vista'},500)}
});
const check=process.argv.includes('--check');
server.listen(check?0:8789,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 if(!check){console.log('Vista local: '+base+' · clave ficticia PREVIEW-LOCAL · solo lectura');return}
 try{
  const html=await fetch(base);assert.equal(html.status,200);assert.ok(html.headers.get('content-security-policy').includes("connect-src 'self'"));assert.ok((await html.text()).includes('PRUEBA LOCAL'));
  const config=await fetch(base+'/uadav-api-config.js').then(r=>r.text());assert.ok(config.includes("location.origin+'/api/'"));assert.equal(config.includes('workers.dev'),false);
  for(const name of assets)assert.equal((await fetch(base+'/'+name)).status,200,name);
  assert.equal((await fetch(base+'/api/admin_check',{headers:{Authorization:'Bearer PREVIEW-LOCAL'}})).status,200);
  assert.equal((await fetch(base+'/api/admin/artist-claims')).status,401);
  assert.equal((await fetch(base+'/api/admin/artist-claims',{method:'PUT',body:'{}'})).status,405);
  assert.equal((await fetch(base+'/worker.js')).status,404);
  console.log('PASS: isolated Admin preview serves current assets, uses same-origin mock API, blocks external connections and denies writes/private files. Browser visual validation not performed.');
 }catch(e){console.error(e.message);process.exitCode=1}finally{server.closeAllConnections();server.close()}
});
