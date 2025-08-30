
// routes/pages.js
const express = require('express');
const router = express.Router();
const pageController = require('../controller/pageController');

// Rutas de páginas (solo vistas)
router.get('/login', pageController.login);
router.get('/register', pageController.register);

router.get('/levels', pageController.levels);
router.get('/matematica', pageController.matematica);
router.get('/nivel', pageController.nivel);
router.get('/emotions', pageController.emotions);

// Rutas protegidas (ejemplo con roles)
router.get('/index', pageController.index);
router.get('/index2', pageController.index2);

module.exports = router;