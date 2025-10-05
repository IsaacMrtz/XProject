// controller/pageController.js
import fs from 'fs/promises';
import path from 'path';
import Stats from '../scripts/Stats.js';
import { fileURLToPath } from 'url';
// controller/pageController.js o maestroController.js
import { User, SilabasProgress } from '../scripts/asociaciones.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);


let contenidosData;
async function loadContenidos() {
    try {
        const rawData = await fs.readFile(path.join(__dirname, '../data/contenidos.json'), 'utf8');
        contenidosData = JSON.parse(rawData);
    } catch (err) {
        console.error('Error al cargar contenidos.json:', err);
    }
}
loadContenidos();

const gradosValidos = ['primer', 'segundo', 'tercero'];

const defaultTipoPorGrado = {
  primer: "crearPalabras",
  segundo: "ordenarSilabas",
  tercero: "ordenarOraciones"
};

export async function juegoPorTipo(req, res) {
  const grado = req.query.grado || 'primer';
  const tipo = req.query.tipo || defaultTipoPorGrado[grado];

  // Validación básica
  if (!gradosValidos.includes(grado)) {
    return res.status(400).send(`Grado inválido: "${grado}"`);
  }

  try {
    // 📂 Cargar dinámicamente el JSON
    const raw = await fs.readFile(
      path.join(__dirname, '../data/juegos.json'),
      'utf-8'
    );
    const juegos = JSON.parse(raw);

    const juegoData = juegos[grado]?.[tipo];
    if (!juegoData) {
      return res.status(404).send(`Juego "${tipo}" no encontrado para grado "${grado}"`);
    }

    // Selección de plantilla según el grado
    const plantillaPorGrado = {
      primer: 'gameF1',
      segundo: 'gameF2',
      tercero: 'gameF3'
    };

    const vista = plantillaPorGrado[grado];
    if (!vista) {
      return res.status(404).send("Plantilla no disponible para este grado");
    }

    // ✅ Renderizado
    return res.render(vista, {
      data: juegoData,
      script: juegoData.script,
      nombre: req.session?.name || 'Estudiante',
      tipo,
      grado
    });

  } catch (err) {
    console.error('🔥 Error en juegoPorTipo():', err);
    return res.status(500).send(`Error interno: ${err.message}`);
  }
}


// Handler login
export function login(req, res) {
  res.render('login', { alert: false });
}

// Handler register
export function register(req, res) {
  res.render('register', { alert: false });
}

// Lista de niveles
export function levels(req, res) {
  res.render('levels', { title: "Niveles de Estudio" });
}

// Página de matemática
export function matematica(req, res) {
  res.render('matematica', { title: "Matemáticas" });
}

// Emotions view
export function emotions(req, res) {
  res.render('emotions', { title: "emociones jaja" });
}

// htmlD view
export function htmlD(req, res) {
  res.render('htmlD', { title: "emociones jaja" });
}





// Layout principal

export async function layout(req, res) {
  const { grado = '', id = '' } = req.query;
  const userId = req.session.userId;

  try {
    // 1) Carga y parsea tu JSON
    const raw = await fs.readFile(path.join(__dirname, '../data/contenidos.json'), 'utf-8');
    const contenido = JSON.parse(raw)[grado];
    if (!contenido) return res.status(404).send("Grado no encontrado");

    const allItems = contenido.lecturas; // array completo

    // 2) Filtra según query.id (si llega)
    const lecturas = id
      ? allItems.filter(item => item.id === id)
      : allItems;

    if (id && lecturas.length === 0) {
      return res.status(404).send("Lectura no encontrada");
    }

    // 3) Determina el currentItem
    const currentItem = id
      ? allItems.find(item => item.id === id)
      : allItems[0];

    // 4) Stats desde la base de datos
    // Usa findOrCreate con `id_usuario` y `grado` para crear o encontrar el registro correcto
    const [dbStats] = await Stats.findOrCreate({
      where: { id_usuario: userId, grado: grado },
      defaults: {
        id_usuario: userId,
        grado: grado,
        total_lecturas: allItems.length,
      },
    });

    const stats = {
      lecturasLeidas: dbStats.lecturas_leidas,
      totalLecturas: dbStats.total_lecturas,
      juegosJugados: dbStats.juegos_jugados,
      nivelActual: dbStats.nivel_actual,
      desafiosActivos: dbStats.desafios_activos
    };

    // 5) Renderiza, incluyendo ahora `currentItem`
    return res.render('layout', {
      title: `Lectura – ${grado[0].toUpperCase() + grado.slice(1)}`,
      grado,
      id,
      lecturas,
      currentItem,
      stats
    });
  } catch (err) {
    console.error('🔥 Error en layout():', err);
    return res.status(500).send(`Error interno: ${err.message}`);
  }
}



