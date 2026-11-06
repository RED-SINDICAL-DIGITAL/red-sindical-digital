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
      const value = input.value.trim();
      if (!value) return;
      try {
        const url = new URL(value);
        if (['postimg.cc', 'www.postimg.cc', 'postimages.org', 'www.postimages.org'].includes(url.hostname)) {
          input.setCustomValidity('Copiá «Enlace directo» en Postimages: debe comenzar con https://i.postimg.cc/.');
          help.textContent = 'Este enlace abre una página. Volvé a Postimages y copiá «Enlace directo».';
        } else {
          help.textContent = 'Enlace de imagen listo. También podés usar otro alojamiento HTTPS.';
        }
      } catch (_) { /* Native URL validation handles malformed values. */ }
    }
    input.addEventListener('input', check);
    input.addEventListener('change', check);
  }
})();
