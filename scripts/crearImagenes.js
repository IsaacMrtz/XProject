let nivelActual = 0;
let puntaje = 0;
let niveles = [];

async function cargarJuego() {
  try {
    const res = await fetch('../data/juegos.json');
    const data = await res.json();
    
    // Tomamos solo el juego de imágenes
    niveles = data.primer.crearImagenes.niveles;
    mostrarNivel();
  } catch (error) {
    console.error("Error cargando JSON:", error);
  }
}

function mostrarNivel() {
  const juego = niveles[nivelActual];
  if (!juego) return;

  document.querySelector(".titulo-caja h1").textContent = juego.titulo;
  document.querySelector(".descripcion").textContent = juego.descripcion;

  const slots = document.getElementById("slots");
  slots.innerHTML = "";
  const piezasContainer = document.getElementById("letras");
  piezasContainer.innerHTML = "";

  // Crear slots
  for (let i = 0; i < juego.piezas.length; i++) {
    const slot = document.createElement("div");
    slot.classList.add("slot");
    slot.dataset.index = i;
    slot.ondrop = soltar;
    slot.ondragover = permitirSoltar;
    slot.ondragenter = entrarArrastre;
    slot.ondragleave = salirArrastre;
    slots.appendChild(slot);
  }

  // Mezclar piezas
  const piezasMezcladas = [...juego.piezas].sort(() => Math.random() - 0.5);

  // Crear piezas arrastrables
  piezasMezcladas.forEach((src, i) => {
    const pieza = document.createElement("img");
    pieza.src = src;
    pieza.draggable = true;
    pieza.classList.add("pieza-imagen"); // ¡Clase específica para imágenes!
    pieza.dataset.index = juego.piezas.indexOf(src); // índice correcto
    pieza.ondragstart = arrastrar;
    pieza.ondragend = terminarArrastre;
    piezasContainer.appendChild(pieza);
  });

  document.getElementById("estado").textContent = "";
  document.getElementById("btnSiguiente").classList.add("oculto");
  
  // Limpiar imagen anterior
  document.getElementById("imagen").innerHTML = "";
}

function arrastrar(ev) {
  ev.dataTransfer.setData("pieza", ev.target.dataset.index);
  ev.dataTransfer.setData("src", ev.target.src);
  ev.target.style.opacity = "0.5";
}

function terminarArrastre(ev) {
  ev.target.style.opacity = "1";
}

function permitirSoltar(ev) {
  ev.preventDefault();
}

function entrarArrastre(ev) {
  ev.preventDefault();
  ev.target.classList.add("drag-over");
}

function salirArrastre(ev) {
  ev.target.classList.remove("drag-over");
}

function soltar(ev) {
  ev.preventDefault();
  ev.target.classList.remove("drag-over");
  
  const indexPieza = ev.dataTransfer.getData("pieza");
  const src = ev.dataTransfer.getData("src");

  // Solo permitir si el slot está vacío
  if (!ev.target.hasChildNodes() || ev.target.children.length === 0) {
    // Limpiar slot por si acaso
    ev.target.innerHTML = "";
    
    const img = document.createElement("img");
    img.src = src;
    ev.target.appendChild(img);
    ev.target.dataset.pieza = indexPieza;
    ev.target.classList.add("filled");
    
    // Remover la pieza original del contenedor
    const piezaOriginal = document.querySelector(`[data-index="${indexPieza}"].pieza-imagen`);
    if (piezaOriginal) {
      piezaOriginal.remove();
    }
  }

  verificar();
}

function verificar() {
  const slots = document.querySelectorAll(".slot");
  const juego = niveles[nivelActual];

  let correcto = true;
  let completados = 0;
  
  slots.forEach((slot, i) => {
    if (slot.dataset.pieza != undefined) {
      completados++;
      if (slot.dataset.pieza != i) {
        correcto = false;
      }
    } else {
      correcto = false;
    }
  });

  // Solo verificar si todas las piezas están colocadas
  if (completados === juego.piezas.length && correcto) {
    document.getElementById("estado").textContent = "¡Correcto! 🎉";
    document.getElementById("estado").style.color = "#10b981";
    document.getElementById("estado").style.fontSize = "1.5em";
    document.getElementById("estado").style.fontWeight = "bold";
    
    puntaje += 10;
    document.getElementById("puntaje").textContent = "Puntaje: " + puntaje;

    // Mostrar imagen completa con animación
    setTimeout(() => {
      document.getElementById("imagen").innerHTML =
        `<img src="${juego.imagenCompleta}" style="max-width:100%; border-radius:12px;">`;
      document.getElementById("btnSiguiente").classList.remove("oculto");
    }, 500);
  } else if (completados === juego.piezas.length && !correcto) {
    document.getElementById("estado").textContent = "¡Casi! Revisa el orden 🤔";
    document.getElementById("estado").style.color = "#ff9800";
  }
}

function siguiente() {
  nivelActual++;
  document.getElementById("nivel").textContent = `Nivel ${nivelActual + 1}`;
  
  if (nivelActual < niveles.length) {
    mostrarNivel();
  } else {
    document.querySelector(".titulo-caja h1").textContent = "¡Juego Terminado! 🎊";
    document.querySelector(".descripcion").textContent =
      `Has completado todos los niveles con ${puntaje} puntos.`;
    document.getElementById("slots").innerHTML = "";
    document.getElementById("letras").innerHTML = "";
    document.getElementById("btnSiguiente").classList.add("oculto");
    
    // Mostrar mensaje de felicitación
    document.getElementById("imagen").innerHTML = `
      <div style="padding: 20px; background: linear-gradient(45deg, #10b981, #4b6cb7); 
                  border-radius: 15px; color: white; text-align: center;">
        <h2>🏆 ¡Felicitaciones! 🏆</h2>
        <p>Has completado todos los puzzles</p>
        <p><strong>Puntaje Final: ${puntaje} puntos</strong></p>
      </div>
    `;
  }
}

function reiniciarJuego() {
  nivelActual = 0;
  puntaje = 0;
  document.getElementById("puntaje").textContent = "Puntaje: 0";
  document.getElementById("nivel").textContent = "Nivel 1";
  document.getElementById("estado").textContent = "";
  mostrarNivel();
}

// Inicializar el juego
cargarJuego();