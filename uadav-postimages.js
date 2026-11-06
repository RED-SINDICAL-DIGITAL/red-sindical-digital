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
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'btn';
    previewButton.textContent = id === 'cover' ? 'Ver banner' : 'Ver afiche';
    const preview = document.createElement('div');
    preview.hidden = true;
    preview.id = id + '-image-preview';
    preview.setAttribute('role', 'status');
    preview.setAttribute('aria-live', 'polite');
    previewButton.setAttribute('aria-controls', preview.id);
    help.insertAdjacentElement('afterend', previewButton);
    previewButton.insertAdjacentElement('afterend', preview);
    let generation = 0;
    function clearPreview() { generation++; preview.hidden = true; preview.replaceChildren(); }
    previewButton.addEventListener('click', function () {
      check();
      if (!input.value.trim() || !input.checkValidity()) { input.reportValidity(); return; }
      clearPreview();
      const current = generation;
      preview.hidden = false;
      const message = document.createElement('p');
      message.className = 'small';
      message.textContent = 'Cargando vista previa…';
      const image = document.createElement('img');
      image.alt = id === 'cover' ? 'Vista previa del banner de Cartelera' : 'Vista previa del afiche';
      image.referrerPolicy = 'no-referrer';
      image.style.cssText = 'display:block;max-width:100%;max-height:320px;object-fit:contain;margin-top:10px;border-radius:12px';
      image.hidden = true;
      image.onload = function () { if (current !== generation) return; image.hidden = false; message.textContent = 'Vista previa cargada. Confirmá que sea la imagen correcta.'; };
      image.onerror = function () { if (current !== generation) return; image.hidden = true; message.textContent = 'No pudimos mostrar la imagen. Revisá el enlace directo y que sea público. El alojamiento también puede impedir la vista previa.'; };
      preview.append(message, image);
      image.src = input.value.trim();
    });
    function check() {
      clearPreview();
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
