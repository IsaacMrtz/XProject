// emociones.js
export async function cargarModelosFaceApi() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/resources/jsFace-Api/models/tiny_face_detector'),
    faceapi.nets.faceExpressionNet.loadFromUri('/resources/jsFace-Api/models/face_expression'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/resources/jsFace-Api/models/face_landmark_68')
  ]);
}
//import { pushReading } from '/scripts/orquestador.js';
export async function detectarEmocion(video) {
  const det = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  const emo = !det?.expressions
    ? 'neutral'
    : Object.entries(det.expressions).sort((a, b) => b[1] - a[1])[0][0];

  window.dispatchEvent(new CustomEvent('emotionDetected', { detail: emo }));
  return emo;
}

export async function initEmotions(video, intervalMs = 1500) {
  await cargarModelosFaceApi();
  setInterval(() => detectarEmocion(video), intervalMs);
}