// public/js/orquestador.js
import { initEmotions, pauseEmotionDetection, resumeEmotionDetection } from '/resources/jsFace-Api/emocioness.js';
import { initAttention, pauseAttentionDetection, resumeAttentionDetection, stopAttentionDetection } from '/resources/mediapipe/postt.js';
import { iniciarReconocimiento, detenerReconocimiento } from '/resources/sentiment/analysis.js';
import { updateStat } from '/scripts/statsApi.js';
import { renderStats } from '/scripts/uiRender.js';

function personalizeMessage(msg) {
    const userName = window.appParams?.userName || window.appData?.userName || '';
    return userName ? msg.replace('{name}', userName) : msg.replace(', {name}', '').replace('{name}, ', '').replace('{name}', '');
}

// Función para que el avatar hable
function speakAvatarMessage(text) {
    if (!('speechSynthesis' in window)) return;
    
    // Cancelar cualquier mensaje anterior para evitar solapamiento
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.1;  // Voz ligeramente más aguda (amigable)
    utterance.rate = 0.95;  // Velocidad natural
    utterance.volume = 0.8; // No muy alto
    
    // Buscar voz femenina o infantil si está disponible
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(v => 
        v.lang.startsWith('es') && (v.name.includes('female') || v.name.includes('Mónica') || v.name.includes('Paulina'))
    ) || voices.find(v => v.lang.startsWith('es'));
    
    if (friendlyVoice) {
        utterance.voice = friendlyVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}
// --- VARIABLES GLOBALES ---

let letterProgress = {};
const DOMINANCE_THRESHOLD = 10; // Umbral de aciertos para considerar la letra "dominada"

let maleVoice = null;
let speedIndex = 0;
const speeds = [1.0, 0.7, 0.4];

window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    maleVoice = voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('male'));
    if (!maleVoice) {
        maleVoice = voices.find(voice => voice.lang === 'es-ES');
    }
};

function speakText(text, speed = 1.0, voice = null) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        if (voice) {
            utterance.voice = voice;
        }
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('SpeechSynthesis is not supported in this browser.');
    }
}
async function loadSVG(svgPath, containerId) {
    try {
        // La ruta ahora es relativa a la carpeta 'public'
        const fullPath = `/resources/svg/${svgPath}`; 
        const response = await fetch(fullPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const svgText = await response.text();
        document.getElementById(containerId).innerHTML = svgText;
    } catch (error) {
        console.error('Error al cargar el SVG:', error);
        document.getElementById(containerId).innerHTML = `<p>Error al cargar la animación.</p>`;
    }
}

function renderAvancePanel(letra, aciertos) {
    // Usamos el ID del aside de la plantilla actualizada
    const aside = document.getElementById('stats-aside-actividad'); 
    if (!aside) return; 

    // Encontrar o crear el contenedor específico para el progreso
    let progressContainer = aside.querySelector('.progress-cards');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.className = 'progress-cards';
        aside.appendChild(progressContainer);
    }
    
    // Encontrar o crear la tarjeta de la letra
    let card = progressContainer.querySelector(`.stat-card[data-letra="${letra}"]`);
    if (!card) {
        card = document.createElement('div');
        card.className = 'stat-card avance-letra';
        card.dataset.letra = letra;
        progressContainer.appendChild(card);
    }

    let statusHtml = '';
    
    // Lógica del "dominio" (Acierto > 10)
    if (aciertos >= DOMINANCE_THRESHOLD) {
        statusHtml = `<p class="dominada">¡Dominada! <i class="fas fa-check-circle"></i></p>`;
        // Usaremos card-0 como color de dominada
        card.className = 'stat-card avance-letra card-0'; 
    } else {
        statusHtml = `<p>Aciertos: ${aciertos}/${DOMINANCE_THRESHOLD}</p>
                      <div class="progress-bar"><div style="width: ${Math.min(100, (aciertos / DOMINANCE_THRESHOLD) * 100)}%;"></div></div>`;
        card.className = 'stat-card avance-letra'; // Limpiar la clase de color si no está dominada
    }

    card.innerHTML = `
        <h4 class="letra-avance">${letra.toUpperCase()}</h4>
        ${statusHtml}
    `;
}

