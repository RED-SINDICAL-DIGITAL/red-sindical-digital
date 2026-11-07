/* Mi Perfil native shell — restore original interactive DOM when leaving Home. */
(function(){
 'use strict';
 const VERSION='profile-native-mount-v5';
 const origins=new Map();
 const legacyHashes=['#profileSettings','#mi-artista','#mis-trabajos'];
 function mount(){
   const body=document.body;
   const home=document.getElementById('profileNativeHome');
   const legacy=document.getElementById('profileLegacyViews');
   const target=document.getElementById('nativeHomeSections');
   if(!body||!home||!legacy||!target)return false;
   const section=new URLSearchParams(location.search).get('vista');
   const hashView=legacyHashes.includes(location.hash);
   const selected=hashView?({'#profileSettings':'account','#mi-artista':'artista','#mis-trabajos':'trabajos'}[location.hash]):(section==='cuenta'?'account':['account','artista','trabajos'].includes(section)?section:'home');
   body.dataset.profileView=selected;
   if(selected!=='home'||hashView){
     // Keep originals accessible after a History/fragment navigation without cloning nodes.
     for(const [node,place] of origins){
       if(!place.parent)continue;
       if(place.next&&place.next.parentNode===place.parent)place.parent.insertBefore(node,place.next);
       else place.parent.appendChild(node);
     }
     origins.clear();
     body.classList.remove('profile-native-mounted');
     home.hidden=true;
     legacy.hidden=false;
     return true;
   }
   if(body.classList.contains('profile-native-mounted')){
     home.hidden=false;legacy.hidden=true;return true;
   }
   const hero=legacy.querySelector('.hero');
   const actions=document.getElementById('profileTasks');
   const recent=legacy.querySelector('.profile-continue');
   if(!hero||!actions||!recent){
     body.dataset.profileMount='missing-required-content';
     home.hidden=true;
     legacy.hidden=false;
     return false;
   }
   const notices=document.getElementById('accountNotices');
   for(const element of [hero,actions,recent,notices].filter(Boolean)){
     origins.set(element,{parent:element.parentNode,next:element.nextSibling});
     target.appendChild(element);
   }
   home.hidden=false;
   legacy.hidden=true;
   body.classList.add('profile-native-mounted');
   body.dataset.profileMount=VERSION;
   document.title='Mi espacio · UADAV STREAM';
   return true;
 }
 function ready(){
   if(mount())return;
   if(typeof MutationObserver==='function'){
     const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
     observer.observe(document.body,{childList:true,subtree:true});
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
 window.addEventListener('pageshow',mount);
 window.addEventListener('hashchange',mount);
 window.addEventListener('popstate',mount);
})();
