// emociones.js - VERSIÓN OPTIMIZADA

export async function cargarModelosFaceApi() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/resources/jsFace-Api/models/tiny_face_detector'),
    faceapi.nets.faceExpressionNet.loadFromUri('/resources/jsFace-Api/models/face_expression'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/resources/jsFace-Api/models/face_landmark_68')
  ]);
}

// Control de concurrencia global
let isProcessing = false;
let isPaused = false;

export async function detectarEmocion(video) {
  // Evitar procesamiento concurrente
  if (isProcessing || isPaused) return 'neutral';
  
  isProcessing = true;
  
  try {
    const det = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 128, // Reducir de 416 a 128 para móviles
        scoreThreshold: 0.5 
      }))
      .withFaceLandmarks()
      .withFaceExpressions();
  
    const emo = !det?.expressions
      ? 'neutral'
      : Object.entries(det.expressions).sort((a, b) => b[1] - a[1])[0][0];
  
    window.dispatchEvent(new CustomEvent('emotionDetected', { detail: emo }));
    return emo;
  } catch (err) {
    console.warn('Face-API error:', err);
    return 'neutral';
  } finally {
    isProcessing = false;
  }
}

export async function initEmotions(video, intervalMs = 2000) { // Aumentado de 1500 a 2000ms
  await cargarModelosFaceApi();
  
  // Pedir cámara con resolución reducida
  if (!video.srcObject) {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 320 },  // Reducido de 640
        height: { ideal: 240 }, // Reducido de 480
        frameRate: { ideal: 15, max: 20 } // Limitar FPS
      } 
    });
    video.srcObject = stream;
    await new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  }
  
  // Detección periódica con requestIdleCallback cuando sea posible
  const detectLoop = async () => {
    if (!isPaused) {
      try {
        await detectarEmocion(video);
      } catch (err) {
        console.warn('Face-API falló:', err);
      }
    }
    
    // Usar requestIdleCallback si está disponible
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setTimeout(detectLoop, intervalMs), { timeout: intervalMs + 1000 });
    } else {
      setTimeout(detectLoop, intervalMs);
    }
  };
  
  detectLoop();
}

// Exportar funciones de control
export function pauseEmotionDetection() {
  isPaused = true;
}

export function resumeEmotionDetection() {
  isPaused = false;
}