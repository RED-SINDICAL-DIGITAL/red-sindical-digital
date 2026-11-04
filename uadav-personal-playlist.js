(function(g){'use strict';
function videoId(item){if(!item||typeof item!=='object'||Array.isArray(item))return '';const provider=String(item.provider||'').toLowerCase();if(provider&&provider!=='youtube')return '';for(const value of [item.videoId,item.video_id,item.youtube_id,item.external_id,item.id])if(/^[A-Za-z0-9_-]{11}$/.test(String(value||'')))return String(value);try{const u=new URL(item.url||item.href||item.youtube_url||'');if(u.protocol!=='https:')return '';let id='';if(u.hostname==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(u.hostname))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]||'';return /^[A-Za-z0-9_-]{11}$/.test(id)?id:''}catch{return ''}}
function normalize(items){if(!Array.isArray(items))return [];return items.slice(0,250).flatMap((item,position)=>{const id=videoId(item);return id?[{id,position,titulo:String(item.titulo||item.title||item.name||'Video').slice(0,300),availability:'unknown'}]:[]})}
function libraryItem(item){return Object.fromEntries(Object.entries(item||{}).filter(([key])=>!key.startsWith('__uadav')))}
function key(item){return videoId(item)||String(item?.id||item?.videoId||item?.external_id||item?.url||item?.href||item?.title||item?.name||'')}
g.UADAVPersonalPlaylist={videoId,normalize,libraryItem,key};
})(globalThis);
