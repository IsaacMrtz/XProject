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
  const { field, delta } = req.body;
  const userId = req.session.userId;

  try {
    const updatedStats = await Stats.incrementField(userId, field, delta);
    res.json({ updatedStats });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Vistas protegidas
router.get('/index',     pageController.index);
router.get('/index2',    pageController.index2);

export default router;
