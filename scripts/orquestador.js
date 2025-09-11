// public/js/orquestador.js
import { initEmotions } from '/resources/jsFace-Api/emocioness.js';
import { initAttention } from '/resources/mediapipe/postt.js';
import { iniciarReconocimiento } from '/resources/sentiment/analysis.js';

window.addEventListener('DOMContentLoaded', async () => {
  // 1) Leer parámetros inyectados en layout.ejs
  //    Asegúrate de haber incluido en layout.ejs:
  //    <script>
  //      window.appParams = {
  //        grado: "<%= grado %>",
  //        id: "<%= id || '' %>"
  //      };
  //    </script>
  const { grado, id } = window.appParams || {};

  // 2) Referencias al DOM
  const videoEl         = document.getElementById('video');
  const titleEl         = document.getElementById('itemTitle');
  const textEl          = document.getElementById('itemText');
  const transcriptionEl = document.getElementById('transcription');
  const completedEl     = document.getElementById('completed');
  const btnSpeak        = document.getElementById('btnSpeak');
  const btnNext         = document.getElementById('btnNext');

  // 3) Carga de JSON y filtrado según `grado` y `id`
  const dataRaw = await fetch('/data/contenidos.json').then(r => r.json());
  let lecturas  = dataRaw[grado]?.lecturas   || [];
  const juegos  = dataRaw[grado]?.juegos     || [];

  if (id) {
    lecturas = lecturas.filter(l => l.id === id);
    if (lecturas.length === 0) {
      titleEl.innerText = 'Lectura no encontrada';
      return;
    }
  }

  // 4) Índices y modo actual
  let lectureIndex = 0;
  let gameIndex    = 0;
  let currentMode  = 'lectura';

  // 5) Preparar palabras para comparación
  let originalWords   = [];
  let matchedWordsSet = new Set();
  function prepareOriginalWords(text) {
    return text
      .toLowerCase()
      .replace(/[.,;!?¿¡]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  // 6) Funciones de renderizado
  function showLecture(i) {
    const { titulo, texto } = lecturas[i];
    titleEl.innerText        = titulo;
    textEl.innerText         = texto;
    originalWords            = prepareOriginalWords(texto);
    matchedWordsSet.clear();
    transcriptionEl.innerText = '';
    completedEl.style.display = 'none';
    btnNext.style.display     = 'none';
  }

  function showGame(i) {
    const { titulo } = juegos[i];
    titleEl.innerText        = titulo;
    textEl.innerText         = '';
    originalWords            = [];
    matchedWordsSet.clear();
    transcriptionEl.innerText = '';
    completedEl.style.display = 'none';
    btnNext.style.display     = 'none';
    // Aquí inicia tu mini-juego
  }

  function adaptTo(mode) {
    currentMode = mode;
    if (mode === 'juego') showGame(gameIndex);
    else                  showLecture(lectureIndex);
  }

  // 7) Lógica de emociones y atención
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
    const sadPct = countRecent('emotion','sad') / (history.emotion.length || 1);
    const disPct = countRecent('attention','distraído') / (history.attention.length || 1);
    const worst  = Math.max(sadPct, disPct);

    if (currentMode === 'lectura' && worst >= 0.6) adaptTo('juego');
    else if (currentMode === 'juego' && worst <= 0.4) adaptTo('lectura');
  }

  window.addEventListener('emotionDetected',   e => { pushReading('emotion', e.detail);   evaluateMode(); });
  window.addEventListener('attentionDetected', e => { pushReading('attention', e.detail); evaluateMode(); });

  // 8) Iniciar sensores
  await initEmotions(videoEl);
  initAttention(videoEl);

  // 9) Web Speech
  btnSpeak.addEventListener('click', () => window.dispatchEvent(new Event('startSpeech')));
  window.addEventListener('startSpeech', () => iniciarReconocimiento());

  window.addEventListener('speechResult', e => {
    const words = e.detail
      .toLowerCase()
      .replace(/[.,;!?¿¡]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const filtered = words.filter(w => originalWords.includes(w));
    transcriptionEl.innerText = filtered.join(' ');
    filtered.forEach(w => matchedWordsSet.add(w));
  });

  // 10) Señal de lectura completa
  window.addEventListener('readingComplete', () => {
    const matchesCount = matchedWordsSet.size;
    const totalCount   = originalWords.length || 1;
    const percent      = Math.round((matchesCount / totalCount) * 100);

    completedEl.innerText     = `¡Completado! Precisión: ${percent}%`;
    completedEl.style.display = 'block';
    btnNext.style.display     = 'inline-block';
  });

  // 11) Navegación “Siguiente”
  btnNext.addEventListener('click', () => {
    if (currentMode === 'lectura') {
      lectureIndex = (lectureIndex + 1) % lecturas.length;
    } else {
      gameIndex = (gameIndex + 1) % juegos.length;
    }
    adaptTo(currentMode);
  });

  // 12) Carga inicial
  adaptTo(currentMode);
});
