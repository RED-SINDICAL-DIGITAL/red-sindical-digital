async function uadavPublicJobRecoveryRoute(request,env,ctx){
 const route=createUadavPublicJobRecovery({
  authorize:async(req,e,token,kind)=>{const ip=req.headers.get('CF-Connecting-IP');if(typeof ip!=='string'||ip.length>64||!/^[a-fA-F0-9:.]+$/.test(ip)||e.JOB_STORE_D1!=='true'||e.JOB_STORE_MAINTENANCE==='true'||!e.DB)return false;if(!await uadavJobRate(e,'public-recovery-'+kind+':'+await liveHash(ip),kind==='request'?5:12,600000))return false;if(kind==='redeem')return true;if(!uadavSecurityConfig(e).enabled)return false;return (await uadavVerifyTurnstile(e,token,'job_recovery')).ok===true;},
  context:async e=>{
   const c=await liveContext(e,false);liveNeed(c.marker&&/^[A-Za-z0-9._-]{32,512}$/.test(e.BREVO_API_KEY||''),'RECOVERY_PUBLIC_CONFIGURATION');
   const proof=await c.db.prepare("SELECT 1 AS ok FROM job_mail_live_qa q WHERE completed_at IS NOT NULL AND q.key_hash=? AND EXISTS(SELECT 1 FROM job_store_meta m WHERE m.key='mail-http-qa:'||q.id AND m.value='requested') LIMIT 1").bind(c.keyHash).first();liveNeed(proof?.ok===1,'RECOVERY_PUBLIC_QA_REQUIRED');
   const engine=uadavLiveMailCore.createJobRecoveryOutbox({db:c.db,mode:'staging-only',encryptionKey:c.encryptionKey});
   return {
    request:async body=>{
     const source=await c.db.prepare("SELECT r.data_json FROM job_store_records r JOIN job_owner_credentials o ON o.job_id=r.id WHERE r.collection='bolsa_trabajo' AND r.id=?").bind(body.job_id).first();let item;try{item=JSON.parse(source?.data_json)}catch{return}const to=uadavLiveMailCore.brevoStagingAddress(item?.contacto_email||item?.email||item?.contacto||'');if(!to||to!==body.email)return;
     const adapter=uadavLiveMailCore.createBrevoStagingMail({mode:'staging-only',apiKey:e.BREVO_API_KEY,senderEmail:'acceso@correo-staging.uadavstream.com.ar',allowedRecipients:[to]});
     await c.db.prepare('INSERT INTO job_store_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind('job-recovery-public:'+body.request_id,body.job_id).run();
     const queued=uadavLiveMailCore.createJobRecoveryOutbox({db:c.db,mode:'staging-only',encryptionKey:c.encryptionKey,prepareDelivery:adapter.prepare});
     await queued.enqueue({jobId:body.job_id,recipient:to,requestId:body.request_id,actorHash:await liveHash(request.headers.get('CF-Connecting-IP'))});
     const pending=await c.db.prepare("SELECT state FROM job_recovery_outbox WHERE request_id=? AND job_id=?").bind(body.request_id,body.job_id).first();
     if(pending&&['queued','sending'].includes(pending.state)&&await uadavJobRate(e,'public-recovery-mail:'+uadavJobToday(),40,86400000))await queued.dispatch(adapter,{jobId:body.job_id,requestId:body.request_id});
     await c.db.prepare("DELETE FROM job_store_meta WHERE key IN (SELECT key FROM job_store_meta m WHERE key LIKE 'job-recovery-public:%' AND NOT EXISTS(SELECT 1 FROM job_recovery_outbox o WHERE m.key='job-recovery-public:'||o.request_id) LIMIT 25)").run();
    },
    redeem:async body=>engine.redeem({jobId:body.job_id,token:body.token,newSecretHash:await liveHash(body.new_secret)})
   };
  }
 });return route(request,env,ctx);
}
async function uadavPublicJobRecoveryReadiness(env){
 const checks={d1:env.JOB_STORE_D1==='true'&&!!env.DB,maintenance_off:env.JOB_STORE_MAINTENANCE!=='true',turnstile:uadavSecurityConfig(env).enabled,mail_key:/^[A-Za-z0-9._-]{32,512}$/.test(env.BREVO_API_KEY||''),encryption_key:liveHex(env.JOB_RECOVERY_ENCRYPTION_KEY),schema:false,http_qa_current_key:false};
 if(checks.d1&&checks.encryption_key){try{const c=await liveContext(env,false);checks.schema=!!c.marker;checks.http_qa_current_key=!!await c.db.prepare("SELECT 1 AS ok FROM job_mail_live_qa q WHERE completed_at IS NOT NULL AND key_hash=? AND EXISTS(SELECT 1 FROM job_store_meta m WHERE m.key='mail-http-qa:'||q.id AND m.value='requested') LIMIT 1").bind(c.keyHash).first()}catch{}}
 const ready=Object.values(checks).every(Boolean);return {scope:'public-job-recovery-readiness',revision:'11770-public-recovery-20261104',read_only:true,checks,ready_to_enable:ready,enabled:ready&&env.JOB_RECOVERY_HTTP_STAGING==='public',production_modified:false};
}
