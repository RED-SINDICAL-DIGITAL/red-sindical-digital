async function uadavCommercialInquiries(request,env,{json,isAdmin}){
 const url=new URL(request.url),pub='/api/advertising/inquiries',admin='/api/admin/advertising-inquiries',cap=pub+'/capabilities';
 if(![pub,admin,cap].includes(url.pathname))return null;
 const reply=(body,status=200)=>{const r=json(body,status);r.headers.set('Cache-Control','no-store');return r};
 const staging=url.origin==='https://uadav-api-staging.uadavstream.workers.dev',security=uadavSecurityConfig(env);
 if(url.pathname===cap)return request.method==='GET'?reply({revision:'20261105-consultation-1',enabled:staging&&!!env.DB&&security.enabled,sitekey:security.sitekey,administration:'Santa Fe',payment_method:'bank_transfer',email_notifications:false}):reply({error:'Método no permitido'},405);
 if(!staging)return reply({error:'Disponible solo en staging'},404);
 if(url.pathname===admin&&!isAdmin())return reply({error:'No autorizado'},401);
 if(url.pathname===pub&&(request.method!=='POST'||request.headers.get('Origin')!=='https://uadav-stream-staging.pages.dev'))return reply({error:'Solicitud no permitida'},403);
 if(!env.DB)return reply({error:'Servicio temporalmente no disponible'},503);
 try{
  if(url.pathname===admin){
   if(request.method!=='GET')return reply({error:'Método no permitido'},405);
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS commercial_inquiries(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,data_json TEXT NOT NULL,created_at TEXT NOT NULL)').run();
   const rows=await env.DB.prepare('SELECT data_json FROM commercial_inquiries ORDER BY created_at DESC LIMIT 300').all();return reply({items:(rows.results||[]).map(x=>JSON.parse(x.data_json))});
  }
  if(!security.enabled)return reply({error:'La consulta estará disponible cuando administración habilite la verificación de seguridad.'},503);
  const b=await uadavSecurityJSON(request,12000),keys=['request_id','name','email','organization','province','objective','dates','consent','turnstile_token','website'];
  if(Object.keys(b).some(k=>!keys.includes(k))||b.website||b.consent!==true||! /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(b.request_id||''))return reply({error:'Revisá los datos de la consulta.'},400);
  const clean=(v,n)=>typeof v==='string'&&v.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v)?v.trim():null;
  const data={name:clean(b.name,140),email:clean(b.email,180),organization:clean(b.organization||'',160),province:clean(b.province,100),objective:clean(b.objective,2000),dates:clean(b.dates||'',200)};
  if(Object.values(data).some(v=>v===null)||!data.name||!data.province||!data.objective||!/^[^\s@<>]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email))return reply({error:'Completá nombre, correo válido, territorio y propuesta.'},400);
  const check=await uadavVerifyTurnstile(env,b.turnstile_token,'commercial_inquiry');if(!check.ok)return reply({error:check.error},check.status);
  const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
  const fingerprint=await digest(JSON.stringify(data)),id='PUB-'+b.request_id.toLowerCase(),now=Date.now();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS commercial_inquiries(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,data_json TEXT NOT NULL,created_at TEXT NOT NULL)').run();
  const existing=await env.DB.prepare('SELECT fingerprint FROM commercial_inquiries WHERE id=?').bind(id).first();if(existing)return existing.fingerprint===fingerprint?reply({success:true,id,replayed:true,email_sent:false}):reply({error:'La referencia ya corresponde a otra consulta.'},409);
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS commercial_inquiry_rates(id TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL)').run();
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return reply({error:'No pudimos verificar el origen.'},503);
  const rate='commercial:'+await digest(ip+':'+Math.floor(now/900000));
  const allowed=await env.DB.prepare('INSERT INTO commercial_inquiry_rates(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count<5 RETURNING count').bind(rate,now+1800000).first();if(!allowed)return reply({error:'Alcanzaste el límite de consultas. Esperá 15 minutos.'},429);
  await env.DB.prepare('DELETE FROM commercial_inquiry_rates WHERE expires_at<?').bind(now).run();
  const item={id,...data,status:'received',administration:'Santa Fe',created_at:new Date(now).toISOString()};
  const saved=await env.DB.prepare('INSERT OR IGNORE INTO commercial_inquiries(id,fingerprint,data_json,created_at) VALUES(?,?,?,?)').bind(id,fingerprint,JSON.stringify(item),item.created_at).run();
  if(Number(saved.meta?.changes)!==1){const duplicate=await env.DB.prepare('SELECT fingerprint FROM commercial_inquiries WHERE id=?').bind(id).first();if(duplicate?.fingerprint!==fingerprint)return reply({error:'No pudimos confirmar la consulta.'},409);}
  return reply({success:true,id,email_sent:false},201);
 }catch(e){return reply({error:e.status===413?'Datos demasiado grandes.':'No pudimos confirmar el guardado. Conservá el formulario y reintentá.'},e.status===413?413:503);}
}
