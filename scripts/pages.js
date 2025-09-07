// scripts/pages.js
import express from 'express';
import * as pageController from '../controller/pageController.js';

const router = express.Router();

// Vistas públicas
router.get('/login',     pageController.login);
router.get('/register',  pageController.register);
router.get('/levels',    pageController.levels);
router.get('/matematica',pageController.matematica);
router.get('/nivel',     pageController.nivel);
router.get('/emotions',  pageController.emotions);
router.get('/htmlD',     pageController.htmlD);
router.get('/layout',    pageController.layout);

// Vistas protegidas
router.get('/index',     pageController.index);
router.get('/index2',    pageController.index2);

export default router;
