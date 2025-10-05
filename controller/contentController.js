// public/js/controllers/contentController.js

// controllers/layoutController.js
export function layout(req, res) {
  res.render('layout');
}


export async function cargarContenido(grado, tipo, id) {
  let data;
  try {
    const res = await fetch('/data/contenidos.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Error cargando contenidos.json:', err);
    return;
  }

  const item = data[grado]?.[tipo]?.find(e => e.id === id);
  if (!item) return;

  const contentDiv = document.getElementById('content');
  if (item.tipo === 'lectura') {
    contentDiv.innerHTML = `
      <h2>${item.titulo}</h2>
      <p>${item.texto}</p>
    `;
  } else if (item.tipo === 'minijuego') {
    contentDiv.innerHTML = `
      <h2>${item.titulo}</h2>
      <canvas id="gameCanvas"></canvas>
    `;
    // Asegúrate que iniciarJuego esté disponible globalmente o lo importes aquí
    if (typeof iniciarJuego === 'function') iniciarJuego(item.id);
  }
}