// --- Lógica para la página de LETRAS (/basico) ---
function initBasicoPage() {
    console.log('Inicializando la página de exploración de letras...');
    
    const letterCards = document.querySelectorAll('.letter-card');
    const modal = document.getElementById('detalle-letra-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const btnReproducir = document.getElementById('btn-reproducir');

    // Almacenamos los datos de la letra actual para su uso en los eventos del modal
    let currentLetterData = {}; 

    // Lógica para abrir el modal
    letterCards.forEach(card => {
        card.addEventListener('click', () => {
            // Obtenemos todos los datos de la tarjeta
            const { letra, imagen, trazo, palabras } = card.dataset;
            currentLetterData = { letra, imagen, trazo, palabras: JSON.parse(palabras) };

            // Actualiza el contenido del modal con los datos
            document.getElementById('modal-letra').textContent = currentLetterData.letra;
            // La ruta de la imagen debe ser relativa a la carpeta de imágenes
            document.getElementById('modal-imagen').src = `/resources/images/${currentLetterData.imagen}`;
            document.getElementById('modal-palabras').textContent = `Palabras: ${currentLetterData.palabras.join(', ')}`;
            
            // Cargar y mostrar la animación SVG
            loadSVG(currentLetterData.trazo, 'modal-trazo');
            
            // Muestra el modal
            modal.style.display = 'flex';
        });
    });

    // Cierra el modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        // Opcional: limpiar el contenido del modal al cerrarlo
        document.getElementById('modal-trazo').innerHTML = '';
    });

    // Cierra el modal al hacer clic fuera del contenido
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.getElementById('modal-trazo').innerHTML = '';
        }
    };
    
    // Reproduce el sonido de la letra
    btnReproducir.addEventListener('click', () => {
        // Usa la variable almacenada para reproducir el sonido
        if (currentLetterData.letra) {
            speakText(currentLetterData.letra, speeds[speedIndex], maleVoice);
        }
    });

    // Esta función debe llamarse al cargar la página para inicializar los eventos
    // Ya que está en la parte superior del archivo, se ejecutará automáticamente.
}
// --- Lógica para la página de EJERCICIOS (/actividad) ---
function initActividadPage() {
    const { ejercicios, grado, basico } = window.appData; 
    const ejercicioContainer = document.getElementById('ejercicio-interactivo');
    let ejercicioActual = null;
    let respuestasCorrectas = 0;
    let respuestasIncorrectas = 0;
    let juegoActivo = true; // Nueva bandera para controlar el estado

    // ... (Tu lógica de carga inicial de letterProgress y renderAvancePanel) ...

    function shuffleArray(array) {
        // ... (Tu función shuffleArray sin cambios) ...
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function finalizarActividad() {
        juegoActivo = false;
        ejercicioContainer.innerHTML = `
            <h2>¡Ejercicio Finalizado!</h2>
            <p>Gracias por participar.</p>
            <p>Respuestas correctas: ${respuestasCorrectas}</p>
            <p>Respuestas incorrectas: ${respuestasIncorrectas}</p>
            <button onclick="window.location.href='/index2'">Volver al Inicio</button>
        `;
    }

    function mostrarSiguienteEjercicio() {
        if (ejercicios.length === 0 || !juegoActivo) {
            finalizarActividad();
            return;
        }

        const index = Math.floor(Math.random() * ejercicios.length);
        ejercicioActual = ejercicios[index];
        // Reiniciar la velocidad del sonido para el nuevo ejercicio
        speedIndex = 0; 

        ejercicioContainer.innerHTML = `
            <h3>Selecciona la letra tras escuchar:</h3>
            
            <div class="controles-actividad">
                <button id="btn-reproducir" class="boton-control">Volver a Oír Sonido</button>
                <button id="btn-finalizar" class="boton-control finalizar">Finalizar Ejercicio</button>
            </div>

            <div class="opciones"></div>
        `;

        const opcionesContainer = ejercicioContainer.querySelector('.opciones');
        const todasLasOpciones = [...ejercicios].map(e => e.letra);
        const opcionesAleatorias = shuffleArray(todasLasOpciones).slice(0, 4);
        
        if (!opcionesAleatorias.includes(ejercicioActual.letra)) {
            opcionesAleatorias[Math.floor(Math.random() * 4)] = ejercicioActual.letra;
        }

        opcionesAleatorias.forEach(letra => {
            const btn = document.createElement('button');
            btn.innerText = letra;
            btn.addEventListener('click', () => verificarRespuesta(letra));
            opcionesContainer.appendChild(btn);
        });

        // 1. Reproducir el sonido automáticamente al inicio
        speakText(ejercicioActual.letra, speeds[speedIndex], maleVoice);

        // 2. Manejar el botón "Volver a Oír Sonido"
        const btnReproducir = document.getElementById('btn-reproducir');
        btnReproducir.addEventListener('click', () => {
            // Alterna la velocidad al hacer clic en el botón (o la deja en la primera velocidad)
            speedIndex = (speedIndex + 1) % speeds.length; 
            speakText(ejercicioActual.letra, speeds[speedIndex], maleVoice);
        });

        // 3. Manejar el botón "Finalizar Ejercicio"
        document.getElementById('btn-finalizar').addEventListener('click', finalizarActividad);

        // Eliminar el manejo de clics en el contenedor que antes reproducía el sonido
        ejercicioContainer.onclick = null; 
    }


    async function verificarRespuesta(respuesta) {
        if (!juegoActivo) return; // Si ya se finalizó, ignorar clics

        // Deshabilitar botones de opciones para evitar dobles clics
        ejercicioContainer.querySelectorAll('.opciones button').forEach(btn => btn.disabled = true);
        
        // ... (El resto de tu lógica de feedback y actualización de stats) ...
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-mensaje';
        
        if (respuesta === ejercicioActual.letra) {
            // ... (Tu lógica para acierto con updateStat) ...
            feedbackDiv.innerText = ejercicioActual.feedback.success;
            // ... (Lógica de actualización de stats y renderAvancePanel) ...
            const letraActual = ejercicioActual.letra;
            letterProgress[letraActual] = (letterProgress[letraActual] || 0) + 1;
            
            try {
                await updateStat('acierto_letra', 1, letraActual, grado, basico);
            } catch (err) {
                console.error('Error al registrar acierto:', err);
            }
            
            renderAvancePanel(letraActual, letterProgress[letraActual]);
            respuestasCorrectas++;

        } else {
            // ... (Tu lógica para error) ...
            feedbackDiv.innerText = ejercicioActual.feedback.error;
            respuestasIncorrectas++;
        }
        
        ejercicioContainer.appendChild(feedbackDiv);
        
        setTimeout(() => {
            feedbackDiv.remove();
            mostrarSiguienteEjercicio();
        }, 2000);
    }

    // Inicia el primer ejercicio
    mostrarSiguienteEjercicio();
}


// --- MAIN ORCHESTRATOR LOGIC ---
window.addEventListener('DOMContentLoaded', async () => {
    // 0) Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const grado = params.get('grado');
    const basicoNivel = params.get('basico');
    const lecturaId = params.get('id');

    // 1) Get initial stats
    let stats = { ...window.appStats };
    renderStats(stats);
    
// Función principal para renderizar nivel 2
if (window.appData && window.appData.nivel2) {
  const { titulo, instrucciones, bloques } = window.appData.nivel2;

  const contenedorActividad = document.getElementById('actividad-nivel2');
  if (!contenedorActividad) return;

  // Renderiza título e instrucciones
  contenedorActividad.innerHTML = `
    <div id="bloques-silabas" class="bloques-silabas"></div>
  `;

  const bloquesContainer = document.getElementById('bloques-silabas');

  bloques.forEach(bloque => {
    const bloqueDiv = document.createElement('div');
    bloqueDiv.className = 'bloque-silabas';
    bloqueDiv.innerHTML = `<h3>Bloque ${bloque.consonante}</h3>`;

    const silabasGrid = document.createElement('div');
    silabasGrid.className = 'cuadricula-de-silabas';

    // Contador para rotar colores como en las letras
    bloque.silabas.forEach((silaba, idx) => {
      const card = document.createElement('div');
      card.className = `silaba-card card-${idx % 4}`; // Rotación de colores
      card.setAttribute('data-silaba', silaba.texto);
      card.setAttribute('data-imagen', `/resources/images/${silaba.imagen}`);
      card.setAttribute('data-palabra', silaba.palabra);
      
      card.innerHTML = `
        <span class="silaba-texto">${silaba.texto.toUpperCase()}</span>
        <button class="btn-silaba" data-silaba="${silaba.texto}">🔊</button>
      `;
      silabasGrid.appendChild(card);
    });
    
    console.log('Bloques renderizados:', bloques.length);

    bloqueDiv.appendChild(silabasGrid);
    bloquesContainer.appendChild(bloqueDiv);
  });

  // Definir audioFallbacks dentro del scope
const audioFallbacks = {
  ba: '/resources/media/ba.ogg',
  be: '/resources/media/be.ogg',
  bi: '/resources/media/bi.ogg',
  bo: '/resources/media/bo.ogg',
  co: '/resources/media/co.ogg',
  cu: '/resources/media/cu.ogg',
  ga: '/resources/media/ga.ogg',
  go: '/resources/media/go.ogg',
  gu: '/resources/media/gu.ogg',
  ho: '/resources/media/ho.ogg',
  je: '/resources/media/je.ogg',
  ju: '/resources/media/ju.ogg',
  ne: '/resources/media/ne.ogg',
  ra: '/resources/media/ra.ogg',
  ru: '/resources/media/ru.ogg',
  to: '/resources/media/to.ogg',
  vo: '/resources/media/vo.ogg',
  vu: '/resources/media/vu.ogg',
  za: '/resources/media/za.ogg',
  zo: '/resources/media/zo.ogg'
};



  // Event listener para las sílabas - incluye tanto reproducción como modal
  bloquesContainer.addEventListener('click', e => {
    // Si se hace clic en el botón de sílaba, solo reproducir audio
    if (e.target.classList.contains('btn-silaba')) {
      e.stopPropagation(); // Evitar que se abra el modal
      const silaba = e.target.dataset.silaba;

      // Usar audioFallbacks si está disponible, sino usar Speech Synthesis
      if (audioFallbacks[silaba]) {
        const audio = new Audio(audioFallbacks[silaba]);
        audio.play();
      } else {
        reproducirTexto(silaba);
      }
      return;
    }
    
    // Si se hace clic en la tarjeta completa, abrir modal
    const card = e.target.closest('.silaba-card');
    if (card) {
      abrirModalSilaba(card);
    }
  });

  // Configurar el modal
  configurarModal();
}

// Función para reproducir texto usando Speech Synthesis
function reproducirTexto(texto) {
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'es-ES';
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}

// Función para abrir el modal con los detalles de la sílaba
function abrirModalSilaba(card) {
  const modal = document.getElementById('detalle-silaba-modal');
  const modalSilaba = document.getElementById('modal-silaba');
  const modalImagen = document.getElementById('modal-imagen');
  const modalPalabra = document.getElementById('modal-palabra');
  const modalSilabaDisplay = document.getElementById('modal-silaba-display');
  
  const silaba = card.getAttribute('data-silaba');
  const imagen = card.getAttribute('data-imagen');
  const palabra = card.getAttribute('data-palabra');
  
  // Rellenar el modal con los datos
  modalSilaba.textContent = silaba.toUpperCase();
  modalImagen.src = imagen;
  modalImagen.alt = `Imagen de ${palabra}`;
  modalPalabra.textContent = `Palabra ejemplo: ${palabra}`;
  modalSilabaDisplay.innerHTML = `
    <div style="font-size: 3rem; font-weight: bold; color: var(--color-primary); text-align: center;">
      ${silaba.toUpperCase()}
    </div>
  `;
  
  // Mostrar el modal
  modal.style.display = 'block';
  
  // Configurar el botón de reproducir en el modal
  const btnReproducir = document.getElementById('btn-reproducir');
  btnReproducir.onclick = () => reproducirTexto(silaba);
}

// Función para configurar los event listeners del modal
function configurarModal() {
  const modal = document.getElementById('detalle-silaba-modal');
  const closeBtn = document.querySelector('.close-btn');
  
  // Cerrar modal con el botón X
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }
  
  // Cerrar modal al hacer clic fuera de él
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Cerrar modal con la tecla Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
}

    // 2) Initialize the correct basic view
    if (basicoNivel) {
        if (window.location.pathname === '/actividad') {
            initActividadPage();
        } else if (window.location.pathname === '/basico') {
            initBasicoPage();
        }
        return; // Stop here to prevent the main flow from running
    }

    // --- Main Reading/Game Flow (only runs if no 'basico' param) ---

    // 3) DOM refs
    const videoEl = document.getElementById('video');
    const titleEl = document.getElementById('itemTitle');
    const textEl = document.getElementById('itemText');
    const transcriptionEl = document.getElementById('transcription');
    const completedEl = document.getElementById('completed');
    const btnSpeak = document.getElementById('btnSpeak');
    const btnNext = document.getElementById('btnNext');
    const btnBack = document.querySelector('.btn-back');
    const avatarContainer = document.getElementById('avatar-container');
    const avatarBubble = document.getElementById('avatar-bubble');

// Event listener para clic en el avatar
if (avatarContainer) {
    avatarContainer.addEventListener('click', () => {
        console.log('🖱️ Clic en avatar, clickeable:', avatarClickable);
        
        if (avatarClickable) {
            // Obtener parámetros actuales
            const grado = window.appParams?.grado || params.get('grado') || '1';
            
            console.log('🎮 Redirigiendo a juegos con grado:', grado);
            
            // Redirigir a la página de juegos con los parámetros
            window.location.href = `/game?grado=${window.appParams.grado}`;
        } else {
            console.log('⚠️ Avatar no es clickeable en este momento');
        }
    });
    console.log('✅ Event listener del avatar registrado');
} else {
    console.error('❌ avatarContainer no encontrado en el DOM');
}    

// 4) Avatar state and messages
let avatarState = {
    hasWelcomed: false,
    lastMessageTime: 0,
    distractedStartTime: null
};

const MESSAGE_COOLDOWN = 10000;
const DISTRACTED_THRESHOLD = 5000;

// Mensajes mejorados con placeholders para el nombre
const avatarMsgs = {
    welcome: [
        '¡Hola{name}! ¡Vamos a leer juntos!', 
        '¡Bienvenido{name}! ¿Listo para aprender?', 
        '¡Hola{name}! ¡Comencemos esta aventura!'
    ],
    happy: [
        '¡Lo haces genial{name}!', 
        '¡Excelente trabajo{name}!', 
        '¡Sigue así{name}, vas muy bien!',
        '¡Me encanta tu entusiasmo{name}!'
    ],
    neutral: [
        // Índice 0-3: NO clickeables (solo animan)
       
        'Vas muy bien{name}.', 
        'Sigue concentrado{name}.',
        
        
        // Índice 4-5: SÍ clickeables (ofrecen juegos)
        '¿Quieres tomar un respiro{name}? Toca aquí.',
        'Si necesitas un cambio{name}, toca aquí para jugar.'
    ],
    distracted: [
        // Índice 0-3: TODOS clickeables
        '¿Te aburres{name}? Toca aquí para jugar.', 
        'Un jueguito te anima{name}.', 
        '¿Necesitas un descanso{name}?',
        '¡Hey{name}! ¿Qué tal un juego?'
    ],
    encouragement: [
        '¡Tú puedes{name}!',
        '¡Ánimo{name}!',
        '¡Sigue intentando{name}!'
    ]
};

const clickeableMessages = {
    neutral: [2, 3],            // Los últimos 2 mensajes (ahora son índices 2 y 3)
    distracted: [0, 1, 2, 3]    // TODOS los mensajes de distracted
};

let avatarClickable = false;

// Sistema de coordinación de recursos
const resourceManager = {
    emotionsActive: false,
    attentionActive: false,
    speechActive: false,
    
    pauseVisualDetections() {
        if (this.emotionsActive) pauseEmotionDetection();
        if (this.attentionActive) pauseAttentionDetection();
        console.log('⏸️ Detecciones visuales pausadas');
    },
    
    resumeVisualDetections() {
        if (this.emotionsActive) resumeEmotionDetection();
        if (this.attentionActive) resumeAttentionDetection();
        console.log('▶️ Detecciones visuales reanudadas');
    }
};

        


// 3) REEMPLAZAR la función showAvatar con esta versión mejorada:
// Función mejorada para mostrar el avatar
function showAvatar(messageList, isDistracted = false, options = {}) {
    if (!avatarContainer) return;
    
    const now = Date.now();
    
    // Permitir ignorar el cooldown si se especifica
    if (!options.ignoreCooldown && now - avatarState.lastMessageTime < MESSAGE_COOLDOWN) {
        return;
    }
    
    // Seleccionar y personalizar mensaje
    const messageIndex = Math.floor(Math.random() * messageList.length);
    const rawMsg = messageList[messageIndex];
    const msg = personalizeMessage(rawMsg);
    
    console.log(`Avatar mostrando: "${msg}" (índice: ${messageIndex}, categoría: ${options.category})`);
    
    // Mostrar mensaje en el globo
    avatarBubble.innerText = msg;
    avatarContainer.hidden = false;
    
    // Hacer que el avatar hable (solo si no está deshabilitado)
    if (!options.silent) {
        speakAvatarMessage(msg);
        
        // Añadir animación mientras habla
        avatarContainer.classList.add('talking');
        setTimeout(() => {
            avatarContainer.classList.remove('talking');
        }, 1500);
    }
    
    // Determinar si el mensaje específico debe hacer clickeable al avatar
    const messageCategory = options.category || 'unknown';
    const shouldBeClickable = isDistracted || 
                             (clickeableMessages[messageCategory] && 
                              clickeableMessages[messageCategory].includes(messageIndex));
    
    console.log(`¿Clickeable?: ${shouldBeClickable} (isDistracted: ${isDistracted}, category: ${messageCategory}, index: ${messageIndex})`);
    
    // Configurar si es clickeable
    avatarClickable = shouldBeClickable;
    if (shouldBeClickable) {
        avatarContainer.classList.add('clickable');
        avatarContainer.style.cursor = 'pointer';
        // Añadir efecto de pulso para llamar la atención
        avatarContainer.classList.add('pulse');
        console.log('✅ Avatar es CLICKEABLE');
    } else {
        avatarContainer.classList.remove('clickable', 'pulse');
        avatarContainer.style.cursor = 'default';
        console.log('❌ Avatar NO es clickeable');
    }
    
    // Timer para ocultar el avatar
    clearTimeout(avatarContainer._hideTimer);
    avatarContainer._hideTimer = setTimeout(() => {
        avatarContainer.hidden = true;
        avatarClickable = false;
        avatarContainer.classList.remove('clickable', 'pulse');
    }, 5000);
    
    avatarState.lastMessageTime = now;
}
// Event listener para clic en el avatar (agregar después de showAvatar)


    // 5) Load content
    const dataRaw = await fetch('/data/contenidos.json').then(r => r.json());
    let lecturas = dataRaw[grado]?.lecturas || [];
    const juegos = dataRaw[grado]?.juegos || [];

    if (lecturaId) {
        lecturas = lecturas.filter(l => l.id === lecturaId);
        if (!lecturas.length) {
            titleEl.innerText = 'Lectura no encontrada';
            return;
        }
    }

    // 6) Navigation state
    let lectureIndex = 0;
    let gameIndex = 0;
    let currentMode = 'lectura';

    // 7) Word preparation for speech
    let originalWords = [];
    let matchedWordsSet = new Set();
    const prepareOriginalWords = text =>
        text.toLowerCase()
        .replace(/[.,;!?¿¡]/g, '')
        .split(/\s+/)
        .filter(Boolean);

    // 8) Display functions
    function showLecture(i) {
        const { titulo, texto, imagen, dificultad } = lecturas[i];
        const imgEl = document.getElementById('reading-img');
        if (imgEl) {
            if (imagen) {
                imgEl.src = `/resources/images/${imagen}`;
                imgEl.style.display = '';
            } else {
                imgEl.style.display = 'none';
            }
        }
        titleEl.innerText = titulo;
        textEl.innerText = texto;
        originalWords = prepareOriginalWords(texto);
        matchedWordsSet.clear();
        transcriptionEl.innerText = '';
        completedEl.style.display = 'none';
        btnNext.style.display = 'none';
        const diffCard = document.querySelector('.stats-aside .stat-card:last-child');
        if (diffCard) {
            diffCard.innerHTML = `⭐ Dificultad: ${dificultad || 'Media'}`;
        }
    }

    function showGame(i) {
        const { titulo } = juegos[i];
        titleEl.innerText = titulo;
        textEl.innerText = '';
        originalWords = [];
        matchedWordsSet.clear();
        transcriptionEl.innerText = '';
        completedEl.hidden = true;
        btnNext.hidden = true;
    }

    function adaptTo(mode) {
        currentMode = mode;
        if (mode === 'juego') showGame(gameIndex);
        else showLecture(lectureIndex);
    }

    
const history = { emotion: [], attention: [] };

window.addEventListener('emotionDetected', e => {
    if (currentMode !== 'lectura') return;
    const emotion = e.detail;
    
    if (emotion === 'happy') {
        showAvatar(avatarMsgs.happy, false, { category: 'happy' });
    } else if (emotion === 'neutral') {
        // CORREGIDO: Ahora pasa la categoría
        showAvatar(avatarMsgs.neutral, false, { category: 'neutral' });
    }
});

window.addEventListener('attentionDetected', e => {
    if (currentMode !== 'lectura') return;
    const attentionState = e.detail;
    const now = Date.now();
    
    if (attentionState === 'distraído') {
        if (!avatarState.distractedStartTime) {
            avatarState.distractedStartTime = now;
        } else if (now - avatarState.distractedStartTime >= DISTRACTED_THRESHOLD) {
            // CORREGIDO: Ahora pasa la categoría
            showAvatar(avatarMsgs.distracted, true, { category: 'distracted' });
        }
    } else {
        avatarState.distractedStartTime = null;
    }
});

    // 10) Initialize sensors
    await initEmotions(videoEl, 2000); // 2 segundos entre análisis
        initAttention(videoEl);
        resourceManager.emotionsActive = true;
        resourceManager.attentionActive = true;

    setTimeout(() => {
    if (!avatarState.hasWelcomed) {
        showAvatar(avatarMsgs.welcome, false, { ignoreCooldown: true });
        avatarState.hasWelcomed = true;
    }
    }, 2000); // Esperar 2 segundos después de cargar  
    
    let encouragementInterval = setInterval(() => {
    if (currentMode === 'lectura' && !resourceManager.speechActive) {
        showAvatar(avatarMsgs.encouragement);
    }
    }, 120000); // 2 minutos

    // Limpiar interval al salir
    window.addEventListener('beforeunload', () => {
        clearInterval(encouragementInterval);
        detenerReconocimiento();
        stopAttentionDetection();
        if (videoEl && videoEl.srcObject) {
            videoEl.srcObject.getTracks().forEach(track => track.stop());
        }
    });

        // 4. AGREGAR event listeners para coordinar recursos (después de initAttention)
    window.addEventListener('speechStarted', () => {
    resourceManager.speechActive = true;
    resourceManager.pauseVisualDetections();
    });

    window.addEventListener('speechEnded', () => {
    resourceManager.speechActive = false;
    // Esperar 1 segundo antes de reanudar para dar respiro al sistema
    setTimeout(() => {
        resourceManager.resumeVisualDetections();
    }, 1000);
    });    


    // 11) Event Listeners
if (btnSpeak) {
  btnSpeak.addEventListener('click', () => {
    if (!avatarState.hasWelcomed) {
      showAvatar(avatarMsgs.welcome);
      avatarState.hasWelcomed = true;
    }
    
    // Verificar si ya está activo
    if (resourceManager.speechActive) {
      console.warn('⚠️ Reconocimiento de voz ya activo');
      return;
    }
    
    window.dispatchEvent(new Event('startSpeech'));
  });
}

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.history.back();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentMode === 'lectura') {
                if (lectureIndex < lecturas.length - 1) {
                    lectureIndex++;
                    showLecture(lectureIndex);
                }
            } else {
                gameIndex = (gameIndex + 1) % juegos.length;
                adaptTo(currentMode);
            }
        });
    }

    window.addEventListener('startSpeech', () => iniciarReconocimiento());

    window.addEventListener('speechResult', e => {
        const words = e.detail
            .toLowerCase()
            .replace(/[.,;!?¿¡]/g, '')
            .split(/\s+/)
            .filter(Boolean);
        const filtered = words.filter(w => originalWords.includes(w));
        transcriptionEl.innerText = filtered.join(' ');
        filtered.forEach(w => matchedWordsSet.add(w));
    });

    // 7. MODIFICAR readingComplete para limpiar recursos
    window.addEventListener('readingComplete', async () => {
    const matchesCount = matchedWordsSet.size;
    const totalCount = originalWords.length || 1;
    const percent = Math.round((matchesCount / totalCount) * 100);

    completedEl.innerText = `¡Completado! Precisión: ${percent}%`;
    completedEl.hidden = false;
    btnNext.hidden = false;

    if (completedEl) completedEl.style.display = 'block';
    if (btnNext) btnNext.style.display = 'inline-block';

    const elmWordMatched = document.getElementById('word-matched');
    if (elmWordMatched) elmWordMatched.innerText = matchesCount;

    // Detener reconocimiento de voz explícitamente
    detenerReconocimiento();

    try {
        const { updatedStats } = await updateStat('lecturas_leidas', 1, lecturaId, grado);
        stats = updatedStats;
        renderStats(stats);
    } catch (err) {
        console.error('Error actualizando lecturas:', err);
    }
    });

    // 9. OPTIMIZACIÓN ADICIONAL: Detectar bajo rendimiento
    let frameDropCount = 0;
    let lastFrameTime = Date.now();

    function monitorPerformance() {
    const now = Date.now();
    const delta = now - lastFrameTime;
    
    // Si pasan más de 2 segundos entre frames, es posible que el sistema esté sobrecargado
    if (delta > 2000) {
        frameDropCount++;
        
        // Si hay más de 3 frames perdidos, aumentar intervalo de detección
        if (frameDropCount > 3) {
        console.warn('⚠️ Rendimiento bajo detectado. Reduciendo frecuencia de análisis.');
        // Aquí podrías aumentar dinámicamente los intervalos
        }
    } else {
        frameDropCount = Math.max(0, frameDropCount - 1);
    }
    
    lastFrameTime = now;
    requestAnimationFrame(monitorPerformance);
    }

    // Iniciar monitor solo en móviles
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    monitorPerformance();
    }

    // 13) Game complete -> Stats
    window.addEventListener('gameComplete', async () => {
        try {
            const { updatedStats } = await updateStat('juegos_jugados', 1);
            stats = updatedStats;
            renderStats(stats);
        } catch (err) {
            console.error('Error actualizando juegos:', err);
        }
    });

    // 14) Initial call to start the main flow
    adaptTo('lectura');

    // Detecta si estamos en nivel 2

});


