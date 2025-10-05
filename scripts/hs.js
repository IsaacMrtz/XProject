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

document.addEventListener('DOMContentLoaded', () => {
  const ejercicios = [...window.appData.nivel2.ejercicios];
  if (!ejercicios.length) return console.error('No hay ejercicios.');

  shuffleArray(ejercicios);

  window.silabasStats = window.silabasStats || {
    inicio: window.appStats.inicio || Date.now(),
    correctas: window.appStats.correctas || [],
    errores: window.appStats.errores   || [],
    dominadas: window.appStats.dominadas || []
  };

  let idxActual = 0;
  renderEjercicio();

  function renderEjercicio() {
    const ej = ejercicios[idxActual];
    const cont = document.getElementById('ejercicio-interactivo');
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

    document.dispatchEvent(new Event('silabaAnswer'));

    idxActual++;
    if (idxActual < ejercicios.length) {
      renderEjercicio();
    } else {
      document.getElementById('ejercicio-interactivo')
        .innerHTML = '<h3>¡Has completado todos los ejercicios!</h3>';
    }
  }

  // ── Selección de sonido ──────────────────────────────────────────────
  function renderSeleccionSonido(ej, cont) {
    let intentos = 0;
    cont.innerHTML = `
      <section class="seleccion-sonido">
        <p>${ej.descripcion}</p>
        <button id="btn-play">🔊 Escuchar</button>
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
      const src = window.audioFallbacks?.[sil];
      if (src) new Audio(src).play();
      else     speak(sil);
    });

    cont.querySelectorAll('.btn-opcion').forEach(btn => {
      btn.addEventListener('click', e => {
        const val = e.target.dataset.valor;
        const ok  = val === ej.respuesta_correcta;
        intentos++;

        if (ok) {
          const msg = '¡Correcto!';
          cont.querySelector('.feedback').textContent = msg;
          speak(msg);
          disableButtons();
          avanzar(ej.id, true);

        } else if (intentos < MAX_INTENTOS) {
          cont.querySelector('.feedback').textContent = ej.feedback_incorrecto;
          speak(ej.feedback_incorrecto);

        } else {
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
    function updateFormado() {
    formado = Array.from(drop.querySelectorAll('.dropped-silaba'))
        .map(el => el.dataset.silaba);
    }   

    
    cont.querySelectorAll('.draggable').forEach(d => {
      d.addEventListener('dragstart', e =>
        e.dataTransfer.setData('text/plain', d.dataset.silaba)
      );
    });
    drop.addEventListener('dragover', e => e.preventDefault());
    drop.addEventListener('drop', e => {
      e.preventDefault();
      const sil = e.dataTransfer.getData('text/plain');
      if (sil) {
        formado.push(sil);
        const span = document.createElement('span');
        span.classList.add('dropped-silaba');
        span.textContent = sil;
        drop.appendChild(span);
        span.innerHTML = `
        <span class="silaba-text">${sil}</span>
        <button type="button" class="remove-silaba" aria-label="Eliminar sílaba">&times;</button>
    `;

        const ph = drop.querySelector('p');
        if (ph) ph.remove();
      }
       updateFormado();
    });
    // Delegación de evento para el botón de eliminar
    drop.addEventListener('click', e => {
    if (!e.target.matches('.remove-silaba')) return;
    const span = e.target.closest('.dropped-silaba');
    if (span) {
        span.remove();
        updateFormado();
    }
    });

    

    cont.querySelector('#btn-check').addEventListener('click', () => {
      intentos++;
      const palabra = formado.join('');
      const ok = palabra === ej.respuesta_correcta;

      if (ok) {
        const msg = '¡Muy bien!';
        cont.querySelector('.feedback').textContent = msg;
        speak(msg);
        avanzar(ej.id, true);

      } else if (intentos < MAX_INTENTOS) {
        cont.querySelector('.feedback').textContent = ej.feedback_incorrecto;
        speak(ej.feedback_incorrecto);

      } else {
        const msg = ej.feedback_final || 'Tranquilo, será la próxima.';
        cont.querySelector('.feedback').textContent = msg;
        speak(msg);
        avanzar(ej.id, false);
      }
    });
  }
});
