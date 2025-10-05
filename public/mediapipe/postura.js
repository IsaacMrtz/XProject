// posture.js
const btnPostura = document.getElementById('btnPostura');
const panelPostura = document.getElementById('postura');

let resultadoPostura = 'atento';
let camera, pose;

// Iniciar MediaPipe Pose
// posture.js
;(function(){
  // NO redeclaramos 'video', asumimos que ya existe globalmente
  const btnPostura = document.getElementById('btnPostura');
  const panelPostura = document.getElementById('postura');
  let resultadoPostura = 'atento';
  let camera, pose;

  async function iniciarPostura() {
    pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    pose.setOptions({ modelComplexity: 0, minDetectionConfidence: .5, minTrackingConfidence: .5 });
    pose.onResults(onPoseResults);

    camera = new Camera(video, {
      onFrame: async () => await pose.send({image: video}),
      width: video.videoWidth,
      height: video.videoHeight
    });
    camera.start();
    panelPostura.innerText = 'Postura: iniciando...';
  }

  function onPoseResults(results) {
    const landmarks = results.poseLandmarks;
    if (!landmarks || landmarks.length === 0) {
      resultadoPostura = 'distraído';
    } else {
      const nose = landmarks[0];
      resultadoPostura = (nose.x<0||nose.x>1||nose.y<0||nose.y>1) ? 'distraído' : 'atento';
    }
    panelPostura.innerText = `Postura: ${resultadoPostura}`;
  }

  btnPostura.addEventListener('click', iniciarPostura);
})();


// Callback al recibir resultados
function onPoseResults(results) {
  const landmarks = results.poseLandmarks;
  
  // Si no detecta cabeza (nariz), consideramos “distraído”
  if (!landmarks || landmarks.length === 0) {
    resultadoPostura = 'distraído';
  } else {
    // Nariz siempre es el índice 0
    const nose = landmarks[0];
    // Opcional: si quieres checar fuera de cuadro
    if (nose.x < 0 || nose.x > 1 || nose.y < 0 || nose.y > 1) {
      resultadoPostura = 'distraído';
    } else {
      resultadoPostura = 'atento';
    }
  }
  
  panelPostura.innerText = `Postura: ${resultadoPostura}`;
}

// Botón para arrancar la detección
btnPostura.addEventListener('click', () => {
  iniciarPostura();
});
