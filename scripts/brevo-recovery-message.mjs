/* Preparatory immutable envelope for a single staging recovery email.
 * Stored only inside the outbox AES-GCM payload; never returned by HTTP.
 * The transport key fingerprint binds retries to the original key context. */
import {ACCESS_MAIL_TTL_MS,buildAccessMailMessage} from './access-mail-message.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const fail=()=>{throw Object.assign(Error('MAIL_SNAPSHOT'),{code:'MAIL_SNAPSHOT'})};
const exact=(object,keys)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).length===keys.length&&keys.every(k=>Object.hasOwn(object,k));
export function brevoStagingAddress(value){return typeof value==='string'&&value.length<=160&&/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(value)&&value.split('@')[1].split('.').every(s=>s.length<=63&&/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(s))?value.toLowerCase():''}
export async function brevoTransportHash(apiKey){return digest('uadav-brevo-context-v1:'+apiKey)}
function input({requestId,to,token,issuedAt,expiresAt,jobId,transportHash}){
 if(typeof requestId!=='string'||!uuid.test(requestId)||brevoStagingAddress(to)!==to||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||
   !Number.isSafeInteger(issuedAt)||issuedAt<=0||!Number.isSafeInteger(expiresAt)||expiresAt-issuedAt!==ACCESS_MAIL_TTL_MS||
   typeof jobId!=='string'||!/^JOB-[A-Z0-9-]{3,80}$/.test(jobId)||!/^[a-f0-9]{64}$/.test(transportHash||''))fail();
}
export async function prepareBrevoRecoveryMessage(options){
 input(options);const {requestId,to,token,issuedAt,expiresAt,jobId,senderEmail,transportHash}=options;
 if(brevoStagingAddress(senderEmail)!==senderEmail||!senderEmail.endsWith('@correo-staging.uadavstream.com.ar'))fail();
 const message=buildAccessMailMessage({purpose:'job_owner_recovery',token,issuedAt,expiresAt,jobId});
 const body=JSON.stringify({sender:{email:senderEmail,name:'UADAV STREAM · pruebas'},to:[{email:to}],...message,headers:{idempotencyKey:requestId}});
 const snapshot={version:1,kind:'brevo-job-recovery',request_id:requestId,transport_hash:transportHash,body_hash:await digest(body),body};
 await validateBrevoRecoveryMessage(snapshot,options);return Object.freeze(snapshot);
}
export async function validateBrevoRecoveryMessage(snapshot,options){
 input(options);const {requestId,to,token,issuedAt,expiresAt,jobId,transportHash}=options;
 if(!exact(snapshot,['version','kind','request_id','transport_hash','body_hash','body'])||snapshot.version!==1||snapshot.kind!=='brevo-job-recovery'||snapshot.request_id!==requestId||snapshot.transport_hash!==transportHash||
   typeof snapshot.body!=='string'||new TextEncoder().encode(snapshot.body).length>6144||await digest(snapshot.body)!==snapshot.body_hash)fail();
 let body;try{body=JSON.parse(snapshot.body)}catch{fail()}
 if(!exact(body,['sender','to','subject','textContent','htmlContent','headers'])||!exact(body.sender,['email','name'])||brevoStagingAddress(body.sender.email)!==body.sender.email||!body.sender.email.endsWith('@correo-staging.uadavstream.com.ar')||
   typeof body.sender.name!=='string'||body.sender.name.length<1||body.sender.name.length>100||/[\x00-\x1f]/.test(body.sender.name)||
   !Array.isArray(body.to)||body.to.length!==1||!exact(body.to[0],['email'])||body.to[0].email!==to||!exact(body.headers,['idempotencyKey'])||body.headers.idempotencyKey!==requestId||
   typeof body.subject!=='string'||body.subject.length<1||body.subject.length>160||/[\r\n]/.test(body.subject)||typeof body.textContent!=='string'||typeof body.htmlContent!=='string')fail();
 // Validate purpose/token/link identity, not current wording. A template change
 // or renamed sender must not rerender a queued message during a retry.
 const link=new URL('/acceso-correo.html','https://uadav-stream-staging.pages.dev');link.hash=new URLSearchParams({purpose:'job_owner_recovery',token,job:jobId}).toString();
 const links=body.textContent.match(/https:\/\/[^\s]+/g)||[];
 if(links.length!==1||links[0]!==link.href||!body.htmlContent.includes(link.href.replaceAll('&','&amp;'))||expiresAt-issuedAt!==ACCESS_MAIL_TTL_MS)fail();
 return snapshot.body;
}
