// public/js/orquestador.js
import { initEmotions } from '/resources/jsFace-Api/emocioness.js';
import { initAttention } from '/resources/mediapipe/postt.js';
import { iniciarReconocimiento } from '/resources/sentiment/analysis.js';

window.addEventListener('DOMContentLoaded', async () => {
  // 1) Referencias al DOM
  const videoEl        = document.getElementById('video');
  const titleEl        = document.getElementById('itemTitle');
  const textEl         = document.getElementById('itemText');
  const transcriptionEl= document.getElementById('transcription');
  const completedEl    = document.getElementById('completed');
  const btnSpeak       = document.getElementById('btnSpeak');
  const btnNext        = document.getElementById('btnNext');

  // 2) Carga de JSON
  const data     = await fetch('/data/contenidos.json').then(r => r.json());
  const lecturas = data.primer.lecturas;
  const juegos   = data.primer.juegos;

  // 3) Índices y modo actual
  let lectureIndex = 0;
  let gameIndex    = 0;
  let currentMode  = 'lectura'; // 'lectura' o 'juego'

  // 4) Variables para comparación
  let originalWords   = [];
  let matchedWordsSet = new Set();

  function prepareOriginalWords(text) {
    return text
      .toLowerCase()
      .replace(/[.,;!?¿¡]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  // 5) Funciones de renderizado
  function showLecture(i) {
    const { titulo, texto } = lecturas[i];
    titleEl.innerText = titulo;
    textEl.innerText  = texto;

    // Preparamos palabras originales y reseteamos transcripción
    originalWords = prepareOriginalWords(texto);
    matchedWordsSet.clear();
    transcriptionEl.innerText = '';
    completedEl.style.display = 'none';
    btnNext.style.display     = 'none';
  }

  function showGame(i) {
    const { titulo } = juegos[i];
    titleEl.innerText = titulo;
    textEl.innerText  = '';
    originalWords = [];
    matchedWordsSet.clear();
    transcriptionEl.innerText = '';
    completedEl.style.display = 'none';
    btnNext.style.display     = 'none';
    // Aquí podrías inicializar tu mini-juego
  }

  function adaptTo(mode) {
    currentMode = mode;
    if (mode === 'juego') showGame(gameIndex);
    else                 showLecture(lectureIndex);
  }

  // 6) Sensores y histeresis (igual que antes)
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
    const sadPct = countRecent('emotion','sad') / (history.emotion.length||1);
    const disPct = countRecent('attention','distraído') / (history.attention.length||1);
    const worst = Math.max(sadPct, disPct);

    if (currentMode==='lectura' && worst>=0.6) adaptTo('juego');
    else if (currentMode==='juego' && worst<=0.4) adaptTo('lectura');
  }

  window.addEventListener('emotionDetected',   e => { pushReading('emotion', e.detail);   evaluateMode(); });
  window.addEventListener('attentionDetected', e => { pushReading('attention', e.detail); evaluateMode(); });

  // 7) Inicializa Face-API y MediaPipe
  await initEmotions(videoEl);
  initAttention(videoEl);

  // 8) Web Speech → iniciar reconocimiento
  btnSpeak.addEventListener('click', () => {
    window.dispatchEvent(new Event('startSpeech'));
  });
  window.addEventListener('startSpeech', () => iniciarReconocimiento());

  // 9) Filtrar la transcripción para mostrar solo palabras coincidentes
  window.addEventListener('speechResult', e => {
   // 1) Normalize y separa lo transcrito
   const words = e.detail
     .toLowerCase()
     .replace(/[.,;!?¿¡]/g, '')
     .split(/\s+/)
     .filter(Boolean);

   // 2) Filtra solo las palabras que estén en el texto original
   const filtered = words.filter(w => originalWords.includes(w));

   // 3) Muestra TODO lo filtrado, incluidas repeticiones
   transcriptionEl.innerText = filtered.join(' ');

   // 4) Para el cálculo de precisión, sigue usando el Set de únicas
   for (const w of filtered) {
     matchedWordsSet.add(w);
   }
 });
  // 10) Al completar la lectura, calculamos precisión
  window.addEventListener('readingComplete', () => {
    const matchesCount = matchedWordsSet.size;
    const totalCount   = originalWords.length || 1;
    const percent      = Math.round((matchesCount / totalCount) * 100);

    completedEl.innerText = `¡Completado! Precisión de lectura: ${percent}%`;
    completedEl.style.display  = 'block';
    btnNext.style.display      = 'inline-block';
  });

  // 11) Siguiente ítem
  btnNext.addEventListener('click', () => {
    if (currentMode === 'lectura') {
      lectureIndex = (lectureIndex + 1) % lecturas.length;
    } else {
      gameIndex = (gameIndex + 1) % juegos.length;
    }
    adaptTo(currentMode);
  });

  // 12) Primera carga
  adaptTo(currentMode);
});
