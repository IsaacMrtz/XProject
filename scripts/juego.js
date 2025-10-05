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
    nivelesData = (await response.json()).primer.crearPalabras;
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
  
  const imagen = document.getElementById("imagen");
  const slots = document.getElementById("slots");
  const letras = document.getElementById("letras");
  const estado = document.getElementById("estado");
  const btnSiguiente = document.getElementById("btnSiguiente");

  imagen.innerHTML = `<img src="${palabraActual.img}" alt="Imagen">`;
  imagen.classList.add("show");
  slots.innerHTML = "";
  letras.innerHTML = "";
  estado.innerHTML = "";
  btnSiguiente.classList.add("oculto");

  palabraActual.palabra.split("").forEach(() => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slots.appendChild(slot);
  });

  palabraActual.palabra.split("")
    .sort(() => Math.random() - 0.5)
    .forEach(l => {
      const letra = document.createElement("div");
      letra.className = "letra";
      letra.textContent = l;
      letra.draggable = true;
      letra.addEventListener("dragstart", e => e.dataTransfer.setData("text", l));
      letras.appendChild(letra);
    });

  document.querySelectorAll(".slot").forEach((slot, idx) => {
    slot.addEventListener("dragover", e => e.preventDefault());
    slot.addEventListener("drop", e => {
      e.preventDefault();
      const letra = e.dataTransfer.getData("text");
      if (palabraActual.palabra[idx] === letra) {
        slot.textContent = letra;
        slot.classList.add("ocupado");
        let draggedLetter = [...document.querySelectorAll(".letra")].find(l => l.textContent === letra);
        if (draggedLetter) {
          draggedLetter.remove();
        }
        if ([...document.querySelectorAll(".slot")].every(s => s.classList.contains("ocupado"))) {
          estado.innerHTML = `<div class="felicitacion">¡Correcto, sigue así! 🎉</div>`;
          btnSiguiente.classList.remove("oculto");
          puntaje++;
          actualizarInfo();
        }
      } else {
        estado.innerHTML = `<div class="incorrecto">❌ Incorrecto. Reinicia e inténtalo de nuevo.</div>`;
      }
    });
  });

  actualizarInfo();
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
    // Mostrar mensaje final
    document.querySelector(".titulo-caja h1").textContent = "¡Juego Terminado! 🎊";
    document.querySelector(".descripcion").textContent =
      `Has completado todos los niveles con ${puntaje} puntos.`;
    document.getElementById("slots").innerHTML = "";
    document.getElementById("letras").innerHTML = "";
    document.getElementById("btnSiguiente").classList.add("oculto");

    // Mensaje visual de felicitación
    document.getElementById("imagen").innerHTML = `
      <div style="padding: 20px; background: linear-gradient(45deg, #10b981, #4b6cb7); 
                  border-radius: 15px; color: white; text-align: center;">
        <h2>🏆 ¡Felicitaciones! 🏆</h2>
        <p>Has completado todos los puzzles</p>
        <p><strong>Puntaje Final: ${puntaje} puntos</strong></p>
      </div>
    `;

    // 🕒 Espera unos segundos y regresa automáticamente
    setTimeout(() => {
      window.history.back(); // ← Regresa a la página anterior
    }, 4000); // 4 segundos de espera antes de regresar
  }
}


function reiniciarJuego() {
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