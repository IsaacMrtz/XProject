// models/Stats.js
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';  // tu instancia de Sequelize

class Stats extends Model {
  /**
   * Incrementa un campo numérico o ajusta nivel_actual
   * @param {number} userId        - ID del usuario en la tabla usuarios
   * @param {string} field         - Nombre del campo a modificar
   * @param {number} delta         - Incremento (o decremento) a aplicar
   * @returns {Promise<Object>}    - El registro actualizado como objeto plano
   */
  static async incrementField(userId, field, delta) {
    // Campos permitidos
    const allowed = [
      'lecturas_leidas',
      'juegos_jugados',
      'desafios_activos',
      'nivel_actual'
    ];
    if (!allowed.includes(field)) {
      throw new Error(`El campo "${field}" no se puede modificar.`);
    }

    // Busca o crea la fila de stats para este usuario
    const [row] = await Stats.findOrCreate({
      where: { id_usuario: userId },
      defaults: { id_usuario: userId }
    });

    // Aplica el incremento
    if (field === 'nivel_actual') {
      // Para nivel, sumamos delta directamente al valor actual
      row.nivel_actual = row.nivel_actual + delta;
      await row.save();
    } else {
      // Para contadores usamos increment nativo
      await row.increment(field, { by: delta });
    }

    // Devuelve el registro actualizado
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
    allowNull: false,
    unique: true
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
  timestamps: false
});

export default Stats;
