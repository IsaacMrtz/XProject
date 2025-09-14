export function renderStats(stats) {
  const get = id => document.getElementById(id);
  if (!get('lecturas-leidas')) return;  // si no existe sidebar, salimos

  get('lecturas-leidas').innerText   = stats.lecturasLeidas;
  get('total-lecturas').innerText    = stats.totalLecturas;
  get('lecturas-bar').style.width    = 
    stats.totalLecturas
      ? (stats.lecturasLeidas / stats.totalLecturas) * 100 + '%'
      : '0%';
  get('juegos-jugados').innerText    = stats.juegosJugados;
  get('nivel-actual').innerText      = stats.nivelActual;
  get('desafios-activos').innerText  = stats.desafiosActivos;
}

// Llamada inicial
window.addEventListener('DOMContentLoaded', () => {
  if (window.appStats) renderStats(window.appStats);
});
