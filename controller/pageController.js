// controllers/pageController.js


exports.levels = (req, res) => {
  res.render('levels', { title: 'Niveles' });
};

exports.matematica = (req, res) => {
  res.render('matematica', { title: 'Matemática' });
};

// Puedes seguir agregando funciones para otras vistas
