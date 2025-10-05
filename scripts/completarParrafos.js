let nivelesData = null;
let indiceNivel = 0;
let indiceParrafo = 0;
let puntaje = 0;

async function cargarDatosJuego() {
  try {
    const response = await fetch('../data/juegos.json');
    if (!response.ok) throw new Error('No se pudo cargar el archivo de datos del juego.');
    nivelesData = (await response.json()).tercero.completarParrafos;
    iniciarJuego();
  } catch (error) {
    console.error('Error al cargar los datos:', error);
    document.getElementById("estado").innerHTML =
      `<div class="incorrecto">¡Ups! Ocurrió un error cargando el juego.</div>`;
  }
}

function iniciarJuego() {
  indiceNivel = 0;
  indiceParrafo = 0;
  puntaje = 0;
  cargarParrafo();
}

function cargarParrafo() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const parrafo = nivelActual.parrafos[indiceParrafo];

  const contenedorJuego = document.getElementById("letras");
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");

  contenedorJuego.innerHTML = "";
  estado.innerHTML = "";
  btnSiguiente.classList.add("oculto");

  // Crear área del párrafo
  const areaParrafo = document.createElement("div");
  areaParrafo.classList.add("area-parrafo");
  areaParrafo.innerHTML = "<h3>Completa el Párrafo:</h3>";
  
  const contenedorParrafo = document.createElement("div");
  contenedorParrafo.classList.add("contenedor-parrafo");

  // Generar el párrafo con dropzones
  let partes = parrafo.texto.split("___");
  let dropzoneIndex = 0;
  
  partes.forEach((parte, i) => {
    // Agregar texto si no está vacío
    if (parte.trim()) {
      const spanTexto = document.createElement("span");
      spanTexto.innerText = parte;
      spanTexto.classList.add("texto-parrafo");
      contenedorParrafo.appendChild(spanTexto);
    }

    // Agregar dropzone si no es la última parte
    if (i < partes.length - 1) {
      const dropzone = document.createElement("span");
      dropzone.classList.add("dropzone-parrafo");
      dropzone.dataset.index = dropzoneIndex;
      dropzone.innerHTML = `<span class="placeholder">___</span>`;
      
      // Configurar eventos de drag para dropzones
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
      });
      
      dropzone.addEventListener("dragleave", (e) => {
        if (!dropzone.contains(e.relatedTarget)) {
          dropzone.classList.remove("drag-over");
        }
      });
      
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
        
        const palabraText = e.dataTransfer.getData("text");
        const palabraElement = document.querySelector(`[data-palabra="${palabraText}"]:not([style*="display: none"])`);
        
        if (palabraElement && !dropzone.classList.contains("ocupado")) {
          // Limpiar placeholder y agregar palabra
          dropzone.innerHTML = palabraText;
          dropzone.classList.add("ocupado");
          palabraElement.style.display = "none";
          
          // Botón para remover
          const btnRemover = document.createElement("button");
          btnRemover.innerHTML = "×";
          btnRemover.classList.add("btn-remover-parrafo");
          btnRemover.onclick = (e) => {
            e.stopPropagation();
            dropzone.innerHTML = `<span class="placeholder">___</span>`;
            dropzone.classList.remove("ocupado");
            palabraElement.style.display = "inline-block";
          };
          dropzone.appendChild(btnRemover);
        }
      });
      
      contenedorParrafo.appendChild(dropzone);
      dropzoneIndex++;
    }
  });

  areaParrafo.appendChild(contenedorParrafo);
  contenedorJuego.appendChild(areaParrafo);

  // Crear área de palabras disponibles
  const areaPalabras = document.createElement("div");
  areaPalabras.classList.add("area-palabras");
  areaPalabras.innerHTML = "<h3>Palabras Disponibles:</h3>";
  
  const contenedorPalabras = document.createElement("div");
  contenedorPalabras.classList.add("contenedor-palabras");

  // Recolectar y mezclar todas las opciones
  const todasLasOpciones = [];
  parrafo.opciones.forEach(grupo => {
    todasLasOpciones.push(...grupo);
  });
  
  // Mezclar aleatoriamente
  todasLasOpciones.sort(() => Math.random() - 0.5);

  todasLasOpciones.forEach(opcion => {
    const item = document.createElement("div");
    item.classList.add("palabra-disponible");
    item.innerText = opcion;
    item.draggable = true;
    item.dataset.palabra = opcion;

    item.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text", opcion);
      e.target.classList.add("dragging");
    });
    
    item.addEventListener("dragend", e => {
      e.target.classList.remove("dragging");
    });

    contenedorPalabras.appendChild(item);
  });

  areaPalabras.appendChild(contenedorPalabras);
  contenedorJuego.appendChild(areaPalabras);

  crearBotonesAccion();
  actualizarInfo();
}

