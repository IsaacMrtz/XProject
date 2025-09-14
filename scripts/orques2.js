// public/js/orquestador.js
import { initEmotions }          from '/resources/jsFace-Api/emocioness.js';
import { initAttention }         from '/resources/mediapipe/postt.js';
import { iniciarReconocimiento } from '/resources/sentiment/analysis.js';
import { updateStat }            from '/scripts/statsApi.js';
import { renderStats }           from '/scripts/uiRenderer.js';

window.addEventListener('DOMContentLoaded', async () => {
  // 0) Stats iniciales
  let stats = { ...window.appStats };
  renderStats(stats);

  // 1) Parámetros
  const { grado, id } = window.appParams || {};

  // 2) DOM refs
  const videoEl         = document.getElementById('video');
  const titleEl         = document.getElementById('itemTitle');
  const textEl          = document.getElementById('itemText');
  const transcriptionEl = document.getElementById('transcription');
  const completedEl     = document.getElementById('completed');
  const btnSpeak        = document.getElementById('btnSpeak');
  const btnNext         = document.getElementById('btnNext');

  // Avatar y burbuja
  const avatarContainer = document.getElementById('avatar-container');
  const avatarBubble    = document.getElementById('avatar-bubble');
  if (avatarContainer) {
    avatarContainer.addEventListener('click', () => {
      // Al tocar el avatar, navegamos a juego o disparamos evento
      adaptTo('juego');
    });
  }

  // 3) Carga de contenidos
  const dataRaw = await fetch('/data/contenidos.json').then(r => r.json());
  let lecturas  = dataRaw[grado]?.lecturas  || [];
  const juegos  = dataRaw[grado]?.juegos    || [];

  if (id) {
    lecturas = lecturas.filter(l => l.id === id);
    if (!lecturas.length) {
      titleEl.innerText = 'Lectura no encontrada';
      return;
    }
  }

  // 4) Estado de navegación
  let lectureIndex = 0;
  let gameIndex    = 0;
  let currentMode  = 'lectura';

  // 5) Preparar palabras
  let originalWords   = [];
  let matchedWordsSet = new Set();
  const prepareOriginalWords = text =>
    text
      .toLowerCase()
      .replace(/[.,;!?¿¡]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  // 6) Mostrar lectura / juego
  function showLecture(i) {
    const { titulo, texto } = lecturas[i];
    titleEl.innerText  = titulo;
    textEl.innerText   = texto;
    originalWords      = prepareOriginalWords(texto);
    matchedWordsSet.clear();
    transcriptionEl.innerText = '';
    completedEl.hidden        = true;
    btnNext.hidden            = true;
  }

  function showGame(i) {
    const { titulo } = juegos[i];
    titleEl.innerText  = titulo;
    textEl.innerText   = '';
    originalWords      = [];
    matchedWordsSet.clear();
    transcriptionEl.innerText = '';
    completedEl.hidden        = true;
    btnNext.hidden            = true;

    // Inicia mini-juego…
  }

  function adaptTo(mode) {
    currentMode = mode;
    if (mode === 'juego') showGame(gameIndex);
    else                  showLecture(lectureIndex);
  }

  // 7) Mensajes del avatar
  const avatarMsgs = {
    happy:      ['¡Lo haces genial!', '¡Sigue así!'],
    neutral:    ['Bien, continúa leyendo.', 'Estás avanzando.'],
    distracted: ['¿Te aburres? Toca aquí para jugar.', 'Un jueguito te anima.']
  };

  function showAvatar(list) {
    if (!avatarContainer) return;
    const msg = list[Math.floor(Math.random() * list.length)];
    avatarBubble.innerText    = msg;
    avatarContainer.hidden     = false;
    clearTimeout(avatarContainer._hideTimer);
    avatarContainer._hideTimer = setTimeout(() => {
      avatarContainer.hidden = true;
    }, 5000);
  }

  // 8) Emociones y atención
  const history = { emotion: [], attention: [] };
  function pushReading(type, value) {
    const now = Date.now();
    history[type].push({ value, ts: now });
    history[type] = history[type].filter(r => now - r.ts <= 5000);
  }
  window.addEventListener('emotionDetected', e => {
    pushReading('emotion', e.detail);
    const list = avatarMsgs[e.detail] || avatarMsgs.neutral;
    showAvatar(list);
    evaluateMode();
  });
  window.addEventListener('attentionDetected', e => {
    pushReading('attention', e.detail);
    if (e.detail === 'distraído') {
      showAvatar(avatarMsgs.distracted);
    }
    evaluateMode();
  });

  function countRecent(type, val) {
    return history[type].filter(r => r.value === val).length;
  }
  function evaluateMode() {
    const sadPct = countRecent('emotion','sad') / (history.emotion.length || 1);
    const disPct = countRecent('attention','distraído') / (history.attention.length || 1);
    const worst  = Math.max(sadPct, disPct);
    if (currentMode === 'lectura' && worst >= 0.6) adaptTo('juego');
    else if (currentMode === 'juego'   && worst <= 0.4) adaptTo('lectura');
  }

  // 9) Iniciar sensores
  await initEmotions(videoEl);
  initAttention(videoEl);

  // 10) Reconocimiento de voz
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

  // 11) Lectura completa → UI + Stats + métricas
  window.addEventListener('readingComplete', async () => {
    const matchesCount = matchedWordsSet.size;
    const totalCount   = originalWords.length || 1;
    const percent      = Math.round((matchesCount / totalCount) * 100);
    const errorsCount  = totalCount - matchesCount;
    const points       = percent;

    completedEl.innerText     = `¡Completado! Precisión: ${percent}%`;
    completedEl.hidden        = false;
    btnNext.hidden            = false;

    // Actualizar métricas específicas (si existen)
    document.getElementById('word-matched')?.innerText = matchesCount;
    document.getElementById('word-total')?.innerText   = totalCount;
    document.getElementById('error-count')?.innerText  = errorsCount;
    document.getElementById('points-count')?.innerText = points;

    // Stats globales
    try {
      const { updatedStats } = await updateStat('lecturas_leidas', 1);
      stats = updatedStats;
      renderStats(stats);
    } catch (err) {
      console.error('Error actualizando lecturas:', err);
    }
  });

  // 12) Juego completo → Stats
  window.addEventListener('gameComplete', async () => {
    try {
      const { updatedStats } = await updateStat('juegos_jugados', 1);
      stats = updatedStats;
      renderStats(stats);
    } catch (err) {
      console.error('Error actualizando juegos:', err);
    }
  });

  // 13) Eventos de nivel y desafíos (si los necesitas)
  // …

  // 14) Siguiente
  btnNext.addEventListener('click', () => {
    if (currentMode === 'lectura') lectureIndex = (lectureIndex + 1) % lecturas.length;
    else                           gameIndex    = (gameIndex    + 1) % juegos.length;
    adaptTo(currentMode);
  });

  // 15) Inicio
  adaptTo('lectura');
});
