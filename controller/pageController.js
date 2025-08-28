
// controller/pageController.js
const niveles = require('../data/niveles.json');


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
