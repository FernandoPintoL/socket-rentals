// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { Device, Inmueble, InmuebleDevice } = require('./models/Asociations');

// Production dependencies
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Get environment variables with defaults
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const APP_ENV = process.env.APP_ENV || 'local';
const APP_URL_LOCAL = process.env.APP_URL_LOCAL || 'http://localhost:4000';
const APP_URL_PROD = process.env.APP_URL_PROD || 'https://web-production-5f93.up.railway.app/';

// Connect to MongoDB
connectDB();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS based on environment
const corsOptions = {
    origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',')
};

// Initialize Socket.io with CORS options
const io = new Server(server, {cors: corsOptions});

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());

// Apply production middleware if in production mode
if (NODE_ENV === 'production') {
    // Enable compression
    app.use(compression());

    // Set security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": ["'self'", "'unsafe-inline'"],
                "connect-src": ["'self'", "ws:", "wss:"]
            }
        }
    }));

    // Apply rate limiting
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Demasiadas solicitudes desde esta IP, inténtelo de nuevo después de 15 minutos'
    });

    // Apply rate limiting to API routes
    app.use('/api', apiLimiter);

    // Disable X-Powered-By header
    app.disable('x-powered-by');
}

// Endpoint para registro de dispositivos ESP32
app.post('/register-device', async (req, res) => {
    try {
        const { id, type, macAddress } = req.body;

        // Validar tipo de dispositivo
        if (!['chapa', 'luz'].includes(type)) {
            return res.status(400).json({ error: 'Tipo de dispositivo no válido' });
        }

        // Registrar o actualizar dispositivo
        const [device, created] = await Device.findOrCreate({
            where: { id },
            defaults: {
                type,
                macAddress,
                status: 'inactivo'
            }
        });

        if (!created) {
            await device.update({ type, macAddress });
        }

        res.status(created ? 201 : 200).json(device);
    } catch (error) {
        console.error('Error al registrar dispositivo:', error);
        res.status(500).json({ error: 'Error al registrar dispositivo' });
    }
});


// Controlar Dispositivo con Validación de Inmueble
app.post('/inmuebles/:inmuebleId/control-dispositivo', async (req, res) => {
    try {
        // Verificar si el dispositivo pertenece al inmueble
        const relacion = await InmuebleDevice.findOne({
            where: { inmuebleId: req.params.inmuebleId, deviceId: deviceId }
        });

        if (!relacion) {
            return res.status(403).json({ error: 'Dispositivo no asignado a este inmueble' });
        }

        // Obtener el dispositivo para verificar su tipo
        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }

        // Determinar el estado según el tipo de dispositivo y la acción
        let nuevoEstado;
        if (device.type === 'chapa') {
            nuevoEstado = action === 'activar' ? 'abierta' : 'cerrada';
        } else if (device.type === 'luz') {
            nuevoEstado = action === 'activar' ? 'encendida' : 'apagada';
        } else {
            return res.status(400).json({ error: 'Tipo de dispositivo no válido' });
        }

        // Actualizar el estado en la tabla de relación
        await relacion.update({
            status: nuevoEstado,
            lastUpdated: new Date()
        });

        // Emitir por WebSocket
        io.emit('device-control', { deviceId, action, nuevoEstado });

        res.json({ success: true, status: nuevoEstado });
    } catch (error) {
        console.error('Error al controlar dispositivo:', error);
        res.status(500).json({ error: 'Error al controlar dispositivo' });
    }

});


// Obtener dispositivo de un inmueble
app.get('/inmuebles/:inmuebleId/dispositivos', async (req, res) => {
    try {
        const inmueble = await Inmueble.findByPk(req.params.inmuebleId, {
            include: [{
                model: Device,
                through: {
                    attributes: ['role', 'status', 'fechaAsignacion', 'lastUpdated']
                }
            }]
        });

        if (!inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        res.json(inmueble.devices);
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
        res.status(500).json({ error: 'Error al obtener dispositivos' });
    }
});

// Asignar un dispositivo a un inmueble
app.post('/inmuebles/:inmuebleId/dispositivos', async (req, res) => {
    try {
        const { deviceId, role, status = 'inactivo' } = req.body;
        const inmuebleId = req.params.inmuebleId;

        // Verificar que exista el inmueble
        const inmueble = await Inmueble.findByPk(inmuebleId);
        if (!inmueble) {
            return res.status(404).json({ error: 'Inmueble no encontrado' });
        }

        // Verificar que exista el dispositivo
        const device = await Device.findByPk(deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }

        // Verificar que el tipo de dispositivo coincida con el rol
        if ((device.type === 'chapa' && role !== 'chapa') ||
            (device.type === 'luz' && role !== 'luz')) {
            return res.status(400).json({
                error: 'El rol asignado no coincide con el tipo de dispositivo'
            });
        }

        // Crear la relación
        const [relacion, created] = await InmuebleDevice.findOrCreate({
            where: { inmuebleId, deviceId },
            defaults: {
                role,
                status,
                fechaAsignacion: new Date(),
                lastUpdated: new Date()
            }
        });

        if (!created) {
            // Actualizar si ya existe
            await relacion.update({ role, status, lastUpdated: new Date() });
        }

        // Notificar por WebSocket
        io.to(`inmueble_${inmuebleId}`).emit('dispositivo-asignado', {
            inmuebleId,
            deviceId,
            role,
            status
        });

        res.status(created ? 201 : 200).json(relacion);
    } catch (error) {
        console.error('Error al asignar dispositivo:', error);
        res.status(500).json({ error: 'Error al asignar dispositivo' });
    }
});

// WebSocket para ESP32
io.on('connection', (socket) => {
    console.log('Dispositivo conectado:', socket.id);

    // El ESP32 puede enviar su ID al conectarse
    // Unirse a una "sala" por inmuebleId
    socket.on('unirse-a-inmueble', async (inmuebleId) => {
        socket.join(`inmueble_${inmuebleId}`);
        console.log(`Socket ${socket.id} unido a inmueble ${inmuebleId}`);

        // Enviar lista de dispositivos al cliente
        const inmueble = await Inmueble.findByPk(inmuebleId, {
            include: [{
                model: Device,
                through: { attributes: ['role', 'status', 'fechaAsignacion'] }
            }]
        });

        if (inmueble) {
            socket.emit('dispositivos-actualizados', inmueble.devices);
        }
    });

    // Escuchar comandos para dispositivos específicos
    socket.on('control-dispositivo', async ({ deviceId, inmuebleId, action }) => {
        // Buscar la relación específica entre inmueble y dispositivo
        const relacion = await InmuebleDevice.findOne({
            where: {
                inmuebleId: inmuebleId,
                deviceId: deviceId
            }
        });

        if (relacion) {
            // Actualizar el estado en la tabla de relación
            await relacion.update({
                status: action,
                lastUpdated: new Date()
            });

            // Actualizar también el estado general del dispositivo
            const device = await Device.findByPk(deviceId);
            if (device) {
                await device.update({ status: action === 'abierta' || action === 'encendida' ? 'activo' : 'inactivo' });
            }

            // Notificar solo a los sockets en el mismo inmueble
            io.to(`inmueble_${inmuebleId}`).emit('device-status', {
                deviceId,
                status: action
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Dispositivo desconectado:', socket.id);
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    const appUrl = APP_ENV === 'production' ? APP_URL_PROD : APP_URL_LOCAL;
    console.log(`Servidor de control IoT en ${appUrl}`);
});
