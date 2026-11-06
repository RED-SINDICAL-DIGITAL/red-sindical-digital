/* Postimages: user-initiated external hosting; no automatic uploads. */
(function () {
  'use strict';
  for (const id of ['poster', 'cover']) {
    const input = document.getElementById(id);
    if (!input) continue;
    const help = document.createElement('p');
    help.className = 'small';
    help.id = id + '-image-help';
    help.textContent = 'Usá el enlace directo de la imagen, no el enlace de la página de Postimages.';
    input.setAttribute('aria-describedby', help.id);
    input.insertAdjacentElement('afterend', help);
    function check() {
      input.setCustomValidity('');
      let value = input.value.trim();
      const embedded = value.match(/\[img\](https:\/\/i\.postimg\.cc\/[^\s\[\]<>]+)\[\/img\]/i);
      if (embedded) { value = embedded[1]; input.value = value; }
      if (!value) { help.textContent = 'Usá el enlace directo de la imagen, no el enlace de la página de Postimages.'; return; }
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) {
          input.setCustomValidity('Usá un enlace HTTPS de una imagen pública, sin datos de acceso.');
          help.textContent = 'El enlace debe empezar con https:// y no incluir usuario ni contraseña.';
        } else if (['postimg.cc', 'www.postimg.cc', 'postimages.org', 'www.postimages.org'].includes(url.hostname)) {
          input.setCustomValidity('Copiá «Enlace directo» en Postimages: debe comenzar con https://i.postimg.cc/.');
          help.textContent = 'Este enlace abre una página. Volvé a Postimages y copiá «Enlace directo».';
        } else {
          help.textContent = 'Formato de enlace aceptado. Comprobá que la imagen sea pública y abra correctamente.';
        }
      } catch (_) { /* Native URL validation handles malformed values. */ }
    }
    input.addEventListener('input', check);
    input.addEventListener('change', check);
  }
})();
