const video = document.getElementById('video');
const info = document.getElementById('info');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/jsFace-Api/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/jsFace-Api/models'),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri('/jsFace-Api/models')
]).then(startVideo).catch(err => {
  info.innerText = 'Error al cargar modelos: ' + err;
});

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => info.innerText = 'Error al acceder a la cámara: ' + err);
}

video.addEventListener('play', () => {
  info.innerText = 'Detectando emociones...';
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (resized.length > 0) {
      const expressions = resized[0].expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const topEmotion = sorted[0];
      info.innerText = `Emoción detectada: ${topEmotion[0]} (${(topEmotion[1] * 100).toFixed(1)}%)`;
    } else {
      info.innerText = 'No se detectó ningún rostro.';
    }
  }, 500);
});
