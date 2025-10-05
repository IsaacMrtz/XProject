// config/db.js
import { Sequelize } from 'sequelize';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1) Carga de variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
loadEnv({ path: path.join(__dirname, './.env') });

// 2) Instancia de Sequelize
const sequelize = new Sequelize(
  process.env.DB_DATABASE,  // nombre de la BD
  process.env.DB_USER,      // usuario
  process.env.DB_PASS,      // contraseña
  {
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 3306,
    dialect:  'mysql',
    logging:  false,         // o console.log para debug
    pool: {
      max:     5,
      min:     0,
      acquire: 30000,
      idle:    10000
    },
    define: {
      // ajusta convenciones si lo deseas
      timestamps: false,
      underscored: true
    }
  }
);

// 3) Probar la conexión
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✔️  Conexión con MySQL (Sequelize) establecida.');
  } catch (err) {
    console.error('❌ Error al conectar con MySQL via Sequelize:', err);
  }
})();

// 4) Exporta la instancia para usarla en tus modelos
export default sequelize;
