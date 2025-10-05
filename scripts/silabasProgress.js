// models/SilabasProgress.js
import sequelize from '../config/db.js'
import { DataTypes } from 'sequelize'





const SilabasProgress = sequelize.define('SilabasProgress', {

    
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id'
  },
  stats: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ultAvance: {
    type: DataTypes.DATE,
    field: 'ult_Avance'
  }
}, {
  tableName: 'silabas_progress',
  timestamps: false,
  underscored: true
})



export default SilabasProgress
