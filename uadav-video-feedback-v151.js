(()=>{
'use strict';
function createFeedback({render,alive=()=>true,schedule=setTimeout,cancel=clearTimeout}){
 let timer=null,dead=false;
 const show=(text,retry=false)=>{if(!dead&&alive())render({text,retry})};
 const clear=()=>{if(timer!==null){cancel(timer);timer=null}};
 const wait=()=>{clear();timer=schedule(()=>{timer=null;show('La carga está tardando. Podés reintentar o abrir el video en YouTube.',true)},12000)};
 show('Preparando video…');wait();
 return{
  ready(){if(dead||!alive())return;clear();show('Tocá reproducir si el video no empieza.')},
  state(value){if(dead||!alive())return;clear();switch(Number(value)){
   case 1:show('Reproduciendo');break;
   case 2:show('En pausa');break;
   case 0:show('El video terminó.');break;
   case 3:show('Cargando video…');wait();break;
   case 5:show('Tocá reproducir para empezar.');break;
   default:show('Preparando video…');wait()
  }},
  blocked(){clear();show('Tocá reproducir en el video para empezar.')},
  error(code){clear();const n=Number(code);show(n===100?'Este video no está disponible. Podés consultar su fuente en YouTube.':[101,150].includes(n)?'Este video no permite reproducirse dentro de la app. Podés abrirlo en YouTube.':'No pudimos iniciar este video. Reintentá o abrilo en YouTube.',![100,101,150].includes(n))},
  dispose(){dead=true;clear()}
 };
}
window.UADAVVideoFeedback={createFeedback};
const stage=document.getElementById('mediaStage'),tools=document.getElementById('libraryTools');if(!stage||!tools)return;
let active=null,serial=0,apiPromise=null;
function api(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady,script=document.createElement('script');
  const timer=setTimeout(()=>{apiPromise=null;reject(Error('YouTube API timeout'))},12000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);try{previous?.()}finally{resolve(window.YT)}};
  script.src='https://www.youtube.com/iframe_api';
  script.onerror=()=>{clearTimeout(timer);apiPromise=null;script.remove();reject(Error('YouTube API unavailable'))};
  document.head.appendChild(script);
 });return apiPromise;
}
function attach(){
 const frame=stage.querySelector('iframe[data-uadav-video]');
 if(active?.frame===frame)return;
 if(active){active.dead=true;active.feedback.dispose();active.panel.remove();try{active.player?.destroy()}catch{}}
 active=null;if(!frame)return;
 const current={frame,dead:false,player:null,panel:document.createElement('section'),feedback:null};active=current;
 const alive=()=>active===current&&!current.dead&&frame.isConnected;
 const text=document.createElement('p'),retry=document.createElement('button');text.setAttribute('role','status');text.setAttribute('aria-live','polite');text.style.cssText='margin:8px 0;color:#aab5c5;font-size:13px';retry.type='button';retry.className='libBtn';retry.textContent='Reintentar video';retry.hidden=true;
 current.panel.id='videoFeedback';current.panel.append(text,retry);tools.after(current.panel);
 current.feedback=createFeedback({alive,render:state=>{text.textContent=state.text;retry.hidden=!state.retry}});
 retry.onclick=()=>{if(!alive())return;retry.disabled=true;const replacement=frame.cloneNode(false);frame.replaceWith(replacement);attach()};
 frame.id='uadav-single-video-'+(++serial);
 api().then(YT=>{if(!alive())return;current.player=new YT.Player(frame,{events:{
  onReady:()=>{if(alive())current.feedback.ready()},
  onStateChange:e=>{if(alive())current.feedback.state(e.data)},
  onError:e=>{if(alive())current.feedback.error(e.data)},
  onAutoplayBlocked:()=>{if(alive())current.feedback.blocked()}
 }})}).catch(()=>{if(alive())current.feedback.error(0)});
}
new MutationObserver(attach).observe(stage,{childList:true});attach();
})();
