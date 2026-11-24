(function(root){'use strict';
function managed(a){if(!a||!a.id||String(a.id).startsWith('discover:')||a.visible===false)return false;const state=String(a.estado||'').toLowerCase();if(['pendiente','pending','borrador','oculto','suspendido','descubierto'].includes(state))return false;if(a.self_managed===true||a.managed_profile===true||(a.claimed===true&&a.claim_status==='approved'))return true;return ['autoregistro','solicitud_artista','perfil_artista','artist_registration'].includes(String(a.origen||a.source||'').toLowerCase())}
function canHire(a){return managed(a)&&a.marketplace_enabled!==false}
function channel(a){const raw=String(a?.canal||a?.channel_id||'').trim();if(/^UC[A-Za-z0-9_-]{22}$/.test(raw))return raw;if(/^@[A-Za-z0-9_.-]+$/.test(raw))return raw.toLowerCase();const id=String(a?.id||'').replace(/^discover:/,'');return /^UC[A-Za-z0-9_-]{22}$/.test(id)?id:''}
function sameArtist(a,b){if(!a||!b)return false;return !!(a.id&&b.id&&String(a.id)===String(b.id))||!!(channel(a)&&channel(a)===channel(b))}
root.UADAVArtistActions={managed,canHire,sameArtist};if(typeof module==='object'&&module.exports)module.exports=root.UADAVArtistActions;
})(typeof window==='object'?window:globalThis);
