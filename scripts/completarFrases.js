let nivelesData = null;
let indiceNivel = 0;
let indiceFrase = 0;
let puntaje = 0;
let opcionSeleccionada = null;

async function cargarDatosJuego() { 
  try {
    const response = await fetch('../data/juegos.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de datos del juego.');
    }
    nivelesData = (await response.json()).segundo.completarFrases;
    iniciarJuego();
  } catch (error) {
    console.error('Error al cargar los datos:', error);
    document.getElementById("estado").innerHTML = `<div class="incorrecto">¡Ups! Ocurrió un error cargando el juego.</div>`;
  }
}

function iniciarJuego() {
  indiceNivel = 0;
  indiceFrase = 0;
  puntaje = 0;
  cargarFrase();
}

function cargarFrase() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const fraseActual = nivelActual.frases[indiceFrase];
  
  const contenedorJuego = document.getElementById("contenedor-juego");
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");

  // Limpiar contenido anterior
  contenedorJuego.innerHTML = "";
  estado.innerHTML = "";
  btnSiguiente.classList.add("oculto");
  opcionSeleccionada = null;

  // Crear emoji representativo de la frase
  const imagenFrase = getEmojiForSentence(fraseActual.texto);
  
  // Estructura principal del juego
  contenedorJuego.innerHTML = `
    <!-- Imagen/Emoji de la frase -->
    <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 25px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 15px;">
        ${imagenFrase}
      </div>
      <div style="background: linear-gradient(45deg, #4b6cb7, #667eea); color: white; padding: 12px 20px; border-radius: 25px; display: inline-block; font-weight: bold;">
        Completa la frase correctamente
      </div>
    </div>

    <!-- Frase a completar -->
    <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 25px; backdrop-filter: blur(10px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); margin-bottom: 20px;">
      <h3 style="color: white; margin: 0 0 20px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Completa la Frase</h3>
      <div id="frase-container" style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 15px; font-size: 24px; font-weight: bold; color: #2c3e50; text-align: center; min-height: 60px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        ${formatearFrase(fraseActual.texto)}
      </div>
    </div>

    <!-- Opciones disponibles -->
    <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 25px; backdrop-filter: blur(10px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); margin-bottom: 20px;">
      <h3 style="color: white; margin: 0 0 20px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Selecciona la Palabra Correcta</h3>
      <div id="opciones-disponibles" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
        ${fraseActual.opciones.map((opcion, index) => 
          `<div class="opcion-visual" data-opcion="${opcion}" data-id="opcion-${index}" onclick="seleccionarOpcion(this)" style="background: linear-gradient(45deg, #ff9800, #ff6b35); color: white; padding: 15px 25px; border-radius: 15px; cursor: pointer; user-select: none; font-size: 18px; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(255,152,0,0.3); text-transform: capitalize; border: 3px solid rgba(255,255,255,0.2); min-width: 80px; text-align: center;">
            ${opcion}
          </div>`
        ).join('')}
      </div>
    </div>

    <!-- Botones de acción -->
    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
      <button id="btnVerificar" onclick="verificarFrase()" style="background: linear-gradient(45deg, #10b981, #34d399); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(16,185,129,0.3); font-family: 'Quicksand', sans-serif; opacity: 0.5;" disabled>
        🎯 Verificar Respuesta
      </button>
      <button id="btnLimpiar" onclick="limpiarSeleccion()" style="background: linear-gradient(45deg, #6b7280, #9ca3af); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(107,114,128,0.3); font-family: 'Quicksand', sans-serif;">
        🔄 Limpiar
      </button>
    </div>
  `;
  
  actualizarInfo();
}

function getEmojiForSentence(frase) {
  const fraseMinuscula = frase.toLowerCase();
  
  if (fraseMinuscula.includes('perro') || fraseMinuscula.includes('ladra')) return '🐕';
  if (fraseMinuscula.includes('ave') || fraseMinuscula.includes('vuela')) return '🦅';
  if (fraseMinuscula.includes('gato')) return '🐱';
  if (fraseMinuscula.includes('sol')) return '☀️';
  if (fraseMinuscula.includes('vaca') || fraseMinuscula.includes('leche')) return '🐄';
  if (fraseMinuscula.includes('grande') || fraseMinuscula.includes('pequeño')) return '📏';
  
  return '❓';
}

function formatearFrase(texto) {
  return texto.replace('___', '<span id="espacio-respuesta" style="background: #f39c12; color: white; padding: 4px 12px; border-radius: 8px; border: 2px dashed #e67e22; min-width: 60px; display: inline-block; font-size: 18px; margin: 0 4px;">___</span>');
}

function seleccionarOpcion(elemento) {
  // Limpiar selección anterior
  document.querySelectorAll('.opcion-visual').forEach(opcion => {
    opcion.classList.remove('opcion-seleccionada');
    opcion.style.background = 'linear-gradient(45deg, #ff9800, #ff6b35)';
    opcion.style.transform = 'scale(1)';
    opcion.style.borderColor = 'rgba(255,255,255,0.2)';
  });
  
  // Seleccionar nueva opción
  elemento.classList.add('opcion-seleccionada');
  elemento.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
  elemento.style.transform = 'scale(1.1)';
  elemento.style.borderColor = '#27ae60';
  
  // Guardar selección
  opcionSeleccionada = elemento.dataset.opcion;
  
  // Mostrar la palabra en el espacio de la frase
  const espacioRespuesta = document.getElementById('espacio-respuesta');
  espacioRespuesta.textContent = opcionSeleccionada;
  espacioRespuesta.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
  espacioRespuesta.style.borderColor = '#27ae60';
  
  // Habilitar botón verificar
  const btnVerificar = document.getElementById('btnVerificar');
  btnVerificar.disabled = false;
  btnVerificar.style.opacity = '1';
  btnVerificar.style.cursor = 'pointer';
}

