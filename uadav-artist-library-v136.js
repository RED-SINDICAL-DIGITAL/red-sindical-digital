(()=>{'use strict';const states=new Map();let active='inicio',playing=null,mountedRef='';window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='uadav:playlist-state')return;playing=e.data;markPlaying()});function markPlaying(){document.querySelectorAll('[data-public-playlist]').forEach(b=>{const on=playing?.playlist_id===b.dataset.publicPlaylist;b.setAttribute('aria-current',on?'true':'false');const label=b.querySelector('[data-play-label]');if(label)label.textContent=on?(playing.playing?'▶ Sonando · ':'Ⅱ En pausa · ')+(playing.title||'Playlist'):'▶ Reproducir';b.style.borderColor=on?'#2f6df6':''})}
function reference(a){const raw=String(a.canal||a.channel_id||a.youtube||a.youtube_url||'').trim();if(/^UC[A-Za-z0-9_-]{22}$/.test(raw)||/^@[A-Za-z0-9_.-]{1,100}$/.test(raw))return raw;try{const u=new URL(raw);if(!/(^|\.)youtube\.com$/i.test(u.hostname))return'';const p=u.pathname.split('/').filter(Boolean);return p[0]==='channel'&&/^UC[A-Za-z0-9_-]{22}$/.test(p[1]||'')?p[1]:p[0]?.startsWith('@')?p[0]:''}catch{return''}}
function playlistTitle(p,index=0){return String(p.titulo||p.title||p.name||'').trim()||'Playlist del canal '+(index+1)}
function playlistCount(p){const count=p.count??p.videoCount??p.video_count;if(!String(p.titulo||p.title||p.name||'').trim()||count===null||count===undefined||count===''||!Number.isFinite(Number(count))||Number(count)<0)return 'Cantidad de videos no disponible';return Number(count)+' '+(Number(count)===1?'video':'videos')}
function isAlbum(p,artist={}){const normal=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(),title=normal(p.titulo||p.title||p.name);if(/\b(favoritos|favorites|mix|mixes|discografia|discography|compilation|compilacion|varios artistas)\b/i.test(title))return false;return /^OLAK5uy_[\w-]+$/.test(p.id||'')||/\b(album|full album|complete album)\b/i.test(title)||(Array.isArray(artist.album_titles)&&artist.album_titles.some(name=>normal(name)===title))}
const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function plainYouTubeTitle(value){return String(value??'').replace(/&(?:amp|quot|apos|lt|gt|#39|#34|#x27);/gi,entity=>({'&amp;':'&','&quot;':'\"','&apos;':"'",'&lt;':'<','&gt;':'>','&#39;':"'",'&#34;':'\"','&#x27;':"'"}[entity.toLowerCase()]||entity))}
function validateLibraryPage(data,kind,cursor,ref){
 if(data?.kind&&data.kind!==kind)throw Error('La respuesta corresponde a otra sección.');
 if(/^UC[A-Za-z0-9_-]{22}$/.test(ref)&&data?.channel_id&&data.channel_id!==ref)throw Error('La respuesta corresponde a otro canal.');
 if(!data||!Array.isArray(data.items)||data.items.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw Error('Respuesta de catálogo incompleta.');
 if(kind!=='videos'&&data.items.some(x=>typeof x.id!=='string'||!x.id.trim()))throw Error('Playlist sin identificador.');
 const next=data.next_cursor;
 if(next!=null&&typeof next!=='string')throw Error('Paginación inválida.');
 if(next&&next===cursor)throw Error('La paginación no avanzó.');
 return {...data,next_cursor:next||null};
}
async function releaseMetadata(ref){
 if(!/^UC[\w-]{22}$/.test(ref))return null;
 const get=async(resource,params)=>{
  const query=new URLSearchParams({...params,fmt:'json'});
  const response=await fetch('https://musicbrainz.org/ws/2/'+resource+'?'+query,{signal:AbortSignal.timeout(4500)});
  if(!response.ok)throw Error('Discografía no disponible');
  return response.json();
 };
 const knownChannels={
  UCefMqcCMiUxvMxdBtIFd6uw:'9809d784-037f-46e7-8d2d-7ecad897f355',
  'UCCUeTp5Qv9FF6apVk-t9kEA':'9809d784-037f-46e7-8d2d-7ecad897f355',
  UCoIOOL7QKuBhQHVKL8y7BEQ:'f27ec8db-af05-4f36-916e-3d57f91ecf5e'
 };
 let artistId=knownChannels[ref];
 if(!artistId){
  for(const host of ['www.youtube.com','music.youtube.com']){
   const query=new URLSearchParams({resource:'https://'+host+'/channel/'+ref,inc:'artist-rels',fmt:'json'});
   const response=await fetch('https://musicbrainz.org/ws/2/url?'+query,{signal:AbortSignal.timeout(4500)});
   if(response.status!==404&&!response.ok)throw Error('Discografía no disponible');
   const link=response.ok?await response.json():{};
   const ids=[...new Set((link.relations||[]).map(row=>row.artist?.id).filter(Boolean))];
   if(ids.length>1)return null;
   await new Promise(resolve=>setTimeout(resolve,1100));
   if(ids.length){artistId=ids[0];break}
  }
 }
 if(!artistId)return null;
 const data=await get('release-group',{artist:artistId,type:'album',limit:'100'});
 const items=(data['release-groups']||[]).filter(x=>x.title&&/^[a-f0-9-]{36}$/i.test(x.id)).map(x=>({id:x.id,titulo:x.title,release_year:(x['first-release-date']||'').slice(0,4),metadata_only:true}));
 return items.length?{channel_id:ref,kind:'releases',items,next_cursor:null}:null;
}
async function request(ref,kind,cursor,artistName=''){const api=window.UADAV_API_BASE||'https://uadav-api.uadavstream.workers.dev/api/',path='youtube/channel_library?id='+encodeURIComponent(ref)+'&kind='+kind+(cursor?'&cursor='+encodeURIComponent(cursor):'');const loader=async()=>{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),12000);try{let r,d;try{r=await fetch(api+path,{signal:ctl.signal,cache:'no-store'});d=await r.json()}catch(error){if(cursor||!['videos','releases'].includes(kind))throw error;r={ok:false,status:503}}if(kind==='releases'&&!cursor&&(r.status>=500||(r.ok&&Array.isArray(d?.items)&&!d.items.length&&!d.next_cursor))){try{const metadata=await releaseMetadata(ref);if(metadata)return metadata}catch(error){throw error}}if(r.status>=500&&kind==='videos'&&!cursor&&artistName){
 const secondary=await fetch(api+'youtube/search?q='+encodeURIComponent(artistName+' official music videos'),{signal:AbortSignal.timeout(10000)});
 if(secondary.ok){
  const results=await secondary.json();
  const normal=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const name=normal(artistName.replace(/\s+[-–—]\s+Topic$/i,''));
  const candidates=Array.isArray(results)?results:results?.items||[];
  const ranked=new Map();
  for(const item of candidates){
   const id=item?.external_id||item?.id;
   if(!name||!/^[-\w]{11}$/.test(id||''))continue;
   const author=normal(item.author||item.descripcion);
   const exact=author===name||author===name+' topic';
   const matches=value=>(' '+normal(value)+' ').includes(' '+name+' ');
   if(!exact&&!matches(author)&&!matches(item.titulo||item.title))continue;
   const score=exact?2:matches(author)?1:0;
   if(!ranked.has(id)||ranked.get(id).score<score)ranked.set(id,{item,score});
  }
  const items=[...ranked.values()].sort((a,b)=>b.score-a.score).map(entry=>entry.item);
  if(items.length)return {items,next_cursor:null,related_search:true,catalog_limited:true};
 }
}if(!r.ok)throw Error('No pudimos consultar esta parte del canal.');return validateLibraryPage(d,kind,cursor,ref)}finally{clearTimeout(t)}};return window.UADAVPublicCache?window.UADAVPublicCache.json(api+path,loader,kind==='playlists'?10000:300000,kind==='releases'&&!cursor?86400000:0):loader()}
window.UADAVArtistLibrary={isAlbum,isCurrent:ref=>mountedRef===ref,mount({artist,onVideos}){const ref=reference(artist),display=window.UADAVProfileDisplay?.normalize(artist.profile_display)||{videos:true,playlists:true};mountedRef=ref&&artist.youtube_auto_content!==false&&(display.videos||display.playlists)?ref:'';if(!mountedRef)return;let s=states.get(ref);if(!s){s={ref,releases:{loaded:false,loading:false,cursor:null,error:'',items:[]},videos:{loaded:false,loading:false,cursor:null,error:''},playlists:{loaded:false,loading:false,cursor:null,error:'',items:[]}};states.set(ref,s)}s.onVideos=onVideos;const requestedTab=new URLSearchParams(location.search).get('tab');active=s.active||(['videos','playlists','albums'].includes(requestedTab)?requestedTab:'inicio');
 const video=document.getElementById('tab-videos'),nav=document.querySelector('.tabs'),main=document.querySelector('.main');if(!video||!nav||!main)return;
 const controls=(kind,target)=>{if(!target)return;let el=document.getElementById('youtube-'+kind+'-controls');if(!el){el=document.createElement('div');el.id='youtube-'+kind+'-controls';el.className='panel';target.appendChild(el)}const state=s[kind];if(kind==='videos')for(const empty of target.querySelectorAll?.('.empty')||[])empty.hidden=!state.loaded||!!state.error||!!state.loading;el.innerHTML='<p role="status">'+(state.error?esc(state.error):state.loading?'Cargando contenido…':state.cachedCatalog?'Mostramos la última discografía guardada en esta sesión.':state.relatedSearch?'Videos relacionados encontrados por nombre. Pueden incluir otros canales.':state.catalogLimited?'Mostramos una consulta alternativa del mismo canal. Puede no incluir todo su catálogo.':state.metadataIncomplete?'No están disponibles todos los datos de estas playlists.':state.loaded&&!state.cursor?(kind==='playlists'&&!state.items.length?'Este canal no tiene playlists públicas disponibles.':kind==='videos'&&!state.hasItems?'No encontramos videos públicos disponibles en este canal.':'Llegaste al final del contenido disponible.'):'')+'</p>'+(state.loading?'<button class="btn" disabled>Cargando…</button>':!state.loaded||state.cursor||state.error?'<button class="btn" type="button">'+(state.error?'Reintentar':state.loaded?'＋ Ver más '+(kind==='videos'?'videos':kind==='releases'?'lanzamientos':'playlists'):(kind==='releases'?'Consultar lanzamientos':'Consultar '+kind))+'</button>':'');el.querySelector('button:not([disabled])')?.addEventListener('click',()=>load(kind));};
 let tab=document.querySelector('[data-tab="playlists"]');if(!tab&&display.playlists){tab=document.createElement('button');tab.type='button';tab.className='tab';tab.dataset.tab='playlists';tab.textContent='Playlists';nav.appendChild(tab)}
 if(tab)tab.hidden=!display.playlists;
 let panel=document.getElementById('tab-playlists');if(!panel){panel=document.createElement('div');panel.id='tab-playlists';panel.hidden=true;main.appendChild(panel)}
 panel.innerHTML='<section class="panel"><h2>Playlists del canal</h2><div class="youtube-playlists">'+s.playlists.items.map((p,i)=>'<button type="button" class="youtube-playlist" data-public-playlist="'+esc(p.id)+'" data-playlist="'+i+'"><img src="'+esc(p.thumbnail||'/media-fallback.svg')+'" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'/media-fallback.svg\'"><strong>'+esc(playlistTitle(p,i))+'</strong><span>'+esc(playlistCount(p))+'</span><span data-play-label>▶ Reproducir</span></button>').join('')+'</div></section>';
 panel.querySelectorAll('[data-playlist]').forEach(b=>b.onclick=()=>{const index=Number(b.dataset.playlist),original=s.playlists.items[index],item={...original,titulo:playlistTitle(original,index)};try{const host=window.parent!==window&&(window.parent.UADAVShellHost||window.parent.UADAV_APP||window.parent.UADAVShell);if(host?.playContent){host.playContent(item);return}}catch{}if(window.parent!==window)window.parent.postMessage({type:'uadav:content-play',item},location.origin);else window.open(item.url,'_blank','noopener')});
 let albumsTab=document.querySelector('[data-tab="albums"]');if(!albumsTab&&display.playlists){albumsTab=document.createElement('button');albumsTab.type='button';albumsTab.className='tab';albumsTab.dataset.tab='albums';albumsTab.textContent='Álbumes';nav.appendChild(albumsTab)}if(albumsTab)albumsTab.hidden=!display.playlists||(active!=='albums'&&s.releases.loaded&&!s.releases.items.length&&!s.releases.cursor&&s.playlists.loaded&&!s.playlists.cursor&&!s.playlists.items.some(p=>isAlbum(p,artist)));
 let albums=document.getElementById('tab-albums');if(!albums){albums=document.createElement('div');albums.id='tab-albums';albums.hidden=true;main.appendChild(albums)}const releaseIds=new Set(s.releases.items.map(p=>p.id));const albumItems=[...s.releases.items,...s.playlists.items.filter(p=>!releaseIds.has(p.id)&&isAlbum(p,artist))];albums.innerHTML='<section class="panel"><h2>Álbumes y lanzamientos</h2><div class="youtube-playlists">'+albumItems.map((p,i)=>p.metadata_only?'<a class="youtube-playlist" href="/buscar.html?q='+encodeURIComponent((artist.nombre||artist.nombre_artistico||'')+' '+p.titulo)+'"><strong>'+esc(p.titulo)+'</strong><span>'+esc(['MusicBrainz',p.release_year].filter(Boolean).join(' · '))+'</span><span>Buscar canciones</span></a>':'<button type="button" class="youtube-playlist" data-public-playlist="'+esc(p.id)+'" data-album="'+i+'"><img src="'+esc(p.thumbnail||'/media-fallback.svg')+'" alt="" loading="lazy"><strong>'+esc(playlistTitle(p,i))+'</strong><span>'+(releaseIds.has(p.id)?['Lanzamiento',p.release_year].filter(Boolean).join(' · '):'Colección del canal')+'</span><span data-play-label>▶ Reproducir</span></button>').join('')+'</div>'+(!albumItems.length&&s.releases.loaded&&!s.releases.cursor&&s.playlists.loaded&&!s.playlists.cursor?'<p>No hay álbumes identificados entre las playlists cargadas.</p>':'')+'</section>';
 albums.querySelectorAll('[data-album]').forEach(b=>b.onclick=()=>{const item=albumItems[Number(b.dataset.album)];if(window.parent!==window)window.parent.postMessage({type:'uadav:content-play',item},location.origin);else window.open(item.url,'_blank','noopener')});
 const select=id=>{active=id;s.active=id;document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('active',b.dataset.tab===id);b.setAttribute('aria-pressed',String(b.dataset.tab===id))});for(const name of ['inicio','musica','videos','clips','live','eventos','about','playlists','albums']){const el=document.getElementById('tab-'+name);if(el)el.hidden=name!==id}};
 function loadSelectedTab(){
  const loadFirst=kind=>{
   const state=s[kind];
   if(!state.loaded&&!state.loading&&!state.error)load(kind);
  };
  if(active==='albums'&&display.playlists){
   loadFirst('releases');
   if(s.releases.error||(s.releases.loaded&&!s.releases.items.length))loadFirst('playlists');
  }else if(active==='playlists'&&display.playlists)loadFirst('playlists');
  else if((active==='inicio'||active==='videos')&&display.videos)loadFirst('videos');
 }
 document.querySelectorAll('.tab').forEach(b=>{b.onclick=()=>{select(b.dataset.tab);loadSelectedTab()}});if(display.videos)document.querySelector('[data-tab="videos"]')?.removeAttribute('hidden');if(!document.querySelector('[data-tab="'+active+'"]:not([hidden])'))active='inicio';select(active);
 if(display.videos)controls('videos',video);if(display.playlists){controls('playlists',panel);let el=document.getElementById('album-load-controls');if(!el){el=document.createElement('div');el.id='album-load-controls';el.className='panel';albums.appendChild(el)}const st=s.playlists;el.hidden=(st.loaded&&!st.cursor&&!st.error)||!(s.releases.error||(s.releases.loaded&&!s.releases.items.length));el.innerHTML='<p role="status">'+esc(st.error|| (st.loading?'Consultando playlists…':st.loaded&&!st.cursor?'Llegaste al final de las playlists disponibles.':''))+'</p>'+(!st.loaded||st.cursor||st.error?'<button type="button" class="btn" '+(st.loading?'disabled':'')+'>'+ (st.error?'Reintentar':st.loaded?'Buscar en más playlists':'Consultar playlists')+'</button>':'');el.querySelector('button')?.addEventListener('click',()=>load('playlists'))}
 async function load(kind){const live=()=>window.UADAVArtistLibrary?.isCurrent?.(ref)!==false;if(!display[kind==='releases'?'playlists':kind]||!live())return;const st=s[kind];if(st.loading)return;st.loading=true;st.error='';if(kind==='playlists'){
 const fallback=document.getElementById('album-load-controls');
 if(fallback&&s.releases&&(s.releases.error||(s.releases.loaded&&!s.releases.items.length))){
  fallback.hidden=false;
  const status=fallback.querySelector('[role="status"]');
  if(status)status.textContent='Buscando discos entre las playlists del canal…';
 }
 document.querySelector('#album-load-controls button')?.setAttribute('disabled','')
};controls(kind,kind==='videos'?video:kind==='releases'?albums:panel);try{const requestedCursor=st.cursor,raw=await request(ref,kind,requestedCursor,artist.nombre||artist.nombre_artistico);if(!live()){st.loading=false;return}const d=validateLibraryPage(raw,kind,requestedCursor,ref),seen=new Set(st.seenCursors||[]);if(d.next_cursor&&seen.has(d.next_cursor))throw Error('La fuente repitió una página.');const acceptPage=()=>{seen.add(requestedCursor);st.seenCursors=seen};if(kind==='videos'){s.onVideos(d.items.map(item=>({...item,...Object.fromEntries(['title','titulo','author','channelTitle'].filter(field=>typeof item[field]==='string').map(field=>[field,plainYouTubeTitle(item[field])]))})));if(!live()){st.loading=false;return}acceptPage();st.relatedSearch=d.related_search===true;st.catalogLimited=d.catalog_limited===true;st.hasItems=st.hasItems||d.items.length>0;st.loaded=true;st.cursor=d.next_cursor;st.loading=false;controls(kind,document.getElementById('tab-videos'))}else{const known=new Set(st.items.map(x=>x.id)),items=st.items.slice();for(const x of d.items)if(!known.has(x.id)){known.add(x.id);items.push(x)}st.items=items;st.metadataIncomplete=d.metadata_incomplete===true||items.some(p=>!String(p.titulo||p.title||p.name||'').trim());acceptPage();st.cachedCatalog=d.cached_catalog===true;st.loaded=true;st.cursor=d.next_cursor;st.loading=false;window.UADAVArtistLibrary.mount({artist,onVideos:s.onVideos})}}catch{st.loading=false;if(!live())return;if(kind==='playlists'){const retry=document.querySelector('#album-load-controls button');if(retry){retry.disabled=false;retry.textContent='Reintentar'}}st.error='No pudimos cargar esta parte del catálogo. Podés reintentar; el contenido ya cargado sigue disponible.';if(kind==='releases')st.error='La fuente de lanzamientos no respondió.';if(kind==='releases'&&active==='albums'){
  window.UADAVArtistLibrary.mount({artist,onVideos:s.onVideos});return
 }if(kind==='playlists'){
  const status=document.querySelector('#album-load-controls [role="status"]');
  if(status)status.textContent='No pudimos consultar las playlists del canal.';
 }controls(kind,kind==='videos'?document.getElementById('tab-videos'):document.getElementById(kind==='releases'?'tab-albums':'tab-playlists'))}}
 markPlaying();if(display.playlists)controls('releases',albums);
 if(window.parent!==window)window.parent.postMessage({type:'uadav:playlist-state-request'},location.origin);
 loadSelectedTab();
}};
})();
