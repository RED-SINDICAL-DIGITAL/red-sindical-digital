(function(root){'use strict';
 function enabled(config){const x=config?.data||config||{};return x.lynx_music_enabled===true}
 async function mount(){const content=document.getElementById('lynxContent'),unavailable=document.getElementById('lynxUnavailable');if(!content)return;try{const base=root.UADAV_API_BASE||root.PLATFORM_API_BASE;if(!base)return;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);try{const r=await fetch(base.replace(/\/?$/,'/')+'landing_config',{signal:controller.signal,cache:'no-store'});if(!r.ok)return;const raw=await r.json(),config=raw?.data||raw||{},visible=enabled(config);
 if(visible){
 const title=document.getElementById('lynxTitle'),desc=content.querySelector('#lynxTitle + p');
 if(config.lynx_hero_title)title.textContent=config.lynx_hero_title;
 if(config.lynx_hero_description)desc.textContent=config.lynx_hero_description;
 if(config.lynx_hero_image){try{const url=new URL(config.lynx_hero_image);if(url.protocol==='https:'&&!url.username&&!url.password){const image=document.createElement('img');image.src=url.href;image.alt='';image.style.cssText='width:100%;max-height:360px;object-fit:cover;border-radius:16px';content.prepend(image)}}catch{}}
 }content.hidden=!visible;unavailable.hidden=visible}finally{clearTimeout(timer)}}catch{content.hidden=true;unavailable.hidden=false}}
 root.UADAVLynxBenefit={enabled,mount};if(typeof document!=='undefined')mount();
})(typeof window!=='undefined'?window:globalThis);