// Carga un nivel desde niveles.json
export async function nivel(req, res) {
  const grado = req.query.grado; // "primer", "segundo", "tercero"
  try {
    const raw = await fs.readFile(path.join(__dirname, '../data/niveles.json'), 'utf-8');
    const niveles = JSON.parse(raw);
    const data = niveles[grado];
    if (!data) return res.send("Nivel no encontrado");
    res.render('nivel', { data,grado });
  } catch (err) {
    console.error('Error leyendo niveles.json:', err);
    res.status(500).send("Error interno");
  }
}

// controller/pageController.js
// controller/pageController.js
export async function nivelC(req, res) {
  const grado = req.query.grado || '';
  // ⭐ LÍNEA CORREGIDA: Obtén el ID de la sesión, no de la query
  const userId = req.session.userId;
  console.log('<<< userId:', userId, 'grado:', grado);

  // Validación si el usuario no está logueado
  if (!userId) {
    // Redirige al inicio de sesión o muestra un error, según tu lógica de autenticación
    return res.status(401).send("No se encontró una sesión de usuario. Por favor, inicia sesión.");
  }

  try {
    // 1) Carga los datos de los niveles desde JSON
    const rawNiv = await fs.readFile(
      path.join(__dirname, '../data/niveles.json'), 'utf-8'
    );
    const niveles = JSON.parse(rawNiv);
    const data = niveles[grado];
    if (!data) return res.send("Nivel no encontrado");

    // 2) Carga el total de lecturas desde JSON para el total
    const rawCon = await fs.readFile(
      path.join(__dirname, '../data/contenidos.json'), 'utf-8'
    );
    const contenidos = JSON.parse(rawCon)[grado] || {};
    const totalLecturas = (contenidos.lecturas || []).length;

    // 3) Consulta las estadísticas del usuario desde la base de datos
    // Usa el ID obtenido de la sesión
    const statsDB = await Stats.findOne({
      where: {
      id_usuario: userId,
      grado:      grado
     },
     raw: true
    });

    // 4) Si el usuario no tiene estadísticas, crea un objeto por defecto
    const stats = statsDB || {
      lecturas_leidas: 0,
      juegos_jugados: 0,
      nivel_actual: 1,
      desafios_activos: 0,
      total_lecturas: totalLecturas
    };
    
    // 5) Mapea los nombres de los campos de la base de datos para la vista
    const statsParaVista = {
      lecturasLeidas: stats.lecturas_leidas,
      totalLecturas: totalLecturas,
      juegosJugados: stats.juegos_jugados,
      nivelActual: stats.nivel_actual,
      desafiosActivos: stats.desafios_activos
    };

    // 6) Renderiza la vista con las estadísticas actualizadas
    res.render('nivelC', {
      data,
      grado,
      lecturas: contenidos.lecturas || [],
      stats: statsParaVista,
      id: userId // Pasa el userId a la vista si es necesario
    });
  } catch (err) {
    console.error('Error al cargar la vista del nivel:', err);
    res.status(500).send("Error interno del servidor");
  }
}

