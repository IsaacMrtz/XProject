// models/Stats.js
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class Stats extends Model {
  /**
   * Incrementa un campo numérico o ajusta nivel_actual
   * @param {number} userId
   * @param {string} field
   * @param {number} delta
   * @param {string} grado
   * @returns {Promise<Object>}
   */
  static async incrementField(userId, field, delta, grado) {
    const allowed = [
      'lecturas_leidas',
      'juegos_jugados',
      'desafios_activos',
      'nivel_actual'
    ];
    if (!allowed.includes(field)) {
      throw new Error(`El campo "${field}" no se puede modificar.`);
    }
    
    // Busca o crea la fila para este usuario Y este grado
    const [row] = await Stats.findOrCreate({
      where: { id_usuario: userId, grado },
      defaults: {
        id_usuario:      userId,
        grado,
        total_lecturas:  0,  // o el total real que pases al crear
        lecturas_leidas: 0,
        juegos_jugados:  0,
        nivel_actual:    1,
        desafios_activos:0
      }
    });

    // Incrementa o ajusta
    if (field === 'nivel_actual') {
      row.nivel_actual += delta;
      await row.save();
    } else {
      await row.increment(field, { by: delta });
    }

    return row.toJSON();
  }
}

Stats.init({
  id_stats: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
    // ya no único por sí solo
  },
  grado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'primer'
  },
  lecturas_leidas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  total_lecturas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  juegos_jugados: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  nivel_actual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  desafios_activos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Stats',
  tableName: 'stats',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_usuario','grado']
    }
  ]
});

export default Stats;
