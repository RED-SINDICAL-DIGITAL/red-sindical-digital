/* A confirmed receipt is durable; ambiguous sends require review, never blind replay. */
const schema="CREATE TABLE IF NOT EXISTS event_notification_dispatch(notification_id TEXT PRIMARY KEY,state TEXT NOT NULL,owner TEXT,lease_until INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,provider_id TEXT,error_code TEXT,updated_at TEXT NOT NULL)";
async function idempotencyKey(notificationId){
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('cartelera-notice:'+notificationId))),b=>b.toString(16).padStart(2,'0')).join('');
 return digest.slice(0,8)+'-'+digest.slice(8,12)+'-4'+digest.slice(13,16)+'-'+((parseInt(digest[16],16)&3)|8).toString(16)+digest.slice(17,20)+'-'+digest.slice(20,32);
}
async function dispatch(db,send,{now=Date.now(),limit=20,allowedRecipient,notBefore,authorize}={}){
 const general=!allowedRecipient&&typeof authorize==='function'&&typeof notBefore==='string'&&Number.isFinite(Date.parse(notBefore));
 if(typeof send!=='function'||(!allowedRecipient&&!general))return {enabled:false,sent:0,blocked:0,uncertain:0};
 await db.prepare(schema).run();
 await db.prepare("UPDATE event_notification_dispatch SET state='uncertain',owner=NULL,error_code='INTERRUPTED_SEND',updated_at=? WHERE state='sending' AND lease_until<=?").bind(new Date(now).toISOString(),now).run();
 const selection=general?" AND n.created_at>=? AND n.created_at<=? AND json_valid(n.payload_json) AND json_extract(n.payload_json,'$.mail_authorization.version')=1 AND json_extract(n.payload_json,'$.mail_authorization.consent')=1":" AND lower(n.recipient)=lower(?)";
 const params=general?[notBefore,new Date(now).toISOString()]:[allowedRecipient];
 const rows=(await db.prepare("SELECT n.id,n.recipient,n.payload_json FROM notifications n LEFT JOIN event_notification_dispatch d ON d.notification_id=n.id WHERE n.status='queued' AND n.template IN ('event_published','event_featured_requested')"+selection+" AND (d.notification_id IS NULL OR (d.state='retry' AND d.next_at<=? AND d.attempts<3)) ORDER BY n.created_at,n.id LIMIT ?").bind(...params,now,Math.max(1,Math.min(50,limit))).all()).results||[];
 let sent=0,uncertain=0;const blocked=general?0:Number((await db.prepare("SELECT COUNT(*) n FROM notifications WHERE status='queued' AND template IN ('event_published','event_featured_requested') AND COALESCE(lower(recipient),'')<>lower(?)").bind(allowedRecipient).first()).n);
 for(const row of rows){
  if(!row.recipient||!general&&String(row.recipient).toLowerCase()!==String(allowedRecipient).toLowerCase()){continue}
  const owner=crypto.randomUUID(),stamp=new Date(now).toISOString();
  const claimed=await db.prepare("INSERT INTO event_notification_dispatch(notification_id,state,owner,lease_until,attempts,next_at,updated_at) VALUES(?,'sending',?,?,1,0,?) ON CONFLICT(notification_id) DO UPDATE SET state='sending',owner=excluded.owner,lease_until=excluded.lease_until,attempts=attempts+1,updated_at=excluded.updated_at WHERE event_notification_dispatch.state='retry' AND event_notification_dispatch.next_at<=? AND event_notification_dispatch.attempts<3").bind(row.id,owner,now+60000,stamp,now).run();
  if(Number(claimed.meta?.changes)!==1)continue;
  let receipt;
  try{const message={id:row.id,to:row.recipient,payload:JSON.parse(row.payload_json)};receipt=general&&!await authorize(message)?{skipped:true}:await send(message);if(receipt?.skipped===true){await db.batch([db.prepare("UPDATE event_notification_dispatch SET state='cancelled',owner=NULL,error_code='EVENT_NOT_PUBLIC',updated_at=? WHERE notification_id=? AND owner=?").bind(stamp,row.id,owner),db.prepare("UPDATE notifications SET status='cancelled' WHERE id=? AND EXISTS(SELECT 1 FROM event_notification_dispatch WHERE notification_id=? AND state='cancelled')").bind(row.id,row.id)]);continue}if(!receipt||typeof receipt.id!=='string')throw Error('No confirmed receipt')}
  catch(e){const retry=['MAIL_RATE_LIMIT','MAIL_QUOTA','MAIL_CONFIGURATION','MAIL_REJECTED'].includes(e?.code);await db.prepare("UPDATE event_notification_dispatch SET state=?,owner=NULL,next_at=?,error_code=?,updated_at=? WHERE notification_id=? AND owner=?").bind(retry?'retry':'uncertain',now+900000,retry?e.code:'DELIVERY_UNCONFIRMED',stamp,row.id,owner).run();if(!retry)uncertain++;continue}
  // Store provider acceptance first. A later notification-status write may be retried without sending.
  const acceptedWrite=await db.prepare("UPDATE event_notification_dispatch SET state='accepted',provider_id=?,owner=NULL,error_code=NULL,next_at=0,lease_until=0,updated_at=? WHERE notification_id=? AND owner=?").bind(receipt.id,stamp,row.id,owner).run();
  if(Number(acceptedWrite.meta?.changes)!==1){uncertain++;continue;}
  await db.prepare("UPDATE notifications SET status='sent',sent_at=? WHERE id=? AND EXISTS(SELECT 1 FROM event_notification_dispatch WHERE notification_id=? AND state='accepted')").bind(stamp,row.id,row.id).run();sent++;
 }
 await db.prepare("UPDATE notifications SET status='sent',sent_at=COALESCE(sent_at,?) WHERE status='queued' AND EXISTS(SELECT 1 FROM event_notification_dispatch d WHERE d.notification_id=notifications.id AND d.state='accepted')").bind(new Date(now).toISOString()).run();
 return {enabled:true,sent,blocked,uncertain};
}
export {schema,dispatch,idempotencyKey};
