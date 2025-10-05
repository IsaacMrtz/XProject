let nivelesData = null;
let indiceNivel = 0;
let indicePalabra = 0;
let puntaje = 0;

async function cargarDatosJuego() { 
  try {
    const response = await fetch('../data/juegos.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de datos del juego.');
    }
    nivelesData = (await response.json()).segundo.ordenarSilabas;
    iniciarJuego();
  } catch (error) {
    console.error('Error al cargar los datos:', error);
    document.getElementById("estado").innerHTML = `<div class="incorrecto">¡Ups! Ocurrió un error cargando el juego.</div>`;
  }
}

function iniciarJuego() {
  indiceNivel = 0;
  indicePalabra = 0;
  puntaje = 0;
  cargarPalabra();
}

function cargarPalabra() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const palabraActual = nivelActual.palabras[indicePalabra];
  
  const contenedorJuego = document.getElementById("contenedor-juego");
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");

  // Limpiar contenido anterior
  contenedorJuego.innerHTML = "";
  estado.innerHTML = "";
  btnSiguiente.classList.add("oculto");

  // Crear imagen representativa de la palabra (usando emojis como placeholders)
  const imagenPalabra = getEmojiForWord(palabraActual.correcta);
  
  // Estructura principal del juego con diseño más atractivo
  contenedorJuego.innerHTML = `
    <!-- Imagen/Emoji de la palabra -->
    <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 25px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 20px;">
      <div style="font-size: 60px; margin-bottom: 15px;">
        ${imagenPalabra}
      </div>
      <div style="background: linear-gradient(45deg, #4b6cb7, #667eea); color: white; padding: 12px 20px; border-radius: 25px; display: inline-block; font-weight: bold;">
        Forma la palabra: <strong>${palabraActual.correcta.toUpperCase()}</strong>
      </div>
    </div>

    <!-- Área para formar la palabra -->
    <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 25px; backdrop-filter: blur(10px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); margin-bottom: 20px;">
      <h3 style="color: white; margin: 0 0 20px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Completa la Palabra</h3>
      <div id="slots-container" style="display: flex; justify-content: center; gap: 15px; margin: 20px 0; flex-wrap: wrap;">
        ${palabraActual.silabas.map((_, index) => 
          `<div class="slot-silaba-visual" data-posicion="${index}" style="width: 80px; height: 80px; background: rgba(255,255,255,0.9); border: 3px dashed #4b6cb7; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div class="slot-content" style="font-size: 20px; font-weight: bold; text-transform: lowercase;">?</div>
          </div>`
        ).join('')}
      </div>
    </div>

    <!-- Sílabas disponibles -->
    <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 25px; backdrop-filter: blur(10px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); margin-bottom: 20px;">
      <h3 style="color: white; margin: 0 0 20px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Sílabas Disponibles</h3>
      <div id="silabas-disponibles" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
        ${palabraActual.silabas
          .sort(() => Math.random() - 0.5)
          .map((silaba, index) => 
            `<div class="silaba-visual" data-silaba="${silaba}" data-id="silaba-${index}" draggable="true" style="background: linear-gradient(45deg, #ff9800, #ff6b35); color: white; padding: 15px 20px; border-radius: 15px; cursor: grab; user-select: none; font-size: 18px; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(255,152,0,0.3); text-transform: lowercase; border: 3px solid rgba(255,255,255,0.2); min-width: 50px; text-align: center;">
              ${silaba}
            </div>`
          ).join('')}
      </div>
    </div>

    <!-- Botones de acción -->
    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
      <button id="btnVerificar" onclick="verificarPalabra()" style="background: linear-gradient(45deg, #10b981, #34d399); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(16,185,129,0.3); font-family: 'Nunito', sans-serif;">
        🎯 Verificar Palabra
      </button>
      <button id="btnLimpiar" onclick="limpiarPalabra()" style="background: linear-gradient(45deg, #6b7280, #9ca3af); color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 5px 20px rgba(107,114,128,0.3); font-family: 'Nunito', sans-serif;">
        🔄 Limpiar
      </button>
    </div>
  `;

  // Configurar eventos de drag and drop
  configurarDragAndDrop();
  
  actualizarInfo();
}

