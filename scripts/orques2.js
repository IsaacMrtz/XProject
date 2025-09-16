// public/js/orquestador.js
import { initEmotions }          from '/resources/jsFace-Api/emocioness.js';
import { initAttention }         from '/resources/mediapipe/postt.js';
import { iniciarReconocimiento } from '/resources/sentiment/analysis.js';
import { updateStat }            from '/scripts/statsApi.js';
import { renderStats }           from '/scripts/uiRender.js';

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
  const btnBack = document.querySelector('.btn-back');

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
  
  let avatarState = {
        hasWelcomed: false, // Controla si ya dio el mensaje de bienvenida
        lastMessageTime: 0, // Último momento en que se mostró un mensaje
        distractedStartTime: null // Momento en que se detectó distracción
    };
  
    const MESSAGE_COOLDOWN = 10000; // 10 segundos de espera entre mensajes
    const DISTRACTED_THRESHOLD = 5000; // 5 segundos de distracción para mostrar mensaje 

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
  // 1) Extraemos todos los campos
  const { titulo, texto, imagen, dificultad } = lecturas[i];

  // 2) Imagen dinámica (asegúrate de que exista un <img id="reading-img"> en tu HTML)
  const imgEl = document.getElementById('reading-img');
  if (imgEl) {
    if (imagen) {
      // Ajusta la ruta si guardas en /resources/images/…
      imgEl.src = `/resources/images/${imagen}`;
      imgEl.style.display = '';
    } else {
      imgEl.removeAttribute('src');
      imgEl.style.display = 'none';
    }
  }

  // 3) Título y texto de la lectura
  titleEl.innerText = titulo;
  textEl.innerText  = texto;

  // 4) Preparar matching de palabras, limpiar UI de transcripción y botones
  originalWords      = prepareOriginalWords(texto);
  matchedWordsSet.clear();
  transcriptionEl.innerText = '';
  completedEl.style.display = 'none';
  btnNext.style.display     = 'none';

  // 5) Actualizar dificultad en el último stat-card
  const diffCard = document.querySelector('.stats-aside .stat-card:last-child');
  if (diffCard) {
    diffCard.innerHTML = `⭐ Dificultad: ${dificultad || 'Media'}`;
  }
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
        welcome: ['¡Vamos a leer!', '¡Hola!', '¡Comencemos!'],
        happy: ['¡Lo haces genial!', '¡Sigue así!', '¡Me encanta tu entusiasmo!'],
        neutral: ['Bien, continúa leyendo.', 'Estás avanzando.', 'Muy bien, sigue concentrado.'],
        distracted: ['¿Te aburres? Toca aquí para jugar.', 'Un jueguito te anima.', '¿Necesitas un descanso?']
    };

function showAvatar(messageList) {
        if (!avatarContainer) return;
        
        // No mostrar si está en cooldown
        const now = Date.now();
        if (now - avatarState.lastMessageTime < MESSAGE_COOLDOWN) {
            return;
        }

        const msg = messageList[Math.floor(Math.random() * messageList.length)];
        avatarBubble.innerText = msg;
        avatarContainer.hidden = false;
        
        // Ocultar la burbuja y el contenedor
        clearTimeout(avatarContainer._hideTimer);
        avatarContainer._hideTimer = setTimeout(() => {
            avatarContainer.hidden = true;
        }, 5000); // 5 segundos de visibilidad
        
        avatarState.lastMessageTime = now; // Actualizar el tiempo del último mensaje
    }

  // 8) Emociones y atención
  const history = { emotion: [], attention: [] };
  function pushReading(type, value) {
    const now = Date.now();
    history[type].push({ value, ts: now });
    history[type] = history[type].filter(r => now - r.ts <= 5000);
  }
    window.addEventListener('emotionDetected', e => {
        // Ignorar si no estamos en una lectura activa
        if (currentMode !== 'lectura') return;
        
        const emotion = e.detail;
        if (emotion === 'happy' || emotion === 'neutral') {
            showAvatar(avatarMsgs[emotion]);
        }
    });
    window.addEventListener('attentionDetected', e => {
        // Ignorar si no estamos en una lectura activa
        if (currentMode !== 'lectura') return;

        const attentionState = e.detail;
        const now = Date.now();

        if (attentionState === 'distraído') {
            if (!avatarState.distractedStartTime) {
                // Iniciar el temporizador si es la primera vez que se detecta distracción
                avatarState.distractedStartTime = now;
            } else if (now - avatarState.distractedStartTime >= DISTRACTED_THRESHOLD) {
                // Si la distracción dura más del umbral, mostrar el mensaje
                showAvatar(avatarMsgs.distracted);
            }
        } else {
            // Reiniciar el temporizador si el usuario vuelve a prestar atención
            avatarState.distractedStartTime = null;
        }
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

if (btnBack) {
    btnBack.addEventListener('click', () => {
      window.history.back();
    });
  }


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

  if (completedEl) completedEl.style.display = 'block';
  if (btnNext) btnNext.style.display = 'inline-block';

    // Actualizar métricas específicas (si existen)
    const elmWordMatched = document.getElementById('word-matched');
  if (elmWordMatched) elmWordMatched.innerText = matchesCount;

  const elmWordTotal = document.getElementById('word-total');
  if (elmWordTotal) elmWordTotal.innerText = totalCount;

  const elmErrorCount = document.getElementById('error-count');
  if (elmErrorCount) elmErrorCount.innerText = errorsCount;

  const elmPointsCount = document.getElementById('points-count');
  if (elmPointsCount) elmPointsCount.innerText = points;

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

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      window.dispatchEvent(new Event('nextItem'));
      if (completedEl) completedEl.style.display = 'none';
      if (btnNext) btnNext.style.display = 'none';
    });
  }

  // 15) Inicio
  adaptTo('lectura');
});
