const reconocimiento = new webkitSpeechRecognition() || new SpeechRecognition();
reconocimiento.lang = 'es-ES';
reconocimiento.continuous = true;
reconocimiento.interimResults = true;

function analizarSentimiento(texto) {
  fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto })
  })
  .then(res => res.json())
  .then(data => {
    panelSentimiento.innerText =
      `Sentimiento: ${data.score > 0 ? 'Positivo' : data.score < 0 ? 'Negativo' : 'Neutral'} (${data.score})`;
  })
  .catch(err => {
    console.error("Error al analizar sentimiento:", err);
    panelSentimiento.innerText = 'Error al analizar sentimiento';
  });
}

const panelTexto = document.getElementById('transcripcion');
const panelSentimiento = document.getElementById('sentimiento');

let textoFinal = '';

reconocimiento.onresult = (event) => {
  let textoTemporal = '';

  for (let i = event.resultIndex; i < event.results.length; ++i) {
    const res = event.results[i];

    if (res.isFinal) {
      // Agregamos el fragmento finalizado
      textoFinal += res[0].transcript + ' ';
      
      // Mostramos la transcripción definitiva
      panelTexto.innerText = textoFinal.trim();
      
      // Enviamos al backend para obtener sentimiento
      analizarSentimiento(textoFinal);
    } else {
      // Acumulamos el fragmento interino
      textoTemporal += res[0].transcript;
      
      // Mostramos la transcripción combinada (confirmada + en vivo)
      panelTexto.innerText = (textoFinal + textoTemporal).trim();
    }
  }
};


reconocimiento.onerror = (event) => {
  console.error("🎤 Error en reconocimiento:", event.error);
};
document.getElementById('btnVoz').addEventListener('click', () => {
  iniciarReconocimiento();
});

function iniciarReconocimiento() {
  reconocimiento.start();
  console.log("🎤 Reconocimiento de voz iniciado");
}
