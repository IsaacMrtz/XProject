// controller/pageController.js
import fs from 'fs/promises';
import path from 'path';
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
  const { grado, id } = req.query;
  try {
    // 1) Leer el JSON de contenidos
    const raw = await fs.readFile(
      path.join(__dirname, '../data/contenidos.json'),
      'utf-8'
    );
    const contenidos = JSON.parse(raw)[grado]?.lecturas;
    if (!contenidos) return res.send("Grado no encontrado");

    // 2) Filtrar si viene un id concreto
    const lecturas = id
      ? contenidos.filter(l => l.id === id)
      : contenidos;

    if (id && lecturas.length === 0) {
      return res.send("Lectura no encontrada");
    }

    // 3) Renderizar pasando title + resto de datos
    res.render('layout', {
      title: `Lecturas – ${grado.charAt(0).toUpperCase() + grado.slice(1)}`,
      grado,
      id,
      lecturas
    });
  } catch (err) {
    console.error('Error leyendo contenidos.json:', err);
    res.status(500).send("Error interno");
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

export async function nivelC(req, res) {
  const grado = req.query.grado; // "primer", "segundo", "tercero"
  try {
    // 1) Cargo niveles.json
    const rawNiv     = await fs.readFile(
      path.join(__dirname, '../data/niveles.json'),
      'utf-8'
    );
    const niveles    = JSON.parse(rawNiv);
    const data       = niveles[grado];
    if (!data) return res.send("Nivel no encontrado");

    // 2) Cargo contenidos.json
    const rawCon     = await fs.readFile(
      path.join(__dirname, '../data/contenidos.json'),
      'utf-8'
    );
    const contenidos = JSON.parse(rawCon);
    const lecturas   = contenidos[grado]?.lecturas || [];

    // -- OPCIONAL: ver en consola para debug --
    console.log({ grado, lecturas });

    // 3) Renderizo pasando data, grado y lecturas
    res.render('nivelC', { data, grado, lecturas });
  } catch (err) {
    console.error('Error leyendo JSON:', err);
    res.status(500).send("Error interno");
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
