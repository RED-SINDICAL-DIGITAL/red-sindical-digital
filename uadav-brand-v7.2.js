(function(){
  const apply=()=>{document.querySelectorAll('[data-uadav-brand],.uadav-brand-name').forEach(el=>{el.textContent='UADAV STREAM'});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
