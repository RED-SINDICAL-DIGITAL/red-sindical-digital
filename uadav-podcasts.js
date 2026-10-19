(function(root){'use strict';
function safeURL(value){try{const u=new URL(String(value||''));return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}}
function normalize(item={}){
 const url=safeURL(item.url||item.href||item.media_url||item.audio_url||item.video_url||item.enclosure_url||item.source_url||item.link);
 const declared=String(item.media_type||item.format||item.episode_type||'').toLowerCase();
 let hostname='';try{hostname=new URL(url).hostname}catch{}
 const video=/^(video|videopodcast)$/.test(declared)||/\.(mp4|webm)(?:[?#]|$)/i.test(url)||/(^|\.)(youtube\.com|youtu\.be|vimeo\.com|ok\.ru)$/.test(hostname);
 const audio=/^audio$/.test(declared)||/\.(mp3|aac|m4a|ogg|wav)(?:[?#]|$)/i.test(url)||/(^|\.)(soundcloud\.com)$/.test(hostname);
 const youtube=String(item.provider||'').toLowerCase()==='youtube'&&/^[\w-]{11}$/.test(String(item.external_id||item.youtube_id||''));
 return {...item,url,title:String(item.titulo||item.title||item.nombre||'Episodio'),thumbnail:safeURL(item.thumbnail||item.imagen||item.poster||item.portada),description:String(item.descripcion||item.description||''),kind:video||youtube?'video':audio?'audio':'external'};
}
function episodes(data){const list=Array.isArray(data)?data:(data?.items||data?.data||data?.results||[]);
 return (Array.isArray(list)?list:[]).filter(x=>x&&/podcast|episode|episodio|rss/i.test([x.content_type,x.tipo,x.categoria,x.category].filter(Boolean).join(' '))).map(normalize)}
function select(items,query='',kind='all'){const clean=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const q=clean(query.trim());return items.filter(x=>(kind==='all'||x.kind===kind)&&clean(x.title+' '+x.description+' '+(x.artista||x.author||'')).includes(q))}
if(typeof module==='object'&&module.exports)module.exports={safeURL,normalize,episodes,select};
if(!root.document)return;
const $=id=>document.getElementById(id);let all=[],filter='all',loading=false;
function el(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n}
function fallback(img){img.onerror=()=>{img.onerror=null;img.src='/radio-fallback.svg'}}
function render(){
 const list=$('podcastList'),items=select(all,$('podcastSearch').value,filter);list.replaceChildren();
 $('podcastStatus').textContent=items.length+' '+(items.length===1?'episodio':'episodios');
 if(!items.length){list.append(el('p',all.length?'No hay episodios para esta búsqueda.':'Todavía no hay podcasts disponibles.','podcastEmpty'));return}
 for(const item of items){
  const row=el('article',null,'podcastCard'),cover=el('img');cover.alt='';cover.loading='lazy';fallback(cover);cover.src=item.thumbnail||'/radio-fallback.svg';
  const copy=el('div',null,'podcastCopy');copy.append(el('span',item.kind==='video'?'VIDEO':item.kind==='audio'?'AUDIO':'SERVICIO EXTERNO','podcastKind'),el('h2',item.title));
  if(item.artista||item.author)copy.append(el('p',String(item.artista||item.author),'podcastAuthor'));
  if(item.description)copy.append(el('p',item.description,'podcastDescription'));
  const action=el('button',item.kind==='video'?'Ver episodio':item.kind==='audio'?'Escuchar episodio':'Abrir episodio','podcastPlay');action.type='button';action.setAttribute('aria-label',action.textContent+': '+item.title);
  action.onclick=()=>play(item,action);row.append(cover,copy,action);list.append(row);
 }
}
function play(item,button){
 let host;try{host=root.parent!==root&&(root.parent.UADAVShellHost||root.parent.UADAV_APP)}catch{}
 const media={...item,titulo:item.title};
 if(host?.playContent){if(host.playContent(media)===false)$('podcastStatus').textContent='Esta fuente no se puede reproducir aquí.';return}
 const url=item.url;
 if(!url){$('podcastStatus').textContent='Este episodio todavía no tiene un enlace reproducible.';return}
 const modal=$('podcastDialog'),stage=$('podcastStage');stage.replaceChildren();let player;
 if(/\.(mp3|aac|m4a|ogg|wav)(?:[?#]|$)/i.test(url))player=el('audio');
 else if(/\.(mp4|webm)(?:[?#]|$)/i.test(url))player=el('video');
 if(player){player.controls=true;player.autoplay=true;player.playsInline=true;player.src=url;stage.append(player);$('podcastTitle').textContent=item.title;modal.showModal();return}
 // Embedded services remain in their official experience when opened without the app shell.
 const link=el('a','Abrir en el servicio original');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.className='podcastPlay';stage.append(link);$('podcastTitle').textContent=item.title;modal.showModal();
}
async function load(){if(loading)return;loading=true;$('podcastRetry').hidden=true;$('podcastStatus').textContent='Cargando episodios…';
 try{const base=root.UADAV_API_BASE||'https://uadav-api.uadavstream.workers.dev/api/';const results=await Promise.allSettled(['content','podcasts/episodes'].map(async route=>{const r=await fetch(base+route+'?_='+Date.now(),{cache:'no-store'});if(route==='podcasts/episodes'&&r.status===404)return {items:[],unsupported:true};if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data)&&!['items','data','results'].some(k=>Array.isArray(data?.[k])))throw Error();return {items:episodes(data)}}));if(!results.some(r=>r.status==='fulfilled'&&!r.value.unsupported))throw Error();const combined=results.flatMap(r=>r.status==='fulfilled'?r.value.items:[]),seen=new Set();all=combined.filter(item=>{const key=item.url||item.id||(item.source_id&&item.guid?item.source_id+'|'+item.guid:'');if(!key||seen.has(key))return false;seen.add(key);return true});render();if(results.some(r=>r.status==='rejected')){$('podcastStatus').textContent+=' · Parte del catálogo no pudo cargarse.';$('podcastRetry').hidden=false}}
 catch{$('podcastStatus').textContent='No pudimos cargar los podcasts. Volvé a intentarlo.';$('podcastRetry').hidden=false}
 finally{loading=false}
}
$('podcastSearch').addEventListener('input',render);$('podcastRetry').onclick=load;
document.querySelectorAll('[data-podcast-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.podcastFilter;document.querySelectorAll('[data-podcast-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()});
$('podcastDialog').addEventListener('close',()=>$('podcastStage').replaceChildren());$('podcastClose').onclick=()=>$('podcastDialog').close();
load();
})(typeof window==='object'?window:globalThis);