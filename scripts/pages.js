// routes/pages.js
const express = require('express');
const router = express.Router();
const pageController = require('../controller/pageController');

// Rutas de páginas

router.get('/levels', pageController.levels);
router.get('/matematica', pageController.matematica);
// Agrega más rutas según tus vistas

module.exports = router;
