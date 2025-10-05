// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const User = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_usuario'
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  maestro_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'maestro_id'
  }
}, {
  tableName: 'usuarios',
  timestamps: false,
  underscored: true
});

export default User;
