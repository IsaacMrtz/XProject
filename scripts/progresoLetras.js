import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

class LetterProgress extends Model {
    /**
     * Registra un acierto para una letra específica de un usuario.
     * @param {number} userId
     * @param {string} letra
     * @param {string} grado
     * @returns {Promise<Object>} La fila actualizada del progreso.
     */
    static async recordSuccess(userId, letra, grado) {
        // Umbral de aciertos para considerar la letra "dominada"
        const DOMINANCE_THRESHOLD = 10; 

        // 1. Busca o crea la fila para este usuario, grado Y letra
        const [row] = await LetterProgress.findOrCreate({
            where: { id_usuario: userId, grado: grado, letra: letra },
            defaults: {
                id_usuario: userId,
                grado,
                letra,
                aciertos: 0,
                dominada: false
            }
        });

        // 2. Incrementa el contador de aciertos
        await row.increment('aciertos', { by: 1 });
        await row.reload(); // Recarga para obtener el nuevo valor de 'aciertos'

        // 3. Verifica la lógica de "Dominada"
        if (!row.dominada && row.aciertos >= DOMINANCE_THRESHOLD) {
            row.dominada = true;
            await row.save();
        }

        return row.toJSON();
    }
}

LetterProgress.init({
    id_progreso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    grado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    letra: {
        type: DataTypes.STRING(1), // Solo la letra (ej. 'a', 'm', 's')
        allowNull: false
    },
    aciertos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    dominada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    fecha_ultima_act: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'LetterProgress',
    tableName: 'letter_progress',
    timestamps: false,
    indexes: [
        {
            // Clave única: Un usuario solo tiene un registro por letra en un grado
            unique: true, 
            fields: ['id_usuario', 'grado', 'letra'] 
        }
    ]
});

export default LetterProgress;