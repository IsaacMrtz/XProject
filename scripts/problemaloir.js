// public/scripts/orquestadorEjercicios.js
const MAX_INTENTOS = 3;

// Helper para síntesis de voz
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

// Baraja array in-place
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// No toques esto, lo necesitas para selection_sonido
const audioFallbacks = {
  co: '/resources/media/co.ogg',
  cu: '/resources/media/cu.ogg',
  ma: '/resources/media/ma.ogg',
  no: '/resources/media/no.ogg',
  to: '/resources/media/to.ogg',
  za: '/resources/media/za.ogg'
  // …añade todas tus sílabas
};

document.addEventListener('DOMContentLoaded', () => {
  const ejercicios = [...window.appData.nivel2.ejercicios];
  if (!ejercicios.length) return console.error('No hay ejercicios.');

  shuffleArray(ejercicios);

  // Inicializa o extiende silabasStats con breakdown
  window.silabasStats = window.silabasStats || {
    inicio: window.appStats.inicio || Date.now(),
    correctas: window.appStats.correctas || [],
    errores:   window.appStats.errores   || [],
    dominadas: window.appStats.dominadas || [],
    breakdown: {
      syllables: { correct: 0, incorrect: 0 },
      words:     { correct: 0, incorrect: 0 }
    }
  };

  // Actualiza el aside de estadísticas si existe en el DOM
  updateStatsAside();

  let idxActual = 0;
  renderEjercicio();

  function renderEjercicio() {
    const ej = ejercicios[idxActual];
    const cont = document.getElementById('ejercicio-contenido');
    cont.innerHTML = '';
    cont.classList.remove('hidden');

    if (ej.tipo === 'seleccion_sonido') {
      renderSeleccionSonido(ej, cont);
    } else if (ej.tipo === 'formar_palabra') {
      renderFormarPalabra(ej, cont);
    } else {
      cont.textContent = 'Tipo de ejercicio desconocido.';
    }
  }

  function avanzar(id, correcto) {
    if (correcto) window.silabasStats.correctas.push(id);
    else          window.silabasStats.errores.push(id);

    // repinta el aside tras cada avance
    updateStatsAside();
    renderProgressCards();       // repinta solo las stats
    document.dispatchEvent(new Event('silabaAnswer'));

    idxActual++;
    if (idxActual < ejercicios.length) {
      renderEjercicio();
    } else {
      document.getElementById('ejercicio-interactivo')
        .innerHTML = '<h3>¡Muy bien, has terminado!</h3>';
    }
  }

  // ── Selección de sonido ──────────────────────────────────────────────
  function renderSeleccionSonido(ej, cont) {
    let intentos = 0;
    cont.innerHTML = `
      <section class="seleccion-sonido">
        <p>${ej.descripcion}</p>
        <button id="btn-play">🔊 Escuchar</button><br>
        <div class="opciones-sel">
          ${ej.opciones.map(o =>
            `<button class="btn-opcion" data-valor="${o}">${o}</button>`
          ).join('')}
        </div>
        <div class="feedback"></div>
      </section>
    `;

    cont.querySelector('#btn-play').addEventListener('click', () => {
      const sil = ej.respuesta_correcta;
      const src = audioFallbacks[sil];
      if (src) new Audio(src).play();
      else     speak(sil);
    });

    cont.querySelectorAll('.btn-opcion').forEach(btn => {
      btn.addEventListener('click', e => {
        const val = e.target.dataset.valor;
        const ok  = val === ej.respuesta_correcta;
        intentos++;

        if (ok) {
          // acierto: incremento breakdown de sílabas correctas
          window.silabasStats.breakdown.syllables.correct++;
          const msg = '¡Correcto!';
          cont.querySelector('.feedback').textContent = msg;
          speak(msg);
          disableButtons();
          avanzar(ej.id, true);

        } else if (intentos < MAX_INTENTOS) {
          cont.querySelector('.feedback').textContent = ej.feedback_incorrecto;
          speak(ej.feedback_incorrecto);

        } else {
          // error final: incremento breakdown de sílabas erróneas
          window.silabasStats.breakdown.syllables.incorrect++;
          const msg = ej.feedback_final || 'Tranquilo, será la próxima.';
          cont.querySelector('.feedback').textContent = msg;
          speak(msg);
          disableButtons();
          avanzar(ej.id, false);
        }
      });
    });

    function disableButtons() {
      cont.querySelectorAll('.btn-opcion')
        .forEach(b => b.disabled = true);
    }
  }

  // ── Formar palabra (drag & drop) ────────────────────────────────────
  function renderFormarPalabra(ej, cont) {
    let intentos = 0;
    let formado = [];

    cont.innerHTML = `
      <section class="formar-palabra">
        <p>${ej.descripcion}</p>
        <div class="silabas-opciones">
          ${ej.opciones.map(s =>
            `<div class="draggable" draggable="true" data-silaba="${s}">${s}</div>`
          ).join('')}
        </div>
        <div class="dropzone"><p>Arrastra aquí</p></div>
        <button id="btn-check">Comprobar</button>
        <div class="feedback"></div>
      </section>
    `;

    const drop = cont.querySelector('.dropzone');

    // Reconstruye 'formado' a partir del DOM
    function updateFormado() {
      formado = Array.from(drop.querySelectorAll('.dropped-silaba'))
        .map(el => el.dataset.silaba);
    }

    // dragstart
    cont.querySelectorAll('.draggable').forEach(d => {
      d.addEventListener('dragstart', e =>
        e.dataTransfer.setData('text/plain', d.dataset.silaba)
      );
    });

    // drop + creación de span con botón de eliminar
    drop.addEventListener('dragover', e => e.preventDefault());
    drop.addEventListener('drop', e => {
      e.preventDefault();
      const sil = e.dataTransfer.getData('text/plain');
      if (!sil) return;

      const span = document.createElement('span');
      span.classList.add('dropped-silaba');
      span.dataset.silaba = sil;
      span.innerHTML = `
        <span class="silaba-text">${sil}</span>
        <button type="button" class="remove-silaba" aria-label="Eliminar sílaba">&times;</button>
      `;
      drop.appendChild(span);
      drop.querySelector('p')?.remove();
      updateFormado();
    });

    // delegación para eliminar sílaba
    drop.addEventListener('click', e => {
      if (!e.target.matches('.remove-silaba')) return;
      e.target.closest('.dropped-silaba').remove();
      updateFormado();
    });

    // comprobar palabra
    cont.querySelector('#btn-check').addEventListener('click', () => {
      intentos++;
      const ok = formado.join('') === ej.respuesta_correcta;

      if (ok) {
        // acierto: breakdown de palabras correctas
        window.silabasStats.breakdown.words.correct++;
        const msg = '¡Muy bien!';
        cont.querySelector('.feedback').textContent = msg;
        speak(msg);
        avanzar(ej.id, true);

      } else if (intentos < MAX_INTENTOS) {
        cont.querySelector('.feedback').textContent = ej.feedback_incorrecto;
        speak(ej.feedback_incorrecto);

      } else {
        // error final: breakdown de palabras erróneas
        window.silabasStats.breakdown.words.incorrect++;
        const msg = ej.feedback_final || 'Tranquilo, será la próxima.';
        cont.querySelector('.feedback').textContent = msg;
        speak(msg);
        avanzar(ej.id, false);
      }
    });
  }

  // ── Actualiza el DOM del aside de estadísticas ───────────────────────
  function updateStatsAside() {
    const b = window.silabasStats.breakdown;
    const el1 = document.getElementById('count-syllables-correct');
    const el2 = document.getElementById('count-syllables-incorrect');
    const el3 = document.getElementById('count-words-correct');
    const el4 = document.getElementById('count-words-incorrect');
    if (el1) el1.textContent = b.syllables.correct;
    if (el2) el2.textContent = b.syllables.incorrect;
    if (el3) el3.textContent = b.words.correct;
    if (el4) el4.textContent = b.words.incorrect;

  }
function renderProgressCards() {
    const container = document.getElementById('progress-cards');
    if (!container) return;
    const b = window.silabasStats.breakdown;
    container.innerHTML = `
      <div class="progress-card">
        <h4>Sílabas correctas</h4><span>${b.syllables.correct}</span>
      </div>
      <div class="progress-card">
        <h4>Sílabas erróneas</h4><span>${b.syllables.incorrect}</span>
      </div>
      <div class="progress-card">
        <h4>Palabras correctas</h4><span>${b.words.correct}</span>
      </div>
      <div class="progress-card">
        <h4>Palabras erróneas</h4><span>${b.words.incorrect}</span>
      </div>
    `;
  }

});
