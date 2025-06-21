// models/associations.js
const Inmueble = require('./Inmueble');
const Device = require('./Device');
const InmuebleDevice = require('./InmuebleDevice');

// Definir relaciones
Inmueble.belongsToMany(Device, {
    through: InmuebleDevice,
    foreignKey: 'inmuebleId',
    otherKey: 'deviceId'
});

Device.belongsToMany(Inmueble, {
    through: InmuebleDevice,
    foreignKey: 'deviceId',
    otherKey: 'inmuebleId'
});

module.exports = { Inmueble, Device, InmuebleDevice };