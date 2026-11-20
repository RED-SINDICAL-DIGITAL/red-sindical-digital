(() => {
  let checking = false;
  async function check() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const response = await fetch('/demo/estado', {cache:'no-store'});
      if ([403,503].includes(response.status)) location.replace('/invitacion.html?estado=espera');
    } catch {} finally { checking = false; }
  }
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
  setInterval(check, 15000);
})();
