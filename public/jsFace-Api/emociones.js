const video = document.getElementById('video');
const info = document.getElementById('info');

async function loadModels() {
  try {
    info.innerText = "Cargando modelos...";
    console.log("Iniciando carga de modelos...");

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/resources/jsFace-Api/models/tiny_face_detector'),
      faceapi.nets.faceExpressionNet.loadFromUri('/resources/jsFace-Api/models/face_expression'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/resources/jsFace-Api/models/face_landmark_68')
    ]);

    console.log("✅ Modelos cargados exitosamente");
    info.innerText = "Modelos cargados. Iniciando cámara...";
    startVideo();

  } catch (err) {
    console.error("❌ Error cargando modelos:", err);
    info.innerText = "Error cargando modelos: " + err.message;
  }
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
      info.innerText = "Cámara iniciada. Esperando detección...";
    })
    .catch(err => {
      console.error("Error cámara:", err);
      info.innerText = "Error cámara: " + err.message;
    });
}

video.addEventListener("playing", () => {
  console.log("🎥 Video en reproducción, creando canvas...");

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const resized = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);

      if (resized.length > 0) {
        const expressions = resized[0].expressions;
        const top = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
        info.innerText = `Emoción: ${top[0]} (${(top[1] * 100).toFixed(1)}%)`;
      } else {
        info.innerText = "No se detecta rostro.";
      }
    } catch (err) {
      console.error("Error en detección:", err);
      info.innerText = "Error en detección: " + err.message;
    }
  }, 500);
});

loadModels();
