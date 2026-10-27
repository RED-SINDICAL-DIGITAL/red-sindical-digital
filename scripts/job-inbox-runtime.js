/* Shared D1-only private inbox. It uses the existing Bolsa authority and avoids
 * the unrelated legacy bootstrap when an email recovery verifies its result. */
async function uadavJobD1Inbox(request,env){
 const origin=request.headers.get('Origin'),allowed=['https://uadav-stream-staging.pages.dev','https://uadav-api-staging.uadavstream.workers.dev'];
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',Vary:'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{})};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed.includes(origin))return reply({error:'Abrí la bandeja desde staging.'},403);
 const b=await uadavSecurityJSON(request,4096).catch(()=>null),id=String(b?.job_id||'').trim(),key=String(b?.clave||'').trim();
 const identity=b?.cuenta===true?await uadavJobAccountIdentity(request,env):null;
 if(!/^JOB-[A-Z0-9-]{3,80}$/.test(id)||!identity&&!/^[a-f0-9]{64}$/.test(key))return reply({error:'Credenciales inválidas'},400);
 const peer=String(request.headers.get('CF-Connecting-IP')||'').trim();if(!peer)return reply({error:'Origen no verificable'},403);
 if(!await uadavJobRate(env,'job-owner-rate:'+await uadavDigest(peer),12,600000))return reply({error:'Demasiadas consultas. Intentá más tarde.'},429);
 const store=uadavJobStore(env),job=(await store.read('bolsa_trabajo')).find(x=>String(x.id)===id),db=uadavJobDB(env);
 const credential=!identity&&job?await db.prepare('SELECT secret_hash FROM job_owner_credentials WHERE job_id=?').bind(id).first():null;
 if(!job||!(identity?await uadavJobAccountOwns(db,identity,'bolsa_trabajo',id):credential?.secret_hash===await uadavDigest(key)))return reply({error:'No se encontró el acceso a esta oportunidad'},404);
 const rows=await store.read('postulaciones_trabajo');
 // Recheck after reading candidates so a concurrent revocation cannot publish
 // a response authorized only by a stale credential/account lookup.
 const stillOwns=identity?await uadavJobAccountOwns(db,identity,'bolsa_trabajo',id):(await db.prepare('SELECT secret_hash FROM job_owner_credentials WHERE job_id=?').bind(id).first())?.secret_hash===await uadavDigest(key);
 if(!stillOwns)return reply({error:'No se encontró el acceso a esta oportunidad'},404);
 const items=rows.filter(x=>String(x.job_id)===id).map(x=>({id:x.id,nombre:x.nombre,email:x.email,whatsapp:Array.isArray(x.shared_fields)&&x.shared_fields.includes('whatsapp')?x.whatsapp:'',portfolio_url:Array.isArray(x.shared_fields)&&x.shared_fields.includes('portfolio_url')?x.portfolio_url:'',mensaje:Array.isArray(x.shared_fields)&&x.shared_fields.includes('mensaje')?x.mensaje:'',artist_id:Array.isArray(x.shared_fields)&&x.shared_fields.includes('artist_profile')?x.artist_id:'',creado:x.creado,estado:x.estado||'recibida',perfil_verificado:!!x.perfil_verificado}));
 return reply({success:true,job:{id:job.id,titulo:job.titulo},items});
}
