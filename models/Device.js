const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('devices', {
    deviceId: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    type: {
        type: DataTypes.STRING, // 'chapa' o 'luz'
        allowNull: false
    },
    status: {
        type: DataTypes.STRING, // 'activo' o 'inactivo'
        allowNull: false,
        defaultValue: 'inactivo'
    },
    macAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true // Asegura que la dirección MAC sea única
    },

}, {
    tableName: 'devices',
    timestamps: true,
    underscored: true
});

module.exports = Device;