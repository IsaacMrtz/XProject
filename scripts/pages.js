// scripts/pages.js
import express from 'express';
import * as pageController from '../controller/pageController.js';
import Stats from '../scripts/Stats.js';


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



router.post('/api/stats/update', async (req, res) => {
  const { field, delta, grado } = req.body;
  const userId = req.session.userId;
  console.log('API call:', { userId, field, delta,grado });
  if (!field || typeof delta !== 'number' || !grado) {
    return res.status(400).json({ error: 'Faltan parámetros field, delta o grado.' });
  }

  try {
    // Encuentra el registro de stats de este usuario y este grado
    let stat = await Stats.findOne({
      where: { id_usuario: userId, grado }
    });

    // Si no existe, inicialízalo
    if (!stat) {
      stat = await Stats.create({
        id_usuario:      userId,
        grado,
        total_lecturas:  6,/* aquí tu total de lecturas para ese grado */
        lecturas_leidas: 0,
        juegos_jugados:  0,
        nivel_actual:    1,
        desafios_activos:0
      });
    }

    // Incrementa el campo dinámicamente
    // Sequelize tiene un método .increment()
    await stat.increment(field, { by: delta });
    // Refresca los datos
    await stat.reload();

    res.json({ updatedStats: stat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo actualizar las estadísticas.' });
  }
});

// Vistas protegidas
router.get('/index',     pageController.index);
router.get('/index2',    pageController.index2);

export default router;
