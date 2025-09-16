// controller/pageController.js
import fs from 'fs/promises';
import path from 'path';
import Stats from '../scripts/Stats.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

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
    const raw      = await fs.readFile(path.join(__dirname, '../data/contenidos.json'), 'utf-8');
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
    //    Si llegan varias (sin id), toma la primera; si llega un id, busca ese objeto
    const currentItem = id
      ? allItems.find(item => item.id === id)
      : allItems[0];

    // 4) Stats desde la base de datos (igual que ya tenías)
        const [dbStats] = await Stats.findOrCreate({
      where: { id_usuario: userId },
      defaults: {
        id_usuario: userId,
        total_lecturas: allItems.length,
      },
    })

    const stats = {
      lecturasLeidas:  dbStats.lecturas_leidas,
      totalLecturas:   dbStats.total_lecturas,
      juegosJugados:   dbStats.juegos_jugados,
      nivelActual:     dbStats.nivel_actual,
      desafiosActivos: dbStats.desafios_activos
    };

    // 5) Renderiza, incluyendo ahora `currentItem`
    return res.render('layout', {
      title:       `Lectura – ${grado[0].toUpperCase() + grado.slice(1)}`,
      grado,
      id,
      lecturas,
      currentItem,      // <-- aquí tienes tu objeto con `imagen`
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
