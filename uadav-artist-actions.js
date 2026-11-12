(function(root){'use strict';
function managed(a){if(!a||!a.id||String(a.id).startsWith('discover:')||a.visible===false)return false;const state=String(a.estado||'').toLowerCase();if(['pendiente','pending','borrador','oculto','suspendido','descubierto'].includes(state))return false;if(a.self_managed===true||a.managed_profile===true||(a.claimed===true&&a.claim_status==='approved'))return true;return ['autoregistro','solicitud_artista','perfil_artista','artist_registration'].includes(String(a.origen||a.source||'').toLowerCase())}
function canHire(a){return managed(a)&&a.marketplace_enabled!==false}
root.UADAVArtistActions={managed,canHire};if(typeof module==='object'&&module.exports)module.exports=root.UADAVArtistActions;
})(typeof window==='object'?window:globalThis);
