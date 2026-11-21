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
    notice.textContent = status.mensaje;
    notice.style.cssText = 'position:relative;z-index:10;flex:none;background:#ffe38d;color:#192332;text-align:center;padding:8px 16px;font:600 15px/1.4 system-ui;overflow-wrap:anywhere';
    notice.style.whiteSpace = 'pre-line';
    notice.style.maxHeight = '30vh';
    notice.style.overflowY = 'auto';
    const viewport = document.getElementById('viewWrap');
    const frame = document.getElementById('view');
    if (viewport && frame?.parentElement === viewport) {
      viewport.style.display = 'flex';
      viewport.style.flexDirection = 'column';
      frame.style.flex = '1 1 0%';
      frame.style.minHeight = '0';
      frame.style.height = 'auto';
      viewport.prepend(notice);
    } else {
      document.body.prepend(notice);
    }
  }
})();
