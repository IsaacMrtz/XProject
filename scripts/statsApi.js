// public/js/statsApi.js
export async function updateStat(field, delta) {
  const res = await fetch('/api/stats/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, delta,grado: window.appParams.grado })
  });
  if (!res.ok) throw new Error('Error actualizando estadística');
  return res.json();  // { updatedStats: { lecturasLeidas, … } }
}
