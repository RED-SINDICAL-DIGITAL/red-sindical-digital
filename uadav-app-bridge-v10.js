(()=>{
  'use strict';
  if(window.top===window.self)return;
  const sameOrigin=(url)=>{
    try{return new URL(url,location.href).origin===location.origin}catch{return false}
  };
  const normalizeHref=(href)=>{
    const u=new URL(href,location.href);
    if(u.origin!==location.origin)return '';
    return u.pathname+u.search+u.hash;
  };
  function host(){
    try{return window.parent.UADAVShellHost||window.parent.UADAV_APP||null}catch{return null}
  }
  function navigate(href,opts={}){
    const h=host(),to=normalizeHref(href);
    if(!to)return false;
    if(h?.navigate){h.navigate(to,opts);return true}
    try{window.parent.postMessage({type:'uadav:navigate',href:to,replace:!!opts.replace},location.origin);return true}catch{return false}
  }
  function playContent(item){
    const h=host();
    if(h?.playContent)return h.playContent(item);
    try{window.parent.postMessage({type:'uadav:content-play',item},location.origin);return true}catch{return false}
  }
  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    const href=a.getAttribute('href')||'';
    if(!href||href.startsWith('#')||href.startsWith('javascript:')||href.startsWith('mailto:')||href.startsWith('tel:'))return;
    if(!sameOrigin(href))return;
    if(navigate(href)){e.preventDefault();e.stopPropagation()}
  },true);
  window.UADAVAppBridge={navigate,playContent,host};
})();