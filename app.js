// app.js
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import Sentiment from 'sentiment';
import dotenv from 'dotenv';
import sequelize from './config/db.js';        // asegúrate que tu db exporte ESM
import pagesRoutes from './scripts/pages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'config/.env') });

const app = express();


app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// Parsers
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Carpeta pública
app.use('/resources', express.static(path.join(__dirname, 'public')));

// JSON y datos
app.use('/data',    express.static(path.join(__dirname, 'data')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/controller', express.static(path.join(__dirname, 'controller')));

// Sentiment API
const sentiment = new Sentiment();
app.post('/api/analyze', (req, res) => {
  const result = sentiment.analyze(req.body.text);
  res.json(result);
});

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Conexión autenticación, registro, etc.
// (Aquí pones tu lógica de bcrypt y connection.query tal cual estaba)
//10 - Método para la REGISTRACIÓN
app.post('/register', async (req, res)=>{
    const user = req.body.user;
    const name = req.body.name;
    const lastname = req.body.lastname;
    const email= req.body.email;
    const rol = parseInt(req.body.id_rol);
    const pass = req.body.contrasena;
    let passwordHash = await bcrypt.hash(pass, 8);

    try {
        await sequelize.query('INSERT INTO usuarios (usuario, nombre, apellido, correo, id_rol, contrasena) VALUES (?, ?, ?, ?, ?, ?)', {
            replacements: [user, name, lastname, email, rol, passwordHash],
            type: sequelize.QueryTypes.INSERT
        });
        
        res.render('register', {
            alert: true,
            alertTitle: "Registration",
            alertMessage: "¡Successful Registration!",
            alertIcon:'success',
            showConfirmButton: false,
            timer: 1500,
            ruta: ''
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.render('register', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Error en el registro de usuario",
            alertIcon:'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'register'
        });
    }
});

//11 - Metodo para la autenticacion (CORREGIDO)
app.post('/auth', async (req, res)=> {
    const user = req.body.user;
    const pass = req.body.pass; 

    if (user && pass) {
        try {
            const [results] = await sequelize.query('SELECT * FROM usuarios WHERE usuario = ?', {
                replacements: [user],
                type: sequelize.QueryTypes.SELECT
            });

            // Si se encontró un usuario y la contraseña coincide
            if (results && (await bcrypt.compare(pass, results.contrasena))) {
                req.session.loggedin = true;
                req.session.name = results.nombre;
                req.session.id_rol = results.id_rol;
				req.session.userId   = results.id_usuario;

                console.log('Usuario logueado:', user, 'Rol:', results.id_rol);

                if (req.session.id_rol === 1) {
                    res.redirect('/index2');
                } else if (req.session.id_rol === 2) {
                    res.redirect('/index');
                } else {
                    res.redirect('/login');
                }
            } else {
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "USUARIO y/o PASSWORD incorrectas",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
            }
        } catch (error) {
            console.error('Error en la autenticación:', error);
            res.render('login', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Error en la base de datos",
                alertIcon:'error',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        }
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Por favor ingrese usuario y contraseña",
            alertIcon:'error',
            showConfirmButton: true,
            timer: false,
            ruta: 'login'
        });
    }
});

//12 - Método para controlar que está auth en todas las páginas
app.get('/', (req, res)=> {
	if (req.session.loggedin) {
		// Si está logueado, verificamos el rol
		if (req.session.id_rol == 1) {
			// Maestro → index2
			res.render('index2', {
				login: true,
				name: req.session.name
			});
		} else if (req.session.id_rol == 2) {
			// Alumno → index
			res.render('index', {
				login: true,
				name: req.session.name
			});
		}
	} else {
		// Si no está logueado, redirige al login
		res.redirect('/login');
	}
});

app.use((req, res, next) => {
  res.locals.nombre = req.session.name || 'Usuario';
  next();
});

app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

// Rutas principales
app.use('/', pagesRoutes);

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Server start
app.listen(3000, () => {
  console.log('SERVER RUNNING AT http://localhost:3000');
});







