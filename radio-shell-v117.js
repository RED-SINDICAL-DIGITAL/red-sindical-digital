(()=>{
'use strict';
if(!/\/radio\.html$/i.test(location.pathname)) return;
const sameOriginParent=()=>{try{return window.parent!==window&&window.parent.location.origin===location.origin}catch{return false}};
function host(){try{return window.parent.UADAVShellHost||window.parent.UADAV_APP||window.parent.UADAVShell||null}catch{return null}}
function send(type,data={}){if(!sameOriginParent())return false;const payload={type,...data};try{const h=host();if(type==='uadav:radio-play'&&typeof h?.playRadio==='function'){h.playRadio(data.radio||{});return true}if(type==='uadav:radio-close'&&typeof h?.closeRadio==='function'){h.closeRadio();return true}if(typeof h?.dispatch==='function'){h.dispatch(payload);return true}window.parent.postMessage(payload,location.origin);return true}catch{return false}}
window.UADAVRadioShell={
 play:radio=>send('uadav:radio-play',{radio}),
 pause:()=>send('uadav:radio-pause'),
 close:()=>send('uadav:radio-close'),
 volume:value=>send('uadav:radio-volume',{value:Math.max(0,Math.min(1,Number(value)||0))}),
 mute:()=>send('uadav:radio-mute'),
 state:()=>send('uadav:radio-state-request')
};
if(sameOriginParent()){
 document.addEventListener('DOMContentLoaded',()=>{
   document.querySelectorAll('audio').forEach(a=>{a.pause();a.removeAttribute('autoplay');});
   window.UADAVRadioShell.state();
 },{once:true});
}
window.addEventListener('pagehide',()=>{ /* Shell owns persistence; never stop radio on view navigation. */ });
})();
