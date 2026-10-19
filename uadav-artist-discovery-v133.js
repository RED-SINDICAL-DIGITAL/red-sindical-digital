(function(g){'use strict';const KEY='uadav_artist_discovery_v133',TTL=7*86400000,MAX=80,normal=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&x.visible!==false&&Date.now()-Number(x.seen_at||0)<TTL).slice(0,MAX):[]}catch{return[]}}
function remember(a){if(!a||a.visible===false||a.review_level==='red'||!(a.nombre||a.nombre_artistico)||!(a.id||a.canal||a.channel_id))return;const item={id:String(a.id||'').slice(0,180),nombre:String(a.nombre||a.nombre_artistico).slice(0,180),nombre_artistico:String(a.nombre_artistico||a.nombre||'').slice(0,180),rubro:String(a.rubro||'Artista').slice(0,140),ciudad:String(a.ciudad||'').slice(0,140),foto:String(a.foto||a.thumbnail||'').slice(0,2000),portada:String(a.portada||'').slice(0,2000),bio:String(a.bio||'').slice(0,1200),canal:String(a.canal||a.channel_id||'').slice(0,100),discovered:a.existing===true?false:a.discovered===true,visible:true,seen_at:Date.now()};const key=identity(item);try{localStorage.setItem(KEY,JSON.stringify([item,...read().filter(x=>identity(x)!==key)].slice(0,MAX)));g.dispatchEvent(new Event('uadav:artist-discovered'))}catch{}}
function identity(a){return a.canal||a.channel_id||a.id||normal(a.nombre||a.nombre_artistico)}
function merge(catalog=[]){const seen=new Set(),result=[];const ordered=[...read().map(x=>catalog.find(a=>identity(a)===identity(x)||(a.id&&a.id===x.id))||x),...catalog];for(const a of ordered){if(!a||a.visible===false)continue;const keys=[identity(a),a.id].filter(Boolean);if(!keys.length||keys.some(k=>seen.has(k)))continue;keys.forEach(k=>seen.add(k));result.push(a)}return result}
function find(q){return read().find(a=>normal(a.nombre)===normal(q)||normal(a.nombre_artistico)===normal(q))||null}
function rememberMatches(q,artists){for(const a of artists||[])if(normal(a.nombre||a.nombre_artistico)===normal(q))remember(a)}

// Accept an explicit channel identity; never guess one from a person's name.
function channelRef(value){
 const raw=String(value||'').trim();
 if(/^UC[A-Za-z0-9_-]{22}$/.test(raw)||/^@[A-Za-z0-9_.-]{1,100}$/.test(raw))return raw;
 try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||!['youtube.com','www.youtube.com','music.youtube.com','m.youtube.com'].includes(u.hostname)||u.port)return '';
 const p=u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
 if(p[0]==='channel'&&/^UC[A-Za-z0-9_-]{22}$/.test(p[1]||''))return p[1];
 if(/^@[A-Za-z0-9_.-]{1,100}$/.test(p[0]||''))return p[0];
 }catch{}return '';
}
function profileHref(a){
 const stable=a.id&&!String(a.id).startsWith('discover:');
 if(stable&&!a.discovered)return '/artista.html?id='+encodeURIComponent(a.id);
 const ref=channelRef(a.canal||a.channel_id||a.youtube_url||a.youtube);
 return '/artista.html?'+(ref?'channel='+encodeURIComponent(ref):'discover='+encodeURIComponent(a.nombre||a.nombre_artistico||a.name||a.title||''));
}
function fromChannelInfo(info){
 const channelId=String(info?.channelId||'');if(!/^UC[A-Za-z0-9_-]{22}$/.test(channelId))throw Error('No encontramos ese canal. Revisá el enlace o @usuario.');
 const name=String(info.nombre||info.title||info.name||'Canal de YouTube');
 return {id:'discover:'+channelId,canal:channelId,nombre:name,nombre_artistico:name,foto:info.foto||info.thumbnail||'',portada:info.portada||info.banner||'',bio:info.bio||info.description||'',rubro:'Creador',visible:true,discovered:true,generated:true,source:'Canal público de YouTube'};
}


function followedProfileHref(a,origin){
 const copy={...a};let saved=null;
 try{const u=new URL(a.url||'',origin);if(u.origin===origin&&!u.username&&!u.password&&/^\/artista(?:\.html)?$/.test(u.pathname))saved=u}catch{}
 const ref=channelRef(a.canal||a.channel_id)||channelRef(String(a.id||'').replace(/^discover:/,''))||channelRef(saved?.searchParams.get('channel'))||channelRef(String(saved?.searchParams.get('id')||'').replace(/^discover:/,''));
 const stable=a.id&&!String(a.id).startsWith('discover:')&&!channelRef(a.id);
 if(stable)return profileHref({...copy,discovered:false});
 if(ref)return profileHref({...copy,canal:ref,discovered:true});
 const savedId=saved?.searchParams.get('id');
 if(savedId&&!savedId.startsWith('discover:'))return profileHref({id:savedId});
 return profileHref({...copy,discovered:true,nombre:saved?.searchParams.get('discover')||a.nombre||a.nombre_artistico||''});
}

g.UADAVArtistDiscovery={remember,rememberMatches,read,merge,find,identity,channelRef,profileHref,fromChannelInfo,followedProfileHref};
})(globalThis);
