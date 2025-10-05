// scripts/pages.js
import express from 'express';
import * as pageController from '../controller/pageController.js';
import Stats from '../scripts/Stats.js';
import LecturaCompleta from '../scripts/lecturaCompleta.js';
import LetterProgress from '../scripts/progresoLetras.js';

const router = express.Router();

// Vistas públicas
router.get('/login',     pageController.login);
router.get('/register',  pageController.register);
router.get('/levels',    pageController.levels);
router.get('/matematica',pageController.matematica);
router.get('/nivel',     pageController.nivel);
router.get('/nivelC',     pageController.nivelC);
router.get('/emotions',  pageController.emotions);
router.get('/htmlD',     pageController.htmlD);
router.get('/layout',    pageController.layout);
router.get('/basico',    pageController.basico);
router.get('/actividad', pageController.actividad);





// ... (your existing routes) ...


// Vistas protegidas
router.get('/index',     pageController.index);
router.get('/index2',    pageController.index2);




router.post('/api/stats/update', async (req, res) => {
  const { field, delta, lecturaId, grado } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  if (!grado) {
    return res.status(400).json({ error: 'El campo "grado" es obligatorio.' });
  }

  try {
    let updatedStats;

    // 1. MANEJAR EL PROGRESO DE LETRAS (NUEVA LÓGICA)
    if (field === 'acierto_letra') {
        const updatedProgress = await LetterProgress.recordSuccess(
            userId,
            lecturaId, // La letra
            grado
        );
        
        return res.status(200).json({ 
            message: 'Progreso de letra actualizado',
            updatedProgress: updatedProgress 
        });

    // 2. MANEJAR LECTURAS COMPLETADAS (LÓGICA EXISTENTE)
    } else if (field === 'lecturas_leidas') {
        // ... (Tu lógica de LecturaCompleta existente) ...
      
      const existingEntry = await LecturaCompleta.findOne({
        where: { id_usuario: userId, id_lectura: lecturaId, grado: grado }
      });
      
      if (!existingEntry) {
        await LecturaCompleta.create({ id_usuario: userId, id_lectura: lecturaId, grado: grado });
        updatedStats = await Stats.incrementField(userId, 'lecturas_leidas', delta, grado);
        console.log("Estadísticas Actualizadas:", updatedStats);
      } else {
        const existingStats = await Stats.findOne({ where: { id_usuario: userId, grado: grado } });
        updatedStats = existingStats.toJSON();
      }

    } else {
      // 3. MANEJAR OTROS CAMPOS GENERALES
      updatedStats = await Stats.incrementField(userId, field, delta, grado);
    }

    if (!updatedStats) {
        return res.status(404).json({ error: 'No se encontraron estadísticas para este usuario y grado.' });
    }
    
    // Solo se llega aquí si se manejó una estadística general (2 o 3)
    res.status(200).json({ 
        message: 'Estadística general actualizada',
        updatedStats: updatedStats 
    });

  } catch (err) {
    console.error("Error en /api/stats/update:", err);
    // Es importante devolver el error.message al frontend
    res.status(500).json({ error: 'Error actualizando estadística', details: err.message });
  }
});
// ... (your existing routes) ...

router.get('/basico2', pageController.basico2);

router.get('/actividad2', pageController.actividad2)

// Recibe las estadísticas desde el frontend
router.post(
  '/actividad2/progreso',
  express.json(),                   // parsea JSON por ti
  pageController.guardarProgresoSilabas
);

router.get('/game', pageController.juegoPorTipo);


router.get('/dashboardMaestros', pageController.dashboardMaestros);


export default router; 