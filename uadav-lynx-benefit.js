(function(root){'use strict';
 function enabled(config){const x=config?.data||config||{};return x.lynx_music_enabled===true}
 async function mount(){const content=document.getElementById('lynxContent'),unavailable=document.getElementById('lynxUnavailable');if(!content)return;try{const base=root.UADAV_API_BASE||root.PLATFORM_API_BASE;if(!base)return;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);try{const r=await fetch(base.replace(/\/?$/,'/')+'landing_config',{signal:controller.signal,cache:'no-store'});if(!r.ok)return;const visible=enabled(await r.json());content.hidden=!visible;unavailable.hidden=visible}finally{clearTimeout(timer)}}catch{content.hidden=true;unavailable.hidden=false}}
 root.UADAVLynxBenefit={enabled,mount};if(typeof document!=='undefined')mount();
})(typeof window!=='undefined'?window:globalThis);
