async function uadavCarteleraMailAuthorization(request,env,body){
 if(body.email_notice_consent!==true)return undefined;
 if(new URL(request.url).origin!==AE_SITE||env.EVENT_ATOMIC_STAGING!=='true'||env.CARTELERA_PUBLICATION_STAGING!=='immediate')throw Error('Los avisos requieren Cartelera de staging.');
 const identity=await aeIdentity(request,env),c=await aeContext(env);aeRequire(c.setting?.enabled===1,'ACCESS_DISABLED');
 return uadavCarteleraMailPolicy.authorization(identity,await c.core.status(identity.accountId),c.keyHash,body.contacto_email||body.email||'');
}
async function uadavCarteleraGeneralMailOptions(env){
 const since=uadavCarteleraMailPolicy.windowStart(env.CARTELERA_MAIL_START_AT);
 if(env.CARTELERA_MAIL_STAGING!=='verified-only'||env.EVENT_ATOMIC_STAGING!=='true'||env.JOB_STORE_MAINTENANCE==='true'||!since)return null;
 const c=await aeContext(env);if(c.setting?.enabled!==1)return null;
 return {notBefore:since,limit:5,authorize:async n=>{
  const m=n.payload?.mail_authorization;if(typeof m?.account_id!=='string')return false;
  const alive=await c.db.prepare('SELECT 1 AS ok FROM audience_accounts a JOIN access_email_identities e ON e.account_id=a.id WHERE a.id=? AND e.revision=? AND e.key_hash=? AND NOT EXISTS(SELECT 1 FROM audience_deletions d WHERE d.account_id=a.id)').bind(m.account_id,m.identity_revision,c.keyHash).first();if(!alive)return false;
  return uadavCarteleraMailPolicy.eligible(m,await c.core.status(m.account_id),c.keyHash,n.to);
 }};
}
