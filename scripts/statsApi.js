// public/js/statsApi.js
export async function updateStat(field, delta, lecturaId, grado) {
  try {
    const response = await fetch('/api/stats/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field,
        delta,
        lecturaId, // ¡Asegúrate de enviar esto!
        grado,     // ¡Y esto!
      }),
    });

    if (!response.ok) {
      throw new Error('Error actualizando estadística');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error en updateStat:', err);
    throw err;
  }
}

