/* UADAV listening experience: native sources keep one persistent media element. */
(()=>{'use strict';
const $=id=>document.getElementById(id), dock=$('radioDock'), stage=$('mediaStage');
if(!dock||!stage)return;
const button=(label,text)=>{const b=document.createElement('button');b.type='button';b.className='listeningButton';b.setAttribute('aria-label',label);b.title=label;b.textContent=text;return b};
function coverURL(value){try{const u=new URL(value,location.origin);return /^https?:$/.test(u.protocol)?u.href:'/radio-fallback.svg'}catch{return '/radio-fallback.svg'}}
function artwork(img,value){img.alt='';img.src=coverURL(value||'/radio-fallback.svg');img.onerror=()=>{img.onerror=null;img.src='/radio-fallback.svg'}}
const expand=button('Abrir reproductor de radio','⌃');expand.id='expandRadio';expand.setAttribute('aria-expanded','false');
dock.insertBefore(expand,dock.firstChild);
let previousFocus=null, inertState=[];
function expanded(on){
 dock.classList.toggle('listeningExpanded',on);expand.textContent=on?'⌄':'⌃';
 expand.setAttribute('aria-label',on?'Minimizar reproductor de radio':'Abrir reproductor de radio');expand.setAttribute('aria-expanded',String(on));
 if(on){
  previousFocus=document.activeElement;dock.setAttribute('role','dialog');dock.setAttribute('aria-modal','true');
  inertState=['top','viewWrap','mobile'].map(id=>{const el=$(id);const old=el?.inert;if(el)el.inert=true;return [el,old]});
  expand.focus();
 }else{
  dock.setAttribute('role','region');dock.removeAttribute('aria-modal');
  inertState.forEach(([el,old])=>{if(el)el.inert=old});inertState=[];
  if(previousFocus?.isConnected)previousFocus.focus();previousFocus=null;
 }
}
expand.onclick=()=>expanded(!dock.classList.contains('listeningExpanded'));
dock.addEventListener('keydown',e=>{
 if(!dock.classList.contains('listeningExpanded'))return;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();expanded(false)}
 if(e.key==='Tab'){
  const controls=[...dock.querySelectorAll('button,input,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
  const first=controls[0],last=controls.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 }
});
window.addEventListener('uadav:before-navigate',()=>{if(dock.classList.contains('listeningExpanded'))expanded(false)});
new MutationObserver(()=>{if(!dock.classList.contains('active')&&dock.classList.contains('listeningExpanded'))expanded(false)}).observe(dock,{attributes:true,attributeFilter:['class']});
$('radioArt').addEventListener('error',()=>{if(!$('radioArt').src.endsWith('/radio-fallback.svg'))$('radioArt').src='/radio-fallback.svg'});
const radio=$('radioAudio');
function radioState(){
 const playing=!radio.paused&&!radio.ended&&!radio.error;
 $('radioPlay').setAttribute('aria-label',playing?'Pausar radio':'Reproducir radio');
 $('radioPlay').setAttribute('aria-pressed',String(playing));
}
for(const event of ['play','pause','ended','error'])radio.addEventListener(event,radioState);
function enhanceAudio(audio){
 if(audio.dataset.listeningReady)return;audio.dataset.listeningReady='true';
 const ui=document.createElement('div');ui.className='nativeListening';
 const cover=document.createElement('img');cover.className='nativeListeningCover';artwork(cover,audio.dataset.cover);
 const caption=document.createElement('p');caption.className='listeningEyebrow';caption.textContent='AHORA ESCUCHANDO';
 const controls=document.createElement('div');controls.className='nativeListeningControls';
 const play=button('Reproducir audio','▶'),back=button('Retroceder 10 segundos','−10'),forward=button('Adelantar 10 segundos','+10');
 play.classList.add('listeningPlay');
 const seek=document.createElement('input');seek.type='range';seek.min=0;seek.max=100;seek.value=0;seek.step=.1;seek.setAttribute('aria-label','Posición del audio');seek.disabled=true;
 const time=document.createElement('span');time.className='listeningTime';time.textContent='0:00';
 const status=document.createElement('p');status.className='listeningStatus';status.setAttribute('role','status');
 const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=1;volume.step=.05;volume.value=audio.volume;volume.setAttribute('aria-label','Volumen del audio');volume.className='listeningVolume';
 const format=n=>{if(!Number.isFinite(n))return 'En vivo';n=Math.max(0,Math.floor(n));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
 function sync(){
  const playing=!audio.paused&&!audio.ended&&!audio.error,finite=Number.isFinite(audio.duration)&&audio.duration>0;
  play.textContent=playing?'❚❚':'▶';play.setAttribute('aria-label',playing?'Pausar audio':'Reproducir audio');play.setAttribute('aria-pressed',String(playing));
  seek.disabled=back.disabled=forward.disabled=!finite;
  if(finite){seek.max=audio.duration;seek.value=audio.currentTime;seek.setAttribute('aria-valuetext',format(audio.currentTime)+' de '+format(audio.duration))}
  time.textContent=format(audio.currentTime)+(finite?' / '+format(audio.duration):'');
 }
 play.onclick=()=>{if(!audio.paused&&!audio.error){audio.pause();return}status.textContent='';audio.play().catch(()=>{status.textContent='No pudimos iniciar el audio. Tocá reproducir para reintentar.';sync()})};
 const move=n=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Math.max(0,Math.min(audio.duration,n))};
 back.onclick=()=>move(audio.currentTime-10);forward.onclick=()=>move(audio.currentTime+10);seek.oninput=()=>move(Number(seek.value));
 volume.oninput=()=>{audio.volume=Number(volume.value);audio.muted=false};
 for(const event of ['play','pause','ended','loadedmetadata','durationchange','timeupdate'])audio.addEventListener(event,sync);
 audio.addEventListener('error',()=>{status.textContent='La fuente de audio no está disponible. Podés cerrar el reproductor y volver a intentarlo.';sync()});
 controls.append(back,play,forward);ui.append(caption,cover,controls,seek,time,volume,status);
 stage.insertBefore(ui,audio);audio.controls=false;sync();
}
function enhance(){
 const audio=stage.querySelector('audio');if(audio)enhanceAudio(audio);
 const video=stage.querySelector('video');
 if(video&&!video.dataset.listeningReady){
  video.dataset.listeningReady='true';video.setAttribute('aria-label','Reproductor de video');
  video.playsInline=true;
 }
 $('mediaDock').classList.toggle('listeningAudio',!!audio);
}
new MutationObserver(enhance).observe(stage,{childList:true});enhance();
})();