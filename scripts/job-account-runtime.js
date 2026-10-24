/* Explicit account associations. No receipt keys or email-based matching. */
const UADAV_JOB_ACCOUNT_TABLES=['job_account_links','audience_accounts','audience_devices','audience_recovery_keys','audience_deletions','audience_announcements'];
async function uadavJobAccountFeatures(db){
  const row=await db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name IN ("+UADAV_JOB_ACCOUNT_TABLES.map(()=>'?').join(',')+")").bind(...UADAV_JOB_ACCOUNT_TABLES).first();
  return Number(row?.n)===UADAV_JOB_ACCOUNT_TABLES.length;
}
async function uadavJobAccountIdentity(request,env){
  if(env.JOB_STORE_D1!=='true')throw uadavJobError('JOB_ACCOUNT_UNAVAILABLE','Usá tu comprobante privado mientras preparamos Mis trabajos.',503);
  const result=await uadavAccountRoute(new Request(new URL('/api/account/identity',request.url),{headers:request.headers}),env,true);
  const data=await result.json();
  if(!result.ok)throw uadavJobError(data.code||'JOB_ACCOUNT_AUTH',data.error||'Volvé a ingresar a Mi Perfil.',result.status);
  const credential=String(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!/^[a-f0-9]{64}$/.test(data.account_id||'')||!/^UA[CD]-[a-f0-9]{64}$/.test(credential))throw uadavJobError('JOB_ACCOUNT_AUTH','Volvé a ingresar a Mi Perfil.',401);
  if(!await uadavJobAccountFeatures(uadavJobDB(env)))throw uadavJobError('JOB_ACCOUNT_SCHEMA_REQUIRED','Mis trabajos todavía no está preparado. Conservá tu comprobante privado.',503);
  return {accountId:data.account_id,credentialHash:await uadavDigest(credential),device:credential.startsWith('UAD-')};
}
async function uadavJobAccountSelection(request,env,body){
  if(Object.hasOwn(body,'save_to_account')&&typeof body.save_to_account!=='boolean')throw uadavJobError('JOB_ACCOUNT_CONFIRM','Revisá si querés guardar esta gestión en Mi Perfil.',400);
  return body.save_to_account===true?uadavJobAccountIdentity(request,env):null;
}
function uadavJobAccountGuards(db,identity){
  const {accountId,credentialHash,device}=identity;
  if(!/^[a-f0-9]{64}$/.test(accountId||'')||!/^[a-f0-9]{64}$/.test(credentialHash||''))throw uadavJobError('JOB_ACCOUNT_AUTH','Acceso de cuenta inválido.',401);
  const permission=device?"EXISTS(SELECT 1 FROM audience_devices WHERE credential_hash=? AND account_id=? AND revoked_at IS NULL AND (expires_at=0 OR expires_at>?))":"(EXISTS(SELECT 1 FROM audience_recovery_keys WHERE credential_hash=? AND account_id=? AND revoked_at IS NULL) OR (?=? AND NOT EXISTS(SELECT 1 FROM audience_recovery_keys WHERE credential_hash=?)))";
  const args=device?[credentialHash,accountId,Date.now()]:[credentialHash,accountId,credentialHash,accountId,credentialHash];
  return uadavJobGuard(db,'EXISTS(SELECT 1 FROM audience_accounts WHERE id=?) AND NOT EXISTS(SELECT 1 FROM audience_deletions WHERE account_id=?) AND '+permission,[accountId,accountId,...args]);
}
function uadavJobAccountMembershipGuard(db,identity,collection,id){
  return uadavJobGuard(db,'EXISTS(SELECT 1 FROM job_account_links WHERE account_id=? AND collection=? AND record_id=?)',[identity.accountId,collection,id]);
}
async function uadavJobAccountOwns(db,identity,collection,id){
  const row=await db.prepare('SELECT record_id FROM job_account_links WHERE account_id=? AND collection=? AND record_id=?').bind(identity.accountId,collection,id).first();
  return !!row;
}
async function uadavJobAccountList(request,env){
  const identity=await uadavJobAccountIdentity(request,env),url=new URL(request.url),offset=Number(url.searchParams.get('offset')||0);
  if(!Number.isInteger(offset)||offset<0||offset>4000)throw uadavJobError('JOB_ACCOUNT_PAGE','Página inválida.',400);
  const rows=await uadavJobDB(env).prepare("SELECT l.collection,r.id,r.data_json,r.updated_at,json_extract(j.data_json,'$.titulo') AS job_title FROM job_account_links l JOIN job_store_records r ON r.collection=l.collection AND r.id=l.record_id LEFT JOIN job_store_records j ON j.collection='bolsa_trabajo' AND j.id=json_extract(r.data_json,'$.job_id') WHERE l.account_id=? ORDER BY l.linked_at DESC,l.collection,l.record_id LIMIT 51 OFFSET ?").bind(identity.accountId,offset).all();
  const items=(rows.results||[]).slice(0,50).map(row=>{
    const item=JSON.parse(row.data_json),offer=row.collection==='bolsa_trabajo',today=uadavJobToday();
    const state=offer&&uadavJobExpiryKind(item,today,today,Date.now())==='expired'?'vencida':String(item.estado||(offer?(uadavJobIsPublic(item)?'activa':'cerrada'):'recibida'));
    return {tipo:offer?'oferta':'postulacion',id:row.id,titulo:String(offer?item.titulo:row.job_title||'Oportunidad').slice(0,160),estado:state,creado:item.creado||null,actualizado:row.updated_at,...(offer?{fecha_limite:item.fecha_limite||null,recibe_postulaciones:uadavJobIsPublic(item)}:{job_id:String(item.job_id||'')})};
  });
  return {success:true,enabled:true,items,next_offset:(rows.results||[]).length>50?offset+50:null};
}
async function uadavJobAccountLink(request,env,body){
  const identity=await uadavJobAccountIdentity(request,env),db=uadavJobDB(env);
  const collection=body?.tipo==='oferta'?'bolsa_trabajo':body?.tipo==='postulacion'?'postulaciones_trabajo':'';
  const id=String(body?.id||'').trim(),key=String(body?.clave||'').trim();
  if(body?.confirm!=='VINCULAR_A_MI_CUENTA'||!collection||!(collection==='bolsa_trabajo'?/^JOB-[A-Z0-9-]{3,80}$/:/^POST-[A-Z0-9-]{5,80}$/).test(id)||!/^[a-f0-9]{64}$/.test(key))throw uadavJobError('JOB_ACCOUNT_PROOF','Revisá el comprobante privado y confirmá que querés guardarlo en esta cuenta.',400);
  if(!await uadavJobRate(env,'job-account-link:'+identity.accountId,12,600000))throw uadavJobError('JOB_ACCOUNT_RATE','Demasiados intentos. Esperá unos minutos.',429);
  const row=await db.prepare('SELECT data_json,revision FROM job_store_records WHERE collection=? AND id=?').bind(collection,id).first(),hash=await uadavDigest(key);
  const credential=collection==='bolsa_trabajo'?await db.prepare('SELECT secret_hash FROM job_owner_credentials WHERE job_id=?').bind(id).first():null;
  if(!row||(collection==='bolsa_trabajo'?credential?.secret_hash:JSON.parse(row.data_json).consulta_hash)!==hash)throw uadavJobError('JOB_ACCOUNT_PROOF','No se encontró una gestión con ese comprobante privado.',404);
  const proof=collection==='bolsa_trabajo'?"EXISTS(SELECT 1 FROM job_owner_credentials WHERE job_id=? AND secret_hash=?)":"EXISTS(SELECT 1 FROM job_store_records WHERE collection='postulaciones_trabajo' AND id=? AND json_extract(data_json,'$.consulta_hash')=?)";
  const statements=[...uadavJobAccountGuards(db,identity),...uadavJobGuard(db,'EXISTS(SELECT 1 FROM job_store_records WHERE collection=? AND id=? AND revision=?)',[collection,id,row.revision]),...uadavJobGuard(db,proof,[id,hash]),...uadavJobGuard(db,'NOT EXISTS(SELECT 1 FROM job_account_links WHERE collection=? AND record_id=? AND account_id<>?)',[collection,id,identity.accountId]),db.prepare('INSERT OR IGNORE INTO job_account_links(collection,record_id,account_id,linked_at) VALUES(?,?,?,?)').bind(collection,id,identity.accountId,new Date().toISOString())];
  try{await db.batch(statements)}catch{throw uadavJobError('JOB_ACCOUNT_CONFLICT','No se confirmó el vínculo. La gestión, la cuenta o sus permisos pudieron cambiar.',409)}
  return {success:true,tipo:body.tipo,id};
}
async function uadavJobAccountUnlink(request,env,body){
  const identity=await uadavJobAccountIdentity(request,env),db=uadavJobDB(env),collection=body?.tipo==='oferta'?'bolsa_trabajo':body?.tipo==='postulacion'?'postulaciones_trabajo':'';
  if(body?.confirm!=='QUITAR_DE_MI_CUENTA'||!collection||typeof body.id!=='string'||body.id.length>100)throw uadavJobError('JOB_ACCOUNT_CONFIRM','Confirmá que querés quitar esta gestión de Mi Perfil.',400);
  try{await db.batch([...uadavJobAccountGuards(db,identity),db.prepare('DELETE FROM job_account_links WHERE collection=? AND record_id=? AND account_id=?').bind(collection,body.id,identity.accountId)])}catch{throw uadavJobError('JOB_ACCOUNT_CONFLICT','No se confirmó el cambio. Volvé a ingresar a Mi Perfil.',409)}
  return {success:true};
}
function uadavJobAccountNotice(db,{id,collection,recordId,title,message}){
  const now=new Date().toISOString(),expires=new Date(Date.now()+90*86400000).toISOString();
  return db.prepare('INSERT OR IGNORE INTO audience_announcements(id,title,message,account_id,created_at,expires_at) SELECT ?,?,?,l.account_id,?,? FROM job_account_links l JOIN audience_accounts a ON a.id=l.account_id WHERE l.collection=? AND l.record_id=? AND NOT EXISTS(SELECT 1 FROM audience_deletions x WHERE x.account_id=l.account_id)').bind(id,title,message,now,expires,collection,recordId);
}
async function uadavJobAccountRestoreProof(db,backup,additions){
  if(!await uadavJobAccountFeatures(db)||backup.job_storage!=='d1'||!Array.isArray(backup.tables?.job_account_links)||backup.tables.job_account_links.length>4000)throw uadavJobError('JOB_ACCOUNT_RESTORE','El respaldo no permite validar los vínculos de Mi Perfil.',400);
  const wanted=new Set(Object.entries(additions).flatMap(([collection,items])=>items.map(item=>collection+'|'+item.id))),seen=new Set(),links=[];
  for(const link of backup.tables.job_account_links){
    const key=link?.collection+'|'+link?.record_id;
    if(!UADAV_JOB_COLLECTIONS.includes(link?.collection)||typeof link.record_id!=='string'||!/^[a-f0-9]{64}$/.test(link.account_id||'')||!Number.isFinite(Date.parse(link.linked_at||''))||seen.has(key))throw uadavJobError('JOB_ACCOUNT_RESTORE','El respaldo contiene vínculos de cuenta inválidos o duplicados.',400);
    seen.add(key);if(wanted.has(key))links.push(link);
  }
  return links;
}
