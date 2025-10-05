let nivelesData = null;
let indiceNivel = 0;
let indiceOracion = 0;
let puntaje = 0;

async function cargarDatosJuego() {
  try {
    const response = await fetch('../data/juegos.json');
    if (!response.ok) throw new Error('No se pudo cargar el archivo de datos del juego.');
    nivelesData = (await response.json()).tercero.ordenarOraciones;
    iniciarJuego();
  } catch (error) {
    console.error('Error al cargar los datos:', error);
    document.getElementById("estado").innerHTML =
      `<div class="incorrecto">¡Ups! Ocurrió un error cargando el juego.</div>`;
  }
}

function iniciarJuego() {
  indiceNivel = 0;
  indiceOracion = 0;
  puntaje = 0;
  cargarOracion();
}

function cargarOracion() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const oracionActual = nivelActual.oraciones[indiceOracion];

  const contenedorJuego = document.getElementById("letras");
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");

  contenedorJuego.innerHTML = "";
  estado.innerHTML = "";
  btnSiguiente.classList.add("oculto");

  // Crear el área de construcción de la oración
  const areaOracion = document.createElement("div");
  areaOracion.classList.add("area-oracion");
  areaOracion.innerHTML = "<h3>Forma la oración:</h3>";
  
  const zonaOracion = document.createElement("div");
  zonaOracion.classList.add("zona-oracion");
  zonaOracion.id = "zona-oracion";
  
  // Configurar zona de drop
  zonaOracion.addEventListener("dragover", (e) => {
    e.preventDefault();
    zonaOracion.classList.add("drag-over");
  });
  
  zonaOracion.addEventListener("dragleave", (e) => {
    if (!zonaOracion.contains(e.relatedTarget)) {
      zonaOracion.classList.remove("drag-over");
    }
  });
  
  zonaOracion.addEventListener("drop", (e) => {
    e.preventDefault();
    zonaOracion.classList.remove("drag-over");
    
    const palabraText = e.dataTransfer.getData("text");
    const palabraElement = document.querySelector(`[data-palabra="${palabraText}"]`);
    
    if (palabraElement && !palabraElement.classList.contains("en-oracion")) {
      const palabraEnOracion = palabraElement.cloneNode(true);
      palabraEnOracion.classList.add("en-oracion");
      palabraEnOracion.draggable = false;
      
      // Botón para remover palabra
      const btnRemover = document.createElement("button");
      btnRemover.innerHTML = "×";
      btnRemover.classList.add("btn-remover");
      btnRemover.onclick = () => {
        palabraEnOracion.remove();
        palabraElement.style.display = "inline-block";
      };
      
      palabraEnOracion.appendChild(btnRemover);
      zonaOracion.appendChild(palabraEnOracion);
      palabraElement.style.display = "none";
    }
  });
  
  areaOracion.appendChild(zonaOracion);
  contenedorJuego.appendChild(areaOracion);

  // Crear área de palabras disponibles
  const areaPalabras = document.createElement("div");
  areaPalabras.classList.add("area-palabras");
  areaPalabras.innerHTML = "<h3>Palabras Disponibles:</h3>";
  
  const contenedorPalabras = document.createElement("div");
  contenedorPalabras.classList.add("contenedor-palabras");

  let palabras = [...oracionActual.palabras].sort(() => Math.random() - 0.5);

  palabras.forEach((palabra) => {
    const span = document.createElement("span");
    span.classList.add("palabra-disponible");
    span.innerText = palabra;
    span.draggable = true;
    span.dataset.palabra = palabra;

    span.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text", palabra);
      e.target.classList.add("dragging");
    });

    span.addEventListener("dragend", (e) => {
      e.target.classList.remove("dragging");
    });

    contenedorPalabras.appendChild(span);
  });

  areaPalabras.appendChild(contenedorPalabras);
  contenedorJuego.appendChild(areaPalabras);

  crearBotonesAccion();
  actualizarInfo();
}

function verificar() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  const oracionActual = nivelActual.oraciones[indiceOracion];

  const zonaOracion = document.getElementById("zona-oracion");
  const palabrasEnOracion = [...zonaOracion.querySelectorAll(".en-oracion")]
    .map((span) => span.textContent.replace("×", "").trim());

  const respuesta = palabrasEnOracion.join(" ");

  if (respuesta === oracionActual.respuesta) {
    document.getElementById("estado").innerHTML = `<div class="correcto">✅ ¡Correcto!</div>`;
    puntaje++;
    document.getElementById("btnSiguiente").classList.remove("oculto");
  } else {
    document.getElementById("estado").innerHTML = `<div class="incorrecto">❌ Intenta de nuevo</div>`;
    crearBotonesAccion();
  }
  actualizarInfo();
}

function limpiar() {
  cargarOracion();
}

function siguiente() {
  const nivelActual = nivelesData.niveles[indiceNivel];
  if (indiceOracion < nivelActual.oraciones.length - 1) {
    indiceOracion++;
  } else if (indiceNivel < nivelesData.niveles.length - 1) {
    indiceNivel++;
    indiceOracion = 0;
  } else {
    document.getElementById("estado").innerHTML =
      `<div class="correcto">🎉 ¡Has completado todos los niveles!</div>`;
    document.getElementById("btnSiguiente").classList.add("oculto");
    return;
  }
  cargarOracion();
}

function crearBotonesAccion() {
  const contenedor = document.getElementById("estado");
  
  // Limpiar botones existentes si los hay
  const botonesExistentes = contenedor.querySelectorAll("button");
  botonesExistentes.forEach(btn => btn.remove());

  const btnVerificar = document.createElement("button");
  btnVerificar.innerHTML = "✓ Verificar Palabra";
  btnVerificar.classList.add("btn-verificar");
  btnVerificar.onclick = verificar;

  const btnLimpiar = document.createElement("button");
  btnLimpiar.innerHTML = "🔄 Limpiar";
  btnLimpiar.classList.add("btn-limpiar");
  btnLimpiar.onclick = limpiar;

  contenedor.appendChild(btnVerificar);
  contenedor.appendChild(btnLimpiar);
}

function actualizarInfo() {
  document.getElementById("puntaje").textContent = `Puntaje: ${puntaje}`;
  document.getElementById("nivel").textContent = 
    `Nivel ${nivelesData.niveles[indiceNivel].nivel_id} - Oración ${indiceOracion + 1}`;
}

function reiniciarJuego() {
  iniciarJuego();
}

cargarDatosJuego();
window.siguiente = siguiente;
window.reiniciarJuego = reiniciarJuego;