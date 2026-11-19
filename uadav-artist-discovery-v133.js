(function(g){'use strict';const KEY='uadav_artist_discovery_v133',TTL=7*86400000,MAX=80,normal=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>x&&x.visible!==false&&Date.now()-Number(x.seen_at||0)<TTL).slice(0,MAX):[]}catch{return[]}}
function remember(a){if(!a||a.visible===false||a.review_level==='red'||!(a.nombre||a.nombre_artistico)||!(a.id||a.canal||a.channel_id))return;const item={id:String(a.id||'').slice(0,180),nombre:String(a.nombre||a.nombre_artistico).slice(0,180),nombre_artistico:String(a.nombre_artistico||a.nombre||'').slice(0,180),rubro:String(a.rubro||'Artista').slice(0,140),ciudad:String(a.ciudad||'').slice(0,140),foto:String(a.foto||a.thumbnail||'').slice(0,2000),portada:String(a.portada||'').slice(0,2000),bio:String(a.bio||'').slice(0,1200),bio_es:String(a.bio_es||'').slice(0,1200),canal:String(a.canal||a.channel_id||'').slice(0,100),discovered:a.existing===true?false:a.discovered===true,visible:true,seen_at:Date.now()};const key=identity(item);try{
 const recent=read();
 const previous=recent.find(x=>identity(x)===key);
 if(item.discovered&&previous?.discovered&&item.canal&&item.canal===previous.canal){
  for(const field of ['foto','portada','bio','bio_es'])if(!item[field])item[field]=previous[field]||'';
 }
 localStorage.setItem(KEY,JSON.stringify([item,...recent.filter(x=>identity(x)!==key)].slice(0,MAX)));g.dispatchEvent(new Event('uadav:artist-discovered'))}catch{}}
function identity(a){return a.canal||a.channel_id||a.id||normal(a.nombre||a.nombre_artistico)}
function merge(catalog=[]){const seen=new Set(),result=[];const ordered=[...read().map(x=>catalog.find(a=>identity(a)===identity(x)||(a.id&&a.id===x.id))||x),...catalog];for(const a of ordered){if(!a||a.visible===false||!(a.id||a.canal||a.channel_id))continue;const keys=[identity(a),a.id].filter(Boolean);if(!keys.length||keys.some(k=>seen.has(k)))continue;keys.forEach(k=>seen.add(k));result.push(a)}return result}
// Group display cards only. Channel IDs still address their own catalogs.
function directoryCards(artists){
 const suffix=/\s+[-–—]\s*topic$/i;
 const names=a=>[a.nombre,a.nombre_artistico].filter(Boolean).map(normal);
 const isTopic=a=>!a.claimed&&!a.self_managed&&names(a).some(n=>suffix.test(n));
 const candidates=new Map();
 for(const artist of artists){
  if(isTopic(artist))continue;
  const aliases=names(artist).map(n=>n.replace(/\s+(?:official|oficial)$/,''));
  if(aliases.includes('sandra lauer cretu')&&
     (names(artist).includes('sandra lauer cretu official')||normal(artist.canal)==='@sandralauercretuofficial87'))aliases.push('sandra');
  for(const alias of new Set(aliases)){
   candidates.set(alias,(candidates.get(alias)||0)+1);
  }
 }
 return artists.filter(a=>!isTopic(a)||!names(a).some(n=>suffix.test(n)&&candidates.get(n.replace(suffix,'').trim())===1));
}
function exactName(a,query){
 return [a.nombre,a.nombre_artistico].some(n=>n&&normal(n)===query);
}
function topicAlias(a,query){
 if(!a.discovered||a.claimed||a.self_managed||!query)return false;
 return [a.nombre,a.nombre_artistico].some(n=>n&&/\s+[-–—]\s+topic$/i.test(n.trim())&&normal(n.replace(/\s+[-–—]\s+topic\s*$/i,''))===query);
}
function find(q){
 const query=normal(q),artists=read();
 const exact=artists.find(a=>exactName(a,query));
 if(exact)return exact;
 const aliases=artists.filter(a=>topicAlias(a,query));
 return aliases.length===1?aliases[0]:null;
}
function preferredHandle(query){const name=normal(query);if(name==='aqua')return 'UCXPUjGFDr4tcKkaFm6PiV-A';return name==='masterboy'?'@Masterboy90s':''}
function rankMatches(artists,q){const query=normal(q).replace(/\s+/g,' ');if(!query)return [...artists];const score=a=>Math.max(...[a.nombre,a.nombre_artistico,a.name,a.title].filter(Boolean).map(v=>{const name=normal(v).replace(/\s+/g,' ');if(a.canal&&preferredHandle(query)&&normal(a.canal)===normal(preferredHandle(query)))return 310;if(topicAlias(a,query))return 50;if(name===query+' official'||name===query+' oficial')return 250;return name===query?300:name.startsWith(query+' ')?200:name.includes(query)?100:0}),0);return artists.map((a,i)=>({a,i,score:score(a)})).sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.a)}
function rememberMatches(q,artists){for(const a of artists||[])if(exactName(a,normal(q))||topicAlias(a,normal(q)))remember(a)}

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
 return {id:'discover:'+channelId,canal:channelId,nombre:name,nombre_artistico:name,foto:info.foto||info.thumbnail||'',portada:info.portada||info.banner||'',bio:info.bio||info.description||'',bio_es:typeof info.bio_es==='string'?info.bio_es:'',rubro:info.rubro||'Creador',visible:true,discovered:true,generated:true,source:'Canal público de YouTube'};
}


// Reuse explicit YouTube channel identities returned with search results. Never infer a channel from a name.
function rememberChannel(result){
 if(!result||result.visible===false||result.review_level==='red')return null;
 const ref=channelRef(result.channelId||result.channel_id||result.authorId||result.author_url||result.channel_url||'');
 if(!/^UC[A-Za-z0-9_-]{22}$/.test(ref))return null;
 const name=String(result.author||result.channelTitle||result.channel_name||'').trim();
 if(!name)return null;
 const profile=fromChannelInfo({channelId:ref,nombre:name,foto:result.author_thumbnail||result.channelThumbnail||result.authorThumbnails?.[0]?.url||''});
 remember(profile);return profile;
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

g.UADAVArtistDiscovery={directoryCards,preferredHandle,remember,rememberMatches,rankMatches,read,merge,find,identity,channelRef,profileHref,fromChannelInfo,rememberChannel,followedProfileHref};
})(globalThis);
