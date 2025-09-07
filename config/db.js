// config/db.js
import * as mysql from 'mysql2';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carga variables de entorno (si aún no lo hace en app.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
loadEnv({ path: path.join(__dirname, '../config/.env') });

const connection = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE
});

connection.connect(error => {
  if (error) {
    console.error('Error de conexión BD:', error);
    return;
  }
  console.log('¡Conectado a la Base de Datos!');
});

// Exporta como default para que `import connection from ...` funcione
export default connection;
