(function () {
  'use strict';
  if (window.parent !== window) return;

  const currentBuild = 12058;
  const dismissedKey = 'uadav_update_dismissed_build_v1';
  let checking = false;
  let shownBuild = 0;

  function dismissedBuild() {
    try {
      return Number(localStorage.getItem(dismissedKey)) || 0;
    } catch {
      return 0;
    }
  }

  function dismiss(build) {
    try { localStorage.setItem(dismissedKey, String(build)); } catch {}
  }

  function render(build, message) {
    if (shownBuild === build || !document.body) return;
    shownBuild = build;
    document.getElementById('uadav-update-notice')?.remove();

    const style = document.createElement('style');
    style.textContent = `
      #uadav-update-notice{position:fixed;z-index:100000;inset:auto max(16px,env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) auto;width:min(420px,calc(100vw - 32px));padding:18px;color:#f7f9ff;background:#111a2a;border:1px solid #394967;border-radius:18px;box-shadow:0 18px 56px #0009;font:500 15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
      #uadav-update-notice .uadav-update-title{display:block;margin:0 0 6px;font-size:17px;font-weight:750;letter-spacing:-.02em}
      #uadav-update-notice p{margin:0 0 14px;color:#b6c2d5}
      #uadav-update-notice .uadav-update-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:9px}
      #uadav-update-notice button{min-height:44px;padding:9px 16px;border:1px solid #53627a;border-radius:999px;background:#1a2538;color:#f7f9ff;font:650 14px system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}
      #uadav-update-notice button:focus-visible{outline:3px solid #8db2ff;outline-offset:2px}
      #uadav-update-notice button[data-primary]{border-color:#3974fa;background:#326cf2}
      @media(max-width:1024px){#uadav-update-notice{bottom:calc(76px + env(safe-area-inset-bottom))}}
      @media(max-width:560px){#uadav-update-notice{inset:auto 12px calc(76px + env(safe-area-inset-bottom));width:auto;padding:16px;border-radius:16px}#uadav-update-notice .uadav-update-actions{display:grid;grid-template-columns:1fr 1fr}#uadav-update-notice button{width:100%}}
      @media(min-width:1600px){#uadav-update-notice{width:460px;padding:22px;font-size:17px}}
    `;
    document.head.append(style);

    const box = document.createElement('aside');
    box.id = 'uadav-update-notice';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Actualización disponible');
    box.setAttribute('aria-live', 'polite');

    const title = document.createElement('strong');
    title.className = 'uadav-update-title';
    title.textContent = 'Nueva versión disponible';
    const text = document.createElement('p');
    text.textContent = message || 'Actualizá cuando te quede cómodo. Tus datos guardados se mantienen.';
    const actions = document.createElement('div');
    actions.className = 'uadav-update-actions';
    const update = document.createElement('button');
    update.type = 'button';
    update.textContent = 'Actualizar';
    update.dataset.primary = 'true';
    update.addEventListener('click', () => {
      try { localStorage.removeItem(dismissedKey); } catch {}
      location.reload();
    });
    const later = document.createElement('button');
    later.type = 'button';
    later.textContent = 'Más tarde';
    later.addEventListener('click', () => {
      dismiss(build);
      box.remove();
      shownBuild = 0;
    });
    actions.append(update, later);
    box.append(title, text, actions);
    document.body.append(box);
  }

  async function check() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const response = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const build = Number(data.build);
      if (!Number.isInteger(build) || build <= currentBuild || build <= dismissedBuild()) return;
      render(build, data.message);
    } catch {
      // Version checks are optional; the app remains usable while offline.
    } finally {
      checking = false;
    }
  }

  window.addEventListener('focus', check);
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', check);
  setInterval(check, 300000);
  check();
})();