function getEmojiForWord(palabra) {
  const emojiMap = {
    'camisa': '👕',
    'zapato': '👞',
    'pelota': '⚽',
    'mariposa': '🦋',
    'elefante': '🐘',
    'gato': '🐱',
    'perro': '🐶',
    'casa': '🏠',
    'sol': '☀️',
    'luna': '🌙',
    'flor': '🌸',
    'árbol': '🌳',
    'agua': '💧'
  };
  return emojiMap[palabra.toLowerCase()] || '❓';
}

function configurarDragAndDrop() {
  const silabas = document.querySelectorAll('.silaba-visual');
  const slots = document.querySelectorAll('.slot-silaba-visual');

  // Configurar sílabas arrastrables
  silabas.forEach(silaba => {
    silaba.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', silaba.dataset.silaba);
      e.dataTransfer.setData('application/silaba-id', silaba.dataset.id);
      silaba.classList.add('arrastrando');
    });

    silaba.addEventListener('dragend', () => {
      silaba.classList.remove('arrastrando');
    });

    // También permitir click para seleccionar en móviles
    silaba.addEventListener('click', () => {
      if (!silaba.classList.contains('usado')) {
        seleccionarSilaba(silaba);
      }
    });
  });

  // Configurar slots para recibir sílabas
  slots.forEach(slot => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('slot-hover');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('slot-hover');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('slot-hover');
      
      const silaba = e.dataTransfer.getData('text/plain');
      const silabaId = e.dataTransfer.getData('application/silaba-id');
      
      colocarSilabaEnSlot(slot, silaba, silabaId);
    });

    // Permitir click para remover sílaba
    slot.addEventListener('click', () => {
      if (slot.querySelector('.slot-content').textContent !== '?') {
        removerSilabaDeSlot(slot);
      }
    });
  });
}

function seleccionarSilaba(elemento) {
  // Encontrar el primer slot vacío
  const slots = document.querySelectorAll('.slot-silaba-visual');
  const slotVacio = Array.from(slots).find(slot => 
    slot.querySelector('.slot-content').textContent === '?'
  );
  
  if (slotVacio) {
    colocarSilabaEnSlot(slotVacio, elemento.dataset.silaba, elemento.dataset.id);
  }
}

function colocarSilabaEnSlot(slot, silaba, silabaId) {
  // Si el slot ya tiene una sílaba, devolverla
  const contenidoSlot = slot.querySelector('.slot-content');
  if (contenidoSlot.textContent !== '?') {
    devolverSilaba(contenidoSlot.textContent);
  }

  // Colocar la nueva sílaba
  contenidoSlot.textContent = silaba;
  slot.classList.add('slot-ocupado');
  
  // Marcar la sílaba original como usada
  const silabaOriginal = document.querySelector(`[data-id="${silabaId}"]`);
  if (silabaOriginal) {
    silabaOriginal.classList.add('usado');
    silabaOriginal.style.opacity = '0.3';
  }

  // Agregar efecto visual
  slot.classList.add('slot-animacion');
  setTimeout(() => slot.classList.remove('slot-animacion'), 300);
}

function removerSilabaDeSlot(slot) {
  const contenidoSlot = slot.querySelector('.slot-content');
  const silaba = contenidoSlot.textContent;
  
  if (silaba !== '?') {
    devolverSilaba(silaba);
    contenidoSlot.textContent = '?';
    slot.classList.remove('slot-ocupado');
  }
}

function devolverSilaba(silaba) {
  const silabas = document.querySelectorAll('.silaba-visual');
  silabas.forEach(elemento => {
    if (elemento.dataset.silaba === silaba && elemento.classList.contains('usado')) {
      elemento.classList.remove('usado');
      elemento.style.opacity = '1';
    }
  });
}

function limpiarPalabra() {
  // Limpiar todos los slots
  document.querySelectorAll('.slot-silaba-visual').forEach(slot => {
    const contenidoSlot = slot.querySelector('.slot-content');
    if (contenidoSlot.textContent !== '?') {
      devolverSilaba(contenidoSlot.textContent);
      contenidoSlot.textContent = '?';
      slot.classList.remove('slot-ocupado');
    }
  });
  
  document.getElementById("estado").innerHTML = "";
}

