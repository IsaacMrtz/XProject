(function() {
  function guardar(evt) {
    console.log('💾 guardar() invocado por:', evt.type);
    if (!window.silabasStats) return;

    const payload = {
      userId:   window.appStats.userId,
      stats:    window.silabasStats,
      inicio:   window.silabasStats.inicio
    };
    console.log('💾 payload a enviar:', payload);

    fetch('/actividad2/progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(payload)
    })
    .then(res => console.log('💾 fetch status:', res.status))
    .catch(err => console.error('❌ fetch error:', err));
  }

  window.addEventListener('beforeunload', guardar);
  document.addEventListener('silabaAnswer', guardar);
})();
      