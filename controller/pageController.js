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
export function layout(req, res) {
  res.render('layout', { title: "Mi Layout Multimodal" });
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
    const raw = await fs.readFile(path.join(__dirname, '../data/niveles.json'), 'utf-8');
    const niveles = JSON.parse(raw);
    const data = niveles[grado];
    if (!data) return res.send("Nivel no encontrado");
    res.render('nivelC', { data });
  } catch (err) {
    console.error('Error leyendo niveles.json:', err);
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
