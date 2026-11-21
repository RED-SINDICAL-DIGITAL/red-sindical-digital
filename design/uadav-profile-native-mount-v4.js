/* Mi Perfil native shell — lifecycle-safe mount. Preserves original interactive nodes and identity. */
(function(){
 'use strict';
 const VERSION='profile-native-mount-v4';
 function mount(){
   const body=document.body;
   const home=document.getElementById('profileNativeHome');
   const legacy=document.getElementById('profileLegacyViews');
   const target=document.getElementById('nativeHomeSections');
   if(!body||!home||!legacy||!target)return false;
   const section=new URLSearchParams(location.search).get('vista');
   const legacyHash=location.hash;
   const selected=body.dataset.profileView || (section==='cuenta'?'account':section||'home');
   if(selected!=='home'||['#profileSettings','#mi-artista','#mis-trabajos'].includes(legacyHash)){
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
   // Notices are optional: email, radio or notice modules may be disabled at runtime.
   if(!hero||!actions||!recent){
     body.dataset.profileMount='missing-required-content';
     return false;
   }
   const notices=document.getElementById('accountNotices');
   for(const element of [hero,actions,recent,notices].filter(Boolean))target.appendChild(element);
   home.hidden=false;
   legacy.hidden=true;
   body.classList.add('profile-native-mounted');
   body.dataset.profileMount=VERSION;
   document.title='Mi espacio · UADAV STREAM';
   return true;
 }
 function ready(){
   if(mount())return;
   // If another script initializes required sections after document ready, retry on DOM mutations.
   if(typeof MutationObserver==='function'){
     const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
     observer.observe(document.body,{childList:true,subtree:true});
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
 window.addEventListener('pageshow',()=>{if(document.body?.dataset.profileView==='home')mount()});
})();
