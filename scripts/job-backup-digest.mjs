/* Format checksum only: detects changes/corruption, not issuer authenticity.
 * Older private backups remain explicitly labeled legacy-unchecked. */
export async function verifyJobBackupDigest(backup,cryptoSource=globalThis.crypto){
 const invalid=()=>{throw Object.assign(Error('BACKUP_DIGEST_INVALID'),{code:'BACKUP_DIGEST_INVALID'})};
 if(!backup||typeof backup!=='object'||Array.isArray(backup))invalid();
 if(!Object.hasOwn(backup,'backup_digest'))return{verified:false,legacy:true};
 const d=backup.backup_digest;
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).length!==3||d.algorithm!=='SHA-256'||d.format!=='json-stringify-without-backup_digest-v1'||!/^[a-f0-9]{64}$/.test(d.value||''))invalid();
 const {backup_digest,...unsigned}=backup;
 const actual=Array.from(new Uint8Array(await cryptoSource.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(unsigned)))),n=>n.toString(16).padStart(2,'0')).join('');
 if(actual!==d.value)invalid();return{verified:true,legacy:false,sha256:actual};
}
