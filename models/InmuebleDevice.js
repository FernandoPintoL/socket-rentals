const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/database');
const InmuebleDevice = sequelize.define('inmueble_devices', {
    inmuebleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inmuebles', // Asegúrate de que este modelo exista
            key: 'id',
            onDelete: 'CASCADE' // Elimina la relación si el inmueble es eliminado
        }
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'devices', // Asegúrate de que este modelo exista
            key: 'deviceId',
            onDelete: 'CASCADE' // Elimina la relación si el dispositivo es eliminado
        }
    },
    role: {
        type: DataTypes.STRING, // 'chapa' o 'luz'
        allowNull: false
    },
    fechaAsignacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.STRING, // 'abierta'/'cerrada' o 'encendida'/'apagada'
        allowNull: false
    },
    lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'inmueble_devices',
    timestamps: true,
    underscored: true, // Esto hará que los nombres de las columnas usen snake_case como Laravel
    hooks: {
        afterUpdate: async (relacion, options) => {
            // Si se actualizó el status, actualizar también el dispositivo
            if (relacion.changed('status')) {
                const Device = require('./Device'); // Importar aquí para evitar dependencias circulares
                const device = await Device.findByPk(relacion.deviceId);
                if (device) {
                    const newStatus = ['abierta', 'encendida'].includes(relacion.status) ?
                        'activo' : 'inactivo';
                    await device.update({ status: newStatus }, { transaction: options.transaction });
                }
            }
        }
    }
});

module.exports = InmuebleDevice;