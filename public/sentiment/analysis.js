// speechAnalysys.js
export function iniciarReconocimiento() {
  const reconocimiento = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  reconocimiento.lang = 'es-ES';
  reconocimiento.continuous = true;
  reconocimiento.interimResults = true;

  let textoFinal = '';
  reconocimiento.onresult = event => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) {
        textoFinal += res[0].transcript + ' ';
        analizarSentimiento(textoFinal.trim());
      }
    }
  };

  reconocimiento.onerror = e => console.error('🎤 Error reconocimiento:', e.error);
  reconocimiento.start();
  console.log('🎤 Reconocimiento de voz iniciado');
}

function analizarSentimiento(texto) {
  fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto })
  })
    .then(r => r.json())
    .then(data => {
      const senti = data.score > 0 ? 'positivo' : data.score < 0 ? 'negativo' : 'neutral';
      window.dispatchEvent(new CustomEvent('sentimentDetected', { detail: senti }));
    })
    .catch(err => console.error('Error al analizar sentimiento:', err));
}
