
export function iniciarPostura(video) {
  const pose = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
  });
  pose.setOptions({
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  pose.onResults(results => {
    const lm = results.poseLandmarks || [];
    let estado = 'distraído';
    if (lm.length) {
      const nose = lm[0],
            l = lm[11], r = lm[12],
            torsoWidth = Math.abs(l.x - r.x) || 0.2,
            centerX = (l.x + r.x) / 2,
            offset = Math.abs(nose.x - centerX);
      estado = offset > torsoWidth * 0.5 ? 'distraído' : 'atento';
    }
    window.dispatchEvent(new CustomEvent('attentionDetected', { detail: estado }));
  });

  const camera = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: video.videoWidth,
    height: video.videoHeight
  });
  camera.start();
}

export function initAttention(video) {
  const pose = new Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
  pose.setOptions({ modelComplexity: 1, minDetectionConfidence: .6, minTrackingConfidence: .6 });
  pose.onResults(res => {
    const lm = res.poseLandmarks || [];
    const state = lm.length
      ? (Math.abs(lm[0].x - (lm[11].x + lm[12].x)/2) > Math.abs(lm[11].x - lm[12].x)*0.5
         ? 'distraído' : 'atento')
      : 'distraído';
    window.dispatchEvent(new CustomEvent('attentionDetected', { detail: state }));
  });
  new Camera(video, { 
    onFrame: async () => await pose.send({ image: video }),
    width: video.videoWidth, height: video.videoHeight 
  }).start();
}