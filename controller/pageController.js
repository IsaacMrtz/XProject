
// controller/pageController.js
const niveles = require('../data/niveles.json');
const fs = require('fs');

exports.login = (req, res) => {
    res.render('login', { alert: false });
};

exports.register = (req, res) => {
    res.render('register', { alert: false });
};

exports.levels = (req, res) => {
    res.render('levels', { title: "Niveles de Estudio" });
};

exports.matematica = (req, res) => {
    res.render('matematica', { title: "Matemáticas" });
};

exports.emotions = (req, res) => {
    res.render('emotions', { title: "emociones jaja" });
};

exports.htmlD = (req, res) => {
    res.render('htmlD', { title: "emociones jaja" });
};

exports.layout = (req, res) => {
    res.render('layout', { title: "emociones jaja" });
};

// Para json & layout
async function cargarContenido(grado, tipo, id) {
  const res = await fetch('/data/contenidos.json');
  const data = await res.json();

  const item = data[grado][tipo].find(e => e.id === id);
  if (!item) return;

  const contentDiv = document.getElementById("content");
  if (item.tipo === "lectura") {
    contentDiv.innerHTML = `
      <h2>${item.titulo}</h2>
      <p>${item.texto}</p>
    `;
  } else if (item.tipo === "minijuego") {
    contentDiv.innerHTML = `<h2>${item.titulo}</h2><canvas id="gameCanvas"></canvas>`;
    iniciarJuego(item.id);
  }
}



//Para transcripcion
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const fs = require('fs');

app.use(express.json()); // Asegúrate de tener esto para leer req.body

app.post('/api/analyze', (req, res) => {
  const result = sentiment.analyze(req.body.text);
  fs.writeFileSync('data/resultado.json', JSON.stringify(result, null, 2));
  res.json(result);
});


exports.nivel = (req, res) => {
    const grado = req.query.grado; // "primer", "segundo", "tercero"
    const data = niveles[grado];

    if (!data) {
        return res.send("Nivel no encontrado");
    }

    res.render('nivel', { data });
};







exports.index = (req, res) => {
    if (req.session.loggedin && req.session.id_rol == 2) {
        res.render('index', { name: req.session.name });
    } else {
        res.redirect('/login');
    }
};

exports.index2 = (req, res) => {
    if (req.session.loggedin && req.session.id_rol == 1) {
        res.render('index2', { name: req.session.name });
    } else {
        res.redirect('/login');
    }
};
