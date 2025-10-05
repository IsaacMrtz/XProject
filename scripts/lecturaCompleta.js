import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class LecturaCompleta extends Model {}

LecturaCompleta.init({
  id_lectura_completa: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_lectura: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_completada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'LecturaCompleta',
  tableName: 'lecturas_completadas',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_usuario', 'id_lectura', 'grado']
    }
  ]
});

export default LecturaCompleta;