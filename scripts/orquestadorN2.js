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

// Inicializa el objeto que enviaremos al servidor
window.silabasStats = {
  correctas: [],
  errores: [],
  dominadas: [],
  inicio: new Date().toISOString()
};

// FUNCIÓN AUXILIAR: Solo registra datos, NO avanza ejercicio
window.registrarRespuesta = function(ejId, isCorrect, intentoSilaba = null) {
  if (isCorrect) {
    window.silabasStats.correctas.push(
      intentoSilaba != null
        ? { id: ejId, intento: intentoSilaba }
        : ejId
    );
  } else {
    window.silabasStats.errores.push(
      intentoSilaba != null
        ? { id: ejId, intento: intentoSilaba }
        : ejId
    );
  }
  window.silabasStats.ultAvance = new Date().toISOString();
};

document.addEventListener('DOMContentLoaded', () => {
  const ejercicios = [...window.appData.nivel2.ejercicios];
  if (!ejercicios.length) return console.error('No hay ejercicios.');

  shuffleArray(ejercicios);

  // Sincronizar con stats existentes si las hay
  if (window.appStats) {
    window.silabasStats.inicio = window.appStats.inicio || window.silabasStats.inicio;
    window.silabasStats.correctas = window.appStats.correctas || window.silabasStats.correctas;
    window.silabasStats.errores = window.appStats.errores || window.silabasStats.errores;
    window.silabasStats.dominadas = window.appStats.dominadas || window.silabasStats.dominadas;
  }

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

  // FUNCIÓN LOCAL que maneja el avance de ejercicios
  function avanzar(id, correcto, intentoSilaba = null) {
    // Registra la respuesta en las estadísticas
    window.registrarRespuesta(id, correcto, intentoSilaba);
    
    // Dispara evento para notificar al sistema
    document.dispatchEvent(new Event('silabaAnswer'));

    // Avanza al siguiente ejercicio
    idxActual++;
    if (idxActual < ejercicios.length) {
      renderEjercicio();
    } else {
      document.getElementById('ejercicio-interactivo')
        .innerHTML = '<h3>¡Muy bien, has avanzado mucho!</h3>';
    }
  }

  // ── Selección de sonido ──────────────────────────────────────────────
  function renderSeleccionSonido(ej, cont) {
    let intentos = 0;
    cont.innerHTML = `
      <section class="seleccion-sonido">
        <p>${ej.descripcion}</p>
        
        <button id="btn-play">🔊 Escuchar</button>
        <br>
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
    
    // Reconstruye 'formado' a partir del DOM
    function updateFormado() {
      formado = Array.from(drop.querySelectorAll('.dropped-silaba'))
        .map(el => el.dataset.silaba);
    }
    
    // Habilita drag
    cont.querySelectorAll('.draggable').forEach(d => {
      d.addEventListener('dragstart', e =>
        e.dataTransfer.setData('text/plain', d.dataset.silaba)
      );
    });
    
    // Drop + creación de span con botón de eliminar
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
      const ph = drop.querySelector('p');
      if (ph) ph.remove();
      updateFormado();
    });
    
    // Delegación para eliminar sílaba al clicar la X
    drop.addEventListener('click', e => {
      if (!e.target.matches('.remove-silaba')) return;
      const span = e.target.closest('.dropped-silaba');
      if (span) {
        span.remove();
        updateFormado();
      }
    });
    
    // Comprobar respuesta
    cont.querySelector('#btn-check').addEventListener('click', () => {
      intentos++;
      
      updateFormado();
      const palabra = formado.join('');
      const ok = palabra === ej.respuesta_correcta;
      
      if (ok) {
        // ✅ RESPUESTA CORRECTA
        const msg = ej.feedback_correcto || '¡Muy bien!';
        cont.querySelector('.feedback').textContent = msg;
        speak(msg);
        
        // Registra y avanza al siguiente ejercicio
        avanzar(ej.id, true, palabra);
        
      } else if (intentos < MAX_INTENTOS) {
        // ⚠️ INTENTO FALLIDO (aún hay intentos disponibles)
        cont.querySelector('.feedback').textContent = ej.feedback_incorrecto;
        speak(ej.feedback_incorrecto);
        
        // SOLO registra el error, NO avanza (permite más intentos)
        window.registrarRespuesta(ej.id, false, palabra);
        
      } else {
        // ❌ AGOTÓ LOS 3 INTENTOS
        const msg = ej.feedback_final || 'Tranquilo, será la próxima.';
        cont.querySelector('.feedback').textContent = msg;
        speak(msg);
        
        // Registra como error final y avanza al siguiente ejercicio
        avanzar(ej.id, false, palabra);
        console.log('📊 silabasStats.errores:', window.silabasStats.errores);
      }
    });
  }
});