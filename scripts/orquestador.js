// app.js
//import { cargarModelosFaceApi, detectarEmocion } from '/resources/jsFace-Api/emocioness.js';
//import { iniciarReconocimiento }            from '/resources/sentiment/analysis.js';
//import { iniciarPostura }                   from '/resources/mediapipe/postt.js';


import { initEmotions }   from '/resources/jsFace-Api/emocioness.js';
import { initAttention }  from '/resources/mediapipe/postt.js';
import { cargarContenido } from '/controller/contentController.js';
// ----- Historial y estado -----
const history = {
  emotion:   [],  // { value: 'sad'|'happy'|'neutral', ts }
  attention: []   // { value: 'distraído'|'atento', ts }
};
let currentMode = 'lectura'; // 'lectura' o 'juego'

// ----- Funciones de historial -----
function pushReading(type, value) {
  const now = Date.now();
  history[type].push({ value, ts: now });
  // Mantenemos solo los últimos 5 segundos
  history[type] = history[type].filter(r => now - r.ts <= 5000);
}

function countRecent(type, target) {
  return history[type].filter(r => r.value === target).length;
}

// ----- Lógica de evaluación con histeresis -----
function evaluateMode() {
  const totalEmo = history.emotion.length || 1;
  const sadPct   = countRecent('emotion', 'happy') / totalEmo;

  const totalAtt = history.attention.length || 1;
  const disPct   = countRecent('attention', 'atento') / totalAtt;

  const worstPct = Math.max(sadPct, disPct);

  // Umbral de entrada a juego: ≥ 60%
  // Umbral de salida a lectura: ≤ 40%
  if (currentMode === 'lectura' && worstPct >= 0.6) {
    currentMode = 'juego';
    adaptTo(currentMode);
  } else if (currentMode === 'juego' && worstPct <= 0.4) {
    currentMode = 'lectura';
    adaptTo(currentMode);
  }
}

// ----- Disparo de adaptación -----
function adaptTo(mode) {
  if (mode === 'juego') {
    cargarContenido('primer', 'juegos', 'juego1');
  } else {
    cargarContenido('primer', 'lecturas', 'lectura1');
  }
}

// ----- Listeners de eventos de sensores -----
window.addEventListener('emotionDetected',   e => {
  pushReading('emotion', e.detail);
  evaluateMode();
});

window.addEventListener('attentionDetected', e => {
  pushReading('attention', e.detail);
  evaluateMode();
});

// ----- Inicialización -----
window.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('video');
  // Inicia detección de emociones en bucle
  await initEmotions(video);
  // Inicia detección de atención
  initAttention(video);
  // Primera carga según modo inicial
  adaptTo(currentMode);
});