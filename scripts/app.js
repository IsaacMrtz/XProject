// 1 - Invocamos a Express
const path = require('path');

const express = require('express');
const app = express();

//2 - Para poder capturar los datos del formulario (sin urlencoded nos devuelve "undefined")
app.use(express.urlencoded({extended:false}));
app.use(express.json());//además le decimos a express que vamos a usar json

//3- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './config/.env'});

//4 -seteamos el directorio de assets
app.use('/resources',express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));


//5 - Establecemos el motor de plantillas
app.set('view engine','ejs');
app.set('views', path.join(__dirname, '../views'));/////




//

//6 -Invocamos a bcrypt
const bcrypt = require('bcryptjs');

//7- variables de session	
const session = require('express-session');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

// 8 - Invocamos a la conexion de la DB
const connection = require('../config/db');







// Ruta para mostrar el login (AÑADIDA)


// Ruta para mostrar el registro (AÑADIDA)



//9 - establecemos las rutas


//10 - Método para la REGISTRACIÓN
app.post('/register', async (req, res)=>{
	const user = req.body.user;
	const name = req.body.name;
	const lastname = req.body.lastname;
	const email= req.body.email;
    const rol = parseInt(req.body.id_rol);
	const pass = req.body.contrasena;
	let passwordHash = await bcrypt.hash(pass, 8);
    connection.query('INSERT INTO usuarios SET ?',{usuario:user, nombre:name, apellido:lastname, correo:email, id_rol:rol, contrasena:passwordHash}, async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('register', {
				alert: true,
				alertTitle: "Registration",
				alertMessage: "¡Successful Registration!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
        }
	});
})

//11 - Metodo para la autenticacion (CORREGIDO)
app.post('/auth', async (req, res)=> {
	const user = req.body.user;
	const pass = req.body.pass;    
	
	if (user && pass) {
		connection.query('SELECT * FROM usuarios WHERE usuario = ?', [user], async (error, results, fields)=> {
			if(error) {
				console.log(error);
				return res.render('login', {
					alert: true,
					alertTitle: "Error",
					alertMessage: "Error en la base de datos",
					alertIcon:'error',
					showConfirmButton: true,
					timer: false,
					ruta: 'login'    
				});
			}

			if( results.length == 0 || !(await bcrypt.compare(pass, results[0].contrasena)) ) {    
				res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "USUARIO y/o PASSWORD incorrectas",
                    alertIcon:'error',
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'    
                });
			} else {         
				// Creamos las variables de sesión
				req.session.loggedin = true;                
				req.session.name = results[0].nombre;
				req.session.id_rol = results[0].id_rol;

				console.log('Usuario logueado:', user, 'Rol:', results[0].id_rol);

				// SOLUCIÓN: Redirigir directamente según el rol
				if (req.session.id_rol == 1){
					console.log('Redirigiendo a index2 (rol 1 - alumno)');
					res.redirect('/index2');
				} else if (req.session.id_rol == 2){
					console.log('Redirigiendo a index (rol 2 - maestro)');
					res.redirect('/index');
				} else {
					console.log('Rol no reconocido:', req.session.id_rol);
					res.redirect('/login');
				}
			}
		});
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
// para mandar el nombre del usuario a las vistas
app.use((req, res, next) => {
  res.locals.nombre = req.session.name || 'Usuario';
  next();
});


const pagesRoutes = require('./pages');
app.use('/', pagesRoutes);


//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});



//Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/login') // CORREGIDO: redirige al login en lugar de '/'
	})
});

app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
});

