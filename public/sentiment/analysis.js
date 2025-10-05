// analysis.js - VERSIÓN OPTIMIZADA

let recognitionInstance = null;
let isRecognizing = false;

export function iniciarReconocimiento() {
  const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Reconocimiento) {
    console.error('SpeechRecognition no soportado en este navegador');
    return;
  }

  // Evitar múltiples instancias
  if (isRecognizing && recognitionInstance) {
    console.warn('Reconocimiento ya activo');
    return;
  }

  recognitionInstance = new Reconocimiento();
  recognitionInstance.lang = 'es-ES';
  recognitionInstance.continuous = true;
  recognitionInstance.interimResults = true;
  recognitionInstance.maxAlternatives = 1; // Solo mejor resultado

  let transcriptFinal = '';
  let debounceTimer = null;

  // IMPORTANTE: Pausar detecciones visuales cuando empiece a hablar
  recognitionInstance.onstart = () => {
    console.log('🎤 Reconocimiento iniciado - Pausando detecciones visuales');
    isRecognizing = true;
    window.dispatchEvent(new Event('speechStarted'));
  };

  recognitionInstance.onresult = event => {
    clearTimeout(debounceTimer);

    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const resultado = event.results[i];
      const texto = resultado[0].transcript;

      if (resultado.isFinal) {
        transcriptFinal += texto + ' ';
        
        // Debounce para evitar múltiples eventos
        debounceTimer = setTimeout(() => {
          const completo = transcriptFinal.trim();
          
          // Emitir transcripción final
          window.dispatchEvent(new CustomEvent('speechResult', { detail: completo }));
          
          // Emitir evento de lectura completa
          window.dispatchEvent(new Event('readingComplete'));
          
          // Analizar sentimiento solo una vez al final
          analizarSentimiento(completo);
        }, 500);

      } else {
        interimTranscript += texto;
        // Actualizar UI con resultados intermedios (throttled)
        window.dispatchEvent(new CustomEvent('speechResult', {
          detail: (transcriptFinal + interimTranscript).trim()
        }));
      }
    }
  };

  recognitionInstance.onerror = e => {
    console.error('🎤 Error reconocimiento:', e.error);
    
    // Si hay error, reintentar solo si no fue por permisos
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      isRecognizing = false;
      window.dispatchEvent(new Event('speechEnded'));
    }
  };

  recognitionInstance.onend = () => {
    console.log('🎤 Reconocimiento finalizado - Reanudando detecciones visuales');
    isRecognizing = false;
    recognitionInstance = null;
    window.dispatchEvent(new Event('speechEnded'));
  };

  // Inicia reconocimiento
  try {
    recognitionInstance.start();
    console.log('🎤 Reconocimiento de voz iniciado');
  } catch (err) {
    console.error('Error al iniciar reconocimiento:', err);
    isRecognizing = false;
  }
}

export function detenerReconocimiento() {
  if (recognitionInstance) {
    recognitionInstance.stop();
    recognitionInstance = null;
    isRecognizing = false;
  }
}

async function analizarSentimiento(texto) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto })
    });
    const data = await res.json();
    const senti = data.score > 0 ? 'positivo'
               : data.score < 0 ? 'negativo'
               : 'neutral';

    window.dispatchEvent(new CustomEvent('sentimentDetected', {
      detail: senti
    }));
  } catch (err) {
    console.error('Error al analizar sentimiento:', err);
  }
}