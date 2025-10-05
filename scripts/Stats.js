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
      where: { id_usuario: userId, grado:grado },
      defaults: {
        id_usuario:      userId,
        grado ,
        total_lecturas:  0,  // o el total real que pases al crear
        lecturas_leidas: 0,
        juegos_jugados:  0,
        nivel_actual:    1,
        desafios_activos:0
      }
    });

    // Incrementa el campo
    if (row) {
        // Increment the field
        await row.increment(field, { by: delta });

        // Reload the row to get updated data
        await row.reload();

        return row.toJSON();
    } else {
        // Handle the case where the row couldn't be found or created
        throw new Error('No se pudo encontrar o crear el registro de estadísticas.');
    }

    // CAMBIO CLAVE: Cargar la fila de nuevo desde la base de datos
    // para obtener los valores actualizados.
    const updatedRow = await Stats.findOne({
        where: { id_usuario: userId, grado: grado }
    });

    // Devolver la fila actualizada en formato JSON.
    return updatedRow.toJSON();
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
