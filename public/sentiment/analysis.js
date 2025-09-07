// public/resources/sentiment/analysis.js

export function iniciarReconocimiento() {
  const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Reconocimiento) {
    console.error('SpeechRecognition no soportado en este navegador');
    return;
  }

  const recognition = new Reconocimiento();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = true;

  let transcriptFinal = '';

  recognition.onresult = event => {
    // Acumula resultados
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const resultado = event.results[i];
      const texto    = resultado[0].transcript;

      if (resultado.isFinal) {
        // 1) Resultado final: lo agregamos y notificamos completion
        transcriptFinal += texto + ' ';
        const completo = transcriptFinal.trim();

        // Emitir transcripción final
        window.dispatchEvent(new CustomEvent('speechResult', { detail: completo }));

        // Emitir evento de lectura completa
        window.dispatchEvent(new Event('readingComplete'));

        // Analizar sentimiento sobre el texto completo
        analizarSentimiento(completo);

      } else {
        // 2) Resultado intermedio: mostramos parcial
        interimTranscript += texto;
        window.dispatchEvent(new CustomEvent('speechResult', {
          detail: (transcriptFinal + interimTranscript).trim()
        }));
      }
    }
  };

  recognition.onerror = e => {
    console.error('🎤 Error reconocimiento:', e.error);
  };

  recognition.onend = () => {
    console.log('🎤 SpeechRecognition ended');
  };

  // Inicia reconocimiento
  recognition.start();
  console.log('🎤 Reconocimiento de voz iniciado');
}

async function analizarSentimiento(texto) {
  try {
    const res  = await fetch('/api/analyze', {
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