function limpiarSeleccion() {
  // Limpiar selección de opciones
  document.querySelectorAll('.opcion-visual').forEach(opcion => {
    opcion.classList.remove('opcion-seleccionada');
    opcion.style.background = 'linear-gradient(45deg, #ff9800, #ff6b35)';
    opcion.style.transform = 'scale(1)';
    opcion.style.borderColor = 'rgba(255,255,255,0.2)';
  });
  
  // Resetear espacio de respuesta
  const espacioRespuesta = document.getElementById('espacio-respuesta');
  espacioRespuesta.textContent = '___';
  espacioRespuesta.style.background = '#f39c12';
  espacioRespuesta.style.borderColor = '#e67e22';
  
  // Deshabilitar botón verificar
  const btnVerificar = document.getElementById('btnVerificar');
  btnVerificar.disabled = true;
  btnVerificar.style.opacity = '0.5';
  btnVerificar.style.cursor = 'not-allowed';
  
  // Limpiar selección y estado
  opcionSeleccionada = null;
  document.getElementById("estado").innerHTML = "";
}

function verificarFrase() {
  if (!opcionSeleccionada) {
    return;
  }
  
  const nivelActual = nivelesData.niveles[indiceNivel];
  const fraseActual = nivelActual.frases[indiceFrase];
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");
  
  // Verificar si la respuesta es correcta
  if (opcionSeleccionada.toLowerCase() === fraseActual.respuesta.toLowerCase()) {
    estado.innerHTML = `
      <div class="mensaje-exito">
        <span class="icono-exito">🎉</span>
        <h3>¡Excelente!</h3>
        <p>Has completado la frase correctamente</p>
      </div>`;
    
    btnSiguiente.classList.remove("oculto");
    puntaje++;
    
    // Efecto de éxito en la opción correcta
    const opcionCorrecta = document.querySelector('.opcion-seleccionada');
    if (opcionCorrecta) {
      opcionCorrecta.classList.add('opcion-correcta');
    }
    
    // Deshabilitar todas las opciones
    document.querySelectorAll('.opcion-visual').forEach(opcion => {
      opcion.style.pointerEvents = 'none';
      opcion.onclick = null;
    });
    
    // Ocultar botones de acción
    document.getElementById("btnVerificar").style.display = "none";
    document.getElementById("btnLimpiar").style.display = "none";
    
    actualizarInfo();
  } else {
    estado.innerHTML = `
      <div class="mensaje-error">
        <span class="icono-error">❌</span>
        <h3>No es correcto</h3>
        <p>La respuesta correcta es "${fraseActual.respuesta}". ¡Inténtalo de nuevo!</p>
      </div>`;
    
    // Efecto de error en la opción seleccionada
    const opcionIncorrecta = document.querySelector('.opcion-seleccionada');
    if (opcionIncorrecta) {
      opcionIncorrecta.classList.add('opcion-error');
      setTimeout(() => {
        opcionIncorrecta.classList.remove('opcion-error');
      }, 1000);
    }
  }
}

function siguiente() {
  const totalFrases = nivelesData.niveles[indiceNivel].frases.length;
  if (indiceFrase < totalFrases - 1) {
    indiceFrase++;
    cargarFrase();
  } else if (indiceNivel < nivelesData.niveles.length - 1) {
    indiceNivel++;
    indiceFrase = 0;
    cargarFrase();
  } else {
    // Juego terminado
    document.querySelector(".titulo-caja h1").textContent = "¡Juego Terminado! 🎊";
    document.querySelector(".descripcion").textContent = `Has completado todos los niveles de completar frases con ${puntaje} puntos.`;
    
    document.getElementById("contenedor-juego").innerHTML = `
      <div class="final-juego">
        <div class="trofeo-container">
          <span class="trofeo">🏆</span>
          <h2>¡Felicitaciones!</h2>
          <p>Has dominado el arte de completar frases</p>
          <div class="puntaje-final">
            <strong>Puntaje Final: ${puntaje} puntos</strong>
          </div>
          <div class="celebracion">
            <span>🎯</span><span>✍️</span><span>✨</span><span>🌟</span><span>🎉</span>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById("btnSiguiente").classList.add("oculto");
  }
}

function reiniciarJuego() {
  indiceNivel = 0;
  indiceFrase = 0;
  puntaje = 0;
  opcionSeleccionada = null;
  cargarFrase();
  document.getElementById("estado").innerHTML = "";
  document.getElementById("btnSiguiente").classList.add("oculto");
  toggleMenu();
}

function toggleMenu() {
  document.getElementById("menu-lateral").classList.toggle("mostrar");
}

function actualizarInfo() {
  document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
  document.getElementById("nivel").textContent = `Nivel ${nivelesData.niveles[indiceNivel].nivel_id} - Frase ${indiceFrase + 1} de ${nivelesData.niveles[indiceNivel].frases.length}`;
}

// Inicia el juego
cargarDatosJuego();