// emociones.js
export async function cargarModelosFaceApi() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/resources/jsFace-Api/models/tiny_face_detector'),
    faceapi.nets.faceExpressionNet.loadFromUri('/resources/jsFace-Api/models/face_expression'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/resources/jsFace-Api/models/face_landmark_68')
  ]);
}

export async function detectarEmocion(video) {
  const deteccion = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  if (!deteccion || !deteccion.expressions) return "neutral";

  const emocionDominante = Object.entries(deteccion.expressions)
    .sort((a, b) => b[1] - a[1])[0][0];

  return emocionDominante; // ej: "happy", "sad", "angry"
}
