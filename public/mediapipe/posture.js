// posture.js
(() => {
  const btnPostura   = document.getElementById('btnPostura');
  const panelPostura = document.getElementById('postura');
  const video        = document.getElementById('video');  // Asegúrate que existe en tu HTML
  let camera, pose;
  let resultadoPostura = 'atento';

  // Función que evalúa si el usuario está distraído basándose en nariz y hombros
  function evaluarAtencion(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return 'distraído';
    }

    // Punto de la nariz
    const nose = landmarks[0];
    // Hombros izquierdo (11) y derecho (12)
    const leftShoulder  = landmarks[11];
    const rightShoulder = landmarks[12];

    // Anchura del torso (normaliza movimientos)
    const torsoWidth = Math.abs(leftShoulder.x - rightShoulder.x) || 0.2;

    // Desplazamiento horizontal de la cabeza respecto al centro del torso
    const torsoCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const headOffset   = Math.abs(nose.x - torsoCenterX);

    // Si la cabeza se sale de la mitad del ancho del torso → distraído
    return headOffset > torsoWidth * 0.5 ? 'distraído' : 'atento';
  }

  // Callback de MediaPipe con los resultados
  function onPoseResults(results) {
    const landmarks = results.poseLandmarks;
    resultadoPostura = evaluarAtencion(landmarks);
    panelPostura.innerText = `Postura: ${resultadoPostura}`;
  }

  // Inicializa MediaPipe Pose y la cámara
  async function iniciarPostura() {
    // Asegura dimensiones de video antes de iniciar
    if (!video.videoWidth || !video.videoHeight) {
      await new Promise(r => setTimeout(r, 200));
      return iniciarPostura();
    }

    // Configura el detector
    pose = new Pose({
      locateFile: file => `/resources/mediapipe/${file}`
    });
    pose.setOptions({
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });
    pose.onResults(onPoseResults);

    // Inicia la cámara
    camera = new Camera(video, {
      onFrame: async () => {
        await pose.send({ image: video });
      },
      width:  video.videoWidth,
      height: video.videoHeight
    });
    camera.start();

    panelPostura.innerText = 'Postura: iniciando detección…';
  }

  // Evento para arrancar todo
  btnPostura.addEventListener('click', iniciarPostura);
})();
