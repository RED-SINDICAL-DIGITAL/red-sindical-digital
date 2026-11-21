(async function () {
  'use strict';
  const base = window.PLATFORM_API_BASE || window.UADAV_API_BASE;
  if (!base) return;
  async function read(key) {
    const response = await fetch(base + key, {cache: 'no-store'});
    if (!response.ok) return {};
    const value = await response.json();
    return value.data || value;
  }
  const portal = location.pathname.replace(/\.html$/, '') === '/para-artistas';
  function message(title, detail) {
    const main = document.createElement('main');
    main.style.cssText = 'max-width:45rem;margin:12vh auto;padding:24px;color:white;background:#101d2e;border-radius:16px;font:18px/1.5 system-ui';
    const heading = document.createElement('h1');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = detail;
    main.append(heading, description);
    document.body.replaceChildren(main);
  }
  const [status, pages] = await Promise.all([read('estado_sitio').catch(()=>({})), read('site_pages').catch(()=>({}))]);
  if (status.modo === 'mantenimiento') {
    message('En mantenimiento', status.mensaje || 'Volvé a visitarnos en un rato.');
    return;
  }
  const artist = pages['para-artistas'];
  if (artist?.enabled === false) {
    if (portal) {
      message('Para artistas', 'Esta sección está temporalmente desactivada.');
      return;
    }
    for (const link of document.querySelectorAll('[data-route="/para-artistas.html"],a[href*="para-artistas"],[data-landing-block="creators"],a[href="#creadores"]')) link.style.setProperty('display','none','important');
  } else if (portal && artist) {
    const heading = document.querySelector('.artist-portal-hero h1');
    const description = document.querySelector('.artist-portal-hero p');
    if (heading && artist.title) heading.textContent = artist.title;
    if (description && artist.description) description.textContent = artist.description;
    if (artist.browser_title) document.title = artist.browser_title;
  }
  if (status.aviso_visible === true && status.mensaje && window.parent === window) {
    const notice = document.createElement('aside');
    notice.setAttribute('role','status');
    const key = 'uadav-dismissed-public-notice';
    try { if (sessionStorage.getItem(key) === status.mensaje) return; } catch {}
    const label = document.createElement('span');
    label.textContent = status.mensaje;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Cerrar aviso');
    close.style.cssText = 'color:inherit;background:transparent;border:0;font-size:22px;cursor:pointer;padding:0 10px;min-height:32px';
    notice.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;flex:none;background:#15283b;color:#edf5ff;padding:2px 12px;font:500 14px/1.4 system-ui;overflow-wrap:anywhere';
    label.style.cssText = 'white-space:pre-line;max-height:24vh;overflow:auto';
    notice.append(label, close);
    const shell = document.getElementById('shell');
    const header = document.getElementById('top');
    (shell || document.body).prepend(notice);
    function positionHeader() {
      if (header && getComputedStyle(header).position === 'fixed') {
        header.style.translate = '0 ' + notice.offsetHeight + 'px';
      } else if (header) header.style.removeProperty('translate');
    }
    const observer = new ResizeObserver(positionHeader);
    observer.observe(notice);
    window.addEventListener('resize', positionHeader);
    positionHeader();
    close.onclick = () => {
      observer.disconnect();
      window.removeEventListener('resize', positionHeader);
      if (header) header.style.removeProperty('translate');
      notice.remove();
      try { sessionStorage.setItem(key, status.mensaje); } catch {}
    };
  }
})();