export async function basico(req, res) {
  const { grado, basico } = req.query;

  try {
    const dataPath = path.join(__dirname, '../data/contenidos.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    // ⭐ LÍNEA CORREGIDA: Accede a la propiedad 'exploracion'
    const exploracionData = data[grado]?.basico?.[basico]?.exploracion;
    
    if (!exploracionData) {
      return res.status(404).send('Datos de exploración no encontrados para este nivel.');
    }
    
    // ⭐ Ahora los bloques se obtienen de la nueva propiedad 'exploracion'
    const bloques = exploracionData.bloques || [];

    return res.render('basico', {
      // ⭐ Usa los títulos e instrucciones del objeto 'exploracion'
      titulo: exploracionData.titulo,
      instrucciones: exploracionData.instrucciones,
      grado,
      nivel: basico,
      bloques // ⭐ Pasa los bloques a la vista
    });

  } catch (error) {
    console.error('Error al cargar la página de nivel básico:', error);
    res.status(500).send('Error interno del servidor.');
  }
}


export async function actividad(req, res) {
    try {
        const { grado, basico } = req.query;

        // Verifica si los datos ya fueron cargados. Si no, cárgalos.
        if (!contenidosData) {
            await loadContenidos();
        }

        // Accede a los datos del nivel, incluyendo la sub-propiedad 'actividad'
        const basicoData = contenidosData?.[grado]?.basico?.[basico]?.actividad;

        // Valida si el nivel existe
        if (!basicoData) {
            return res.status(404).send('Nivel de actividad no encontrado. Por favor, verifica la URL.');
        }

        // Pasa las variables a la plantilla EJS
        res.render('actividad', {
            titulo: basicoData.titulo,
            instrucciones: basicoData.instrucciones,
            ejercicios: basicoData.ejercicios,
            grado: grado
        });
    } catch (err) {
        console.error('Error al renderizar la página de actividad:', err);
        res.status(500).send('Error interno del servidor.');
    }
}



export async function actividad2(req, res, next) {
  try {
    const { grado, basico } = req.query

    // 1) Carga JSON si no está en memoria
    if (!contenidosData) {
      contenidosData = await loadContenidos()
    }
    // 1) Log de depuración
console.log('>>> Grado:', grado, '│ Basico:', basico);
console.log('>>> Claves de contenidosData:', Object.keys(contenidosData));
console.log('>>> Claves de contenidosData[grado]:',
  contenidosData[grado] && Object.keys(contenidosData[grado])
);
console.log('>>> Claves de contenidosData[grado].basico:',
  contenidosData[grado]?.basico && Object.keys(contenidosData[grado].basico)
);
console.log('Buscando nivel en JSON:', grado, basico ?? nivel);



    // 2) Extrae datos de nivel2
    const nivel2 = contenidosData[grado]?.basico?.[basico];
    if (!nivel2) {
      return res.status(404).send(`Nivel 2 no encontrado para grado=${grado}, basico=${basico}`)
    }

    const { titulo, instrucciones, bloques, ejercicios } = nivel2

    // 3) Lee progreso previo o usa valores por defecto
    const userId = req.session.userId

    const registro = await SilabasProgress.findOne({ where: { userId } })
    const prevStats = registro?.stats || { correctas: [], errores: [], dominadas: [], inicio: Date.now() }
    console.log('User ID en sesión:', req.session.userId);


    // 4) Renderiza la vista e inyecta appData + appStats
    res.render('actividad2', {
      appData: {
        nivel2: { titulo, instrucciones, bloques, ejercicios }
      },
      appStats: {
        userId,
        correctas: prevStats.correctas,
        errores:   prevStats.errores,
        dominadas: prevStats.dominadas,
        inicio:    prevStats.inicio
      }
    })
  } catch (err) {
    next(err)
  }
}


export async function guardarProgresoSilabas(req, res, next) {
  console.log('🚀 guardarProgresoSilabas invocado');

  try {
    // 1) Obtenemos payload ya parseado por express.json()
    const { userId, stats, inicio } = req.body;
    console.log('📦 payload beacon:', req.body);

    // 2) Validación básica
    if (!userId) {
      console.warn('⚠️ userId faltante en payload');
      return res.status(400).send('userId faltante');
    }

    // 3) Upsert en base de datos (crea o actualiza)
    const [registro, created] = await SilabasProgress.upsert(
      {
        userId,
        stats,
        inicio,
        ultAvance: new Date()
      },
      { returning: true }
    );

    console.log(
      created 
        ? `✅ Registro creado para userId=${userId}` 
        : `✅ Registro actualizado para userId=${userId}`
    );

    // 4) Respondemos 204 para sendBeacon
    res.sendStatus(204);

  } catch (err) {
    console.error('❌ Error en guardarProgresoSilabas:', err);
    res.status(500).json({
      error: 'Falló el guardado de progreso',
      details: err.message
    });
  }
}



// 2) Handler para ejecutar la actividad elegida
export async function dashboardMaestros(req, res, next) {
  try {
    const maestroId = req.session.userId;

    // 1) Carga y parsea tu JSON de contenidos al vuelo
    const raw = await fs.readFile(
      path.join(__dirname, '../data/contenidos.json'),
      'utf8'
    );
    const parsed = JSON.parse(raw);

    // Si tu JSON es { "ejercicios": [...] }, desempaqueta:
    const ejercicios = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.ejercicios)
      ? parsed.ejercicios
      : [];

    // 2) Trae los registros de progreso + alumno
    const registros = await SilabasProgress.findAll({
      include: [{
        model: User,
        as: 'Alumno',
        attributes: ['nombre'],       // quita 'grado' si aún no lo tienes en BD
        where: { maestro_id: maestroId }
      }]
    });

    // 3) Mapea cada registro traduciendo IDs→sílabas con tu JSON recien-cargado
    const resumen = registros.map(r => {
      const { correctas = [], errores = [] } = r.stats || {};

      const correctasList = correctas.map(id => {
        const ej = ejercicios.find(e => e.id === id);
        return ej ? ej.respuesta_correcta : `Ej#${id}`;
      });

      const erroresList = errores.map(item => {
        if (typeof item === 'number') {
          const ej = ejercicios.find(e => e.id === item);
          return ej ? ej.respuesta_correcta : `Ej#${item}`;
        }
        if (item?.id) {
          const ej = ejercicios.find(e => e.id === item.id);
          return ej
            ? `${item.intento} (esperaba: ${ej.respuesta_correcta})`
            : `Ej#${item.id}`;
        }
        return String(item);
      });

      return {
        alumno: r.Alumno.nombre,
        correctas: correctasList.length,
        errores: erroresList.length,
        total: correctasList.length + erroresList.length,
        ultAvance: r.ultAvance
          ? new Date(r.ultAvance).toLocaleDateString()
          : '—',
        correctasList,
        erroresList
      };
    });

    // 4) Renderiza con el resumen ya enriquecido
    res.render('dashboardMaestros', {
      resumen,
      nombreMaestro: req.session.name
    });
  } catch (err) {
    console.error('Error en dashboardMaestros:', err);
    next(err);
  }
}



export async function basico2(req, res) {
  const { grado } = req.query;
  

  try {
    const dataPath = path.join(__dirname, '../data/contenidos.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    // ⭐ Accede a la propiedad nivel2 dentro del contenido
    const nivel2Data = data[grado]?.basico?.nivel2;

    if (!nivel2Data) {
      return res.status(404).send('Datos de nivel 2 no encontrados para este grado.');
    }

    return res.render('basico2', {
      nivel2: nivel2Data,
      grado
    });

  } catch (error) {
    console.error('Error al cargar la página de nivel 2:', error);
    res.status(500).send('Error interno del servidor.');
  }
}








// Rutas protegidas
export function index(req, res) {
  if (req.session.loggedin && req.session.id_rol == 2) {
    res.render('index', { name: req.session.name });
  } else {
    res.redirect('/login');
  }
}

export function index2(req, res) {
  if (req.session.loggedin && req.session.id_rol == 1) {
    res.render('index2', { name: req.session.name });
  } else {
    res.redirect('/login');
  }
}
