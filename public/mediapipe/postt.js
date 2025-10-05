// postt.js - VERSIÓN OPTIMIZADA

let poseInstance = null;
let cameraInstance = null;
let isPaused = false;
let isProcessing = false;
let lastProcessTime = 0;
const PROCESS_INTERVAL = 500; // Procesar cada 500ms en lugar de cada frame

export function initAttention(video) {
  // Evitar inicializar múltiples veces
  if (poseInstance) {
    console.warn('Pose ya inicializado');
    return;
  }

  poseInstance = new Pose({ 
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` 
  });
  
  // Configuración más ligera
  poseInstance.setOptions({ 
    modelComplexity: 0, // 0 = lite, 1 = full, 2 = heavy
    smoothLandmarks: true,
    enableSegmentation: false, // Desactivar segmentación innecesaria
    smoothSegmentation: false,
    minDetectionConfidence: 0.5, // Bajado de 0.6
    minTrackingConfidence: 0.5   // Bajado de 0.6
  });
  
  poseInstance.onResults(res => {
    const lm = res.poseLandmarks || [];
    const state = lm.length
      ? (Math.abs(lm[0].x - (lm[11].x + lm[12].x)/2) > Math.abs(lm[11].x - lm[12].x)*0.5
         ? 'distraído' : 'atento')
      : 'distraído';
    
    window.dispatchEvent(new CustomEvent('attentionDetected', { detail: state }));
  });
  
  // Camera con FPS limitado
  cameraInstance = new Camera(video, { 
    onFrame: async () => {
      // Control de throttling manual
      const now = Date.now();
      if (isPaused || isProcessing || (now - lastProcessTime < PROCESS_INTERVAL)) {
        return;
      }
      
      isProcessing = true;
      lastProcessTime = now;
      
      try {
        await poseInstance.send({ image: video });
      } catch (err) {
        console.warn('MediaPipe Pose error:', err);
      } finally {
        isProcessing = false;
      }
    },
    width: 320,  // Reducido
    height: 240  // Reducido
  });
  
  cameraInstance.start();
}

// Funciones de control
export function pauseAttentionDetection() {
  isPaused = true;
}

export function resumeAttentionDetection() {
  isPaused = false;
}

export function stopAttentionDetection() {
  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }
  if (poseInstance) {
    poseInstance.close();
    poseInstance = null;
  }
  isPaused = false;
  isProcessing = false;
}