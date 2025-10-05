
import sequelize from '../config/db.js';
import User from '../scripts/user.js';
import SilabasProgress from '../scripts/silabasProgress.js';

// Asociación maestro–estudiante
User.belongsTo(User, {
  as: 'Maestro',
  foreignKey: 'maestro_id'
});

User.hasMany(User, {
  as: 'Estudiantes',
  foreignKey: 'maestro_id'
});

// Asociación progreso–alumno
SilabasProgress.belongsTo(User, {
  as: 'Alumno',
  foreignKey: 'user_id'
});

export { sequelize, User, SilabasProgress };
