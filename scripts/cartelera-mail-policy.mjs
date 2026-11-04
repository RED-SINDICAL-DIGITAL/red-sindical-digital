/* Consent belongs to a verified account, never to an arbitrary form address. */
const mailbox=x=>typeof x==='string'?x.trim().toLowerCase():'';
export function authorization(identity,verified,keyHash,contact){
 if(!identity?.accountId||verified?.verified!==true||!Number.isSafeInteger(verified.revision)||verified.revision<1||mailbox(verified.email)!==mailbox(contact)||!/^[a-f0-9]{64}$/.test(keyHash||''))throw Error('Verificá en Mi Perfil el mismo correo de contacto antes de pedir avisos. Podés publicar sin avisos.');
 return {version:1,consent:true,account_id:identity.accountId,identity_revision:verified.revision,key_hash:keyHash};
}
export function windowStart(value,now=Date.now()){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value||Date.parse(value)>now)return null;
 return new Date(Math.max(Date.parse(value),now-86400000)).toISOString();
}
export function eligible(meta,verified,keyHash,recipient){
 return meta?.version===1&&meta.consent===true&&typeof meta.account_id==='string'&&meta.key_hash===keyHash&&verified?.verified===true&&verified.revision===meta.identity_revision&&mailbox(verified.email)===mailbox(recipient);
}
