(() => {
  let checking = false;
  async function check() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const response = await fetch('/demo/estado', {cache:'no-store'});
      if (response.status===503) location.reload();
    } catch {} finally { checking = false; }
  }
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
  setInterval(check, 15000);
})();
