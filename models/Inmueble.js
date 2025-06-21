// modelo Inmueble
const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/database');
const Inmueble = sequelize.define('inmuebles', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users', // Asegúrate de que este modelo exista
                key: 'id',
                onDelete: 'CASCADE' // Elimina el inmueble si el usuario es eliminado
            }
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        detalle: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        num_habitacion: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        num_piso: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        precio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        isOcupado: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        accesorios: {
            type: DataTypes.JSONB, // Almacena accesorios como un objeto JSON
            allowNull: true
        },
        sercicios_basicos: {
            type: DataTypes.JSONB, // Almacena servicios básicos como un objeto JSON
            allowNull: true
        },
    }, {
        tableName: 'inmuebles',
        timestamps: true,
        underscored: true, // Esto hará que los nombres de las columnas usen snake_case como Laravel
        freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
    }
);
module.exports = Inmueble;