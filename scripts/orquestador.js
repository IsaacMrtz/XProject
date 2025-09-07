// public/js/orquestador.js
import { initEmotions } from '/resources/jsFace-Api/emocioness.js';
import { initAttention } from '/resources/mediapipe/postt.js';
import { iniciarReconocimiento } from '/resources/sentiment/analysis.js';

window.addEventListener('DOMContentLoaded', async () => {
  // 1) Referencias DOM
  const videoEl      = document.getElementById('video');
  const titleEl      = document.getElementById('itemTitle');
  const textEl       = document.getElementById('itemText');
  const completedEl  = document.getElementById('completed');
  const btnSpeak     = document.getElementById('btnSpeak');
  const btnNext      = document.getElementById('btnNext');
  const transcriptionEl = document.getElementById('transcription');
  // 2) Carga de JSON
  const data = await fetch('/data/contenidos.json').then(r => r.json());
  const lecturas = data.primer.lecturas;
  const juegos   = data.primer.juegos;

  // 3) Índices y modo actual
  let lectureIndex = 0;
  let gameIndex    = 0;
  let currentMode  = 'lectura'; // 'lectura' o 'juego'

  // 4) Funciones de renderizado
  function showLecture(i) {
    const item = lecturas[i];
    titleEl.innerText = item.titulo;
    textEl.innerText  = item.texto;
    completedEl.style.display = 'none';
    btnNext.style.display    = 'none';
  }

  function showGame(i) {
    const item = juegos[i];
    titleEl.innerText = item.titulo;
    textEl.innerText  = ''; // en tu juego pintarás canvas
    completedEl.style.display = 'none';
    btnNext.style.display    = 'none';
    // aquí podrías inicializar tu mini-juego
  }

  function adaptTo(mode) {
    currentMode = mode;
    if (mode === 'juego') showGame(gameIndex);
    else                 showLecture(lectureIndex);
  }

  // 5) Historial y histeresis (sensor-driven)
  const history = { emotion: [], attention: [] };
  function pushReading(type, value) {
    const now = Date.now();
    history[type].push({ value, ts: now });
    history[type] = history[type].filter(r => now - r.ts <= 5000);
  }
  function countRecent(type, val) {
    return history[type].filter(r => r.value === val).length;
  }
  function evaluateMode() {
    const totalEmo = history.emotion.length || 1;
    const sadPct   = countRecent('emotion', 'sad') / totalEmo;
    const totalAtt = history.attention.length || 1;
    const disPct   = countRecent('attention', 'distraído') / totalAtt;
    const worstPct = Math.max(sadPct, disPct);

    if (currentMode === 'lectura' && worstPct >= 0.6) {
      adaptTo('juego');
    } else if (currentMode === 'juego' && worstPct <= 0.4) {
      adaptTo('lectura');
    }
  }

  // 6) Sensores emitiendo lectura
  window.addEventListener('emotionDetected',   e => { pushReading('emotion', e.detail);   evaluateMode(); });
  window.addEventListener('attentionDetected', e => { pushReading('attention', e.detail); evaluateMode(); });

  window.addEventListener('speechResult', e => {
  transcriptionEl.innerText = e.detail;
  });
  window.addEventListener('readingComplete', () => {
  completedEl.style.display = 'block';
  btnNext.style.display     = 'inline-block';
  });
  await initEmotions(videoEl);
  initAttention(videoEl);

  // 7) Control de lectura por voz
  btnSpeak.addEventListener('click', () => {
    // dispara el reconocimiento
    window.dispatchEvent(new Event('startSpeech'));
  });

  window.addEventListener('startSpeech', () => {
    iniciarReconocimiento();
  });

  // 8) Cuando termine la comparación: muestra “Completado”
  window.addEventListener('readingComplete', () => {
    completedEl.style.display = 'block';
    btnNext.style.display     = 'inline-block';
  });

  // 9) Siguiente ítem
  btnNext.addEventListener('click', () => {
    completedEl.style.display = 'none';
    btnNext.style.display     = 'none';

    if (currentMode === 'lectura') {
      lectureIndex = (lectureIndex + 1) % lecturas.length;
    } else {
      gameIndex = (gameIndex + 1) % juegos.length;
    }
    adaptTo(currentMode);
  });

  // 10) Carga inicial
  adaptTo(currentMode);
});