function verificarPalabra() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const palabraActual = nivelActual.palabras[indicePalabra];
  const slots = document.querySelectorAll('.slot-silaba-visual');
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");
  
  // Construir la palabra formada
  let palabraFormada = "";
  let slotsCompletos = 0;
  
  slots.forEach(slot => {
    const contenido = slot.querySelector('.slot-content').textContent;
    if (contenido && contenido !== "?") {
      palabraFormada += contenido;
      slotsCompletos++;
    }
  });
  
  // Verificar si todos los slots están llenos
  if (slotsCompletos !== palabraActual.silabas.length) {
    estado.innerHTML = `
      <div class="mensaje-error">
        <span class="icono-error">⚠️</span>
        <p>Completa todas las sílabas antes de verificar.</p>
      </div>`;
    return;
  }
  
  // Verificar si la palabra es correcta
  if (palabraFormada.toLowerCase() === palabraActual.correcta.toLowerCase()) {
    estado.innerHTML = `
      <div class="mensaje-exito">
        <span class="icono-exito">🎉</span>
        <h3>¡Excelente!</h3>
        <p>Has formado "${palabraActual.correcta}" correctamente</p>
      </div>`;
    
    btnSiguiente.classList.remove("oculto");
    puntaje++;
    
    // Efecto de éxito en los slots
    slots.forEach(slot => {
      slot.classList.add('slot-correcto');
      slot.style.pointerEvents = 'none';
    });
    
    // Deshabilitar sílabas
    document.querySelectorAll('.silaba-visual').forEach(s => {
      s.draggable = false;
      s.style.pointerEvents = 'none';
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
        <p>La palabra debe ser "${palabraActual.correcta}". ¡Inténtalo de nuevo!</p>
      </div>`;
    
    // Efecto de error en los slots
    slots.forEach(slot => slot.classList.add('slot-error'));
    setTimeout(() => {
      slots.forEach(slot => slot.classList.remove('slot-error'));
    }, 1000);
  }
}

function siguiente() {
  const totalPalabras = nivelesData.niveles[indiceNivel].palabras.length;
  if (indicePalabra < totalPalabras - 1) {
    indicePalabra++;
    cargarPalabra();
  } else if (indiceNivel < nivelesData.niveles.length - 1) {
    indiceNivel++;
    indicePalabra = 0;
    cargarPalabra();
  } else {
    // Juego terminado
    document.querySelector(".titulo-caja h1").textContent = "¡Juego Terminado! 🎊";
    document.querySelector(".descripcion").textContent = `Has completado todos los niveles de ordenar sílabas con ${puntaje} puntos.`;
    
    document.getElementById("contenedor-juego").innerHTML = `
      <div class="final-juego">
        <div class="trofeo-container">
          <span class="trofeo">🏆</span>
          <h2>¡Felicitaciones!</h2>
          <p>Has dominado el arte de ordenar sílabas</p>
          <div class="puntaje-final">
            <strong>Puntaje Final: ${puntaje} puntos</strong>
          </div>
          <div class="celebracion">
            <span>🎯</span><span>📝</span><span>✨</span><span>🌟</span><span>🎉</span>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById("btnSiguiente").classList.add("oculto");
  }
}

function reiniciarJuego() {
  indiceNivel = 0;
  indicePalabra = 0;
  puntaje = 0;
  cargarPalabra();
  document.getElementById("estado").innerHTML = "";
  document.getElementById("btnSiguiente").classList.add("oculto");
  toggleMenu();
}

function toggleMenu() {
  document.getElementById("menu-lateral").classList.toggle("mostrar");
}

function actualizarInfo() {
  document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
  document.getElementById("nivel").textContent = `Nivel ${nivelesData.niveles[indiceNivel].nivel_id} - Palabra ${indicePalabra + 1} de ${nivelesData.niveles[indiceNivel].palabras.length}`;
}

// Inicia el juego
cargarDatosJuego();