function verificar() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const parrafo = nivelActual.parrafos[indiceParrafo];

  const dropzones = document.querySelectorAll(".dropzone-parrafo");
  const respuestasUsuario = [];
  
  dropzones.forEach(zone => {
    if (zone.classList.contains("ocupado")) {
      // Obtener solo el texto, excluyendo el botón de remover
      const texto = zone.childNodes[0].textContent.trim();
      respuestasUsuario.push(texto);
    } else {
      respuestasUsuario.push("");
    }
  });

  // Verificar si todas las respuestas son correctas
  let todasCorrectas = true;
  let algunaVacia = false;

  for (let i = 0; i < parrafo.respuestas.length; i++) {
    if (respuestasUsuario[i] === "") {
      algunaVacia = true;
    } else if (respuestasUsuario[i] !== parrafo.respuestas[i]) {
      todasCorrectas = false;
    }
  }

  if (todasCorrectas && !algunaVacia) {
    document.getElementById("estado").innerHTML = `<div class="correcto">✅ ¡Excelente! Has completado el párrafo correctamente.</div>`;
    puntaje++;
    document.getElementById("btnSiguiente").classList.remove("oculto");
    
    // Animación de éxito en las dropzones
    dropzones.forEach(zone => {
      if (zone.classList.contains("ocupado")) {
        zone.style.animation = "successPulse 0.6s ease";
      }
    });
  } else if (algunaVacia) {
    document.getElementById("estado").innerHTML = `<div class="incorrecto">❌ Por favor completa todas las palabras faltantes.</div>`;
    crearBotonesAccion();
  } else {
    document.getElementById("estado").innerHTML = `<div class="incorrecto">❌ Algunas palabras no son correctas. Intenta de nuevo.</div>`;
    crearBotonesAccion();
    
    // Animación de error en dropzones incorrectas
    dropzones.forEach((zone, index) => {
      if (zone.classList.contains("ocupado")) {
        const textoZone = zone.childNodes[0].textContent.trim();
        if (textoZone !== parrafo.respuestas[index]) {
          zone.style.animation = "errorShake 0.5s ease";
        }
      }
    });
  }
  
  actualizarInfo();
}

function limpiar() {
  cargarParrafo();
}

function siguiente() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  if (indiceParrafo < nivelActual.parrafos.length - 1) {
    indiceParrafo++;
  } else if (indiceNivel < nivelesData.niveles.length - 1) {
    indiceNivel++;
    indiceParrafo = 0;
  } else {
    document.getElementById("estado").innerHTML =
      `<div class="correcto">🎉 ¡Felicitaciones! Has completado todos los párrafos del juego.</div>`;
    document.getElementById("btnSiguiente").classList.add("oculto");
    return;
  }
  cargarParrafo();
}

function crearBotonesAccion() {
  const contenedor = document.getElementById("estado");
  
  // Limpiar botones existentes si los hay
  const botonesExistentes = contenedor.querySelectorAll("button");
  botonesExistentes.forEach(btn => btn.remove());

  const containerBotones = document.createElement("div");
  containerBotones.style.marginTop = "15px";

  const btnVerificar = document.createElement("button");
  btnVerificar.innerHTML = "✓ Verificar Párrafo";
  btnVerificar.classList.add("btn-verificar");
  btnVerificar.onclick = verificar;

  const btnLimpiar = document.createElement("button");
  btnLimpiar.innerHTML = "🔄 Limpiar";
  btnLimpiar.classList.add("btn-limpiar");
  btnLimpiar.onclick = limpiar;

  containerBotones.appendChild(btnVerificar);
  containerBotones.appendChild(btnLimpiar);
  contenedor.appendChild(containerBotones);
}

function actualizarInfo() {
  document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
  document.getElementById("nivel").textContent =
    `Nivel ${nivelesData.niveles[indiceNivel].nivel_id} - Párrafo ${indiceParrafo + 1}`;
    
  // Animación del puntaje cuando cambia
  const puntajeEl = document.getElementById("puntaje");
  puntajeEl.classList.add("actualizado");
  setTimeout(() => puntajeEl.classList.remove("actualizado"), 600);
}

function reiniciarJuego() {
  iniciarJuego();
}

cargarDatosJuego();
window.siguiente = siguiente;
window.reiniciarJuego = reiniciarJuego;