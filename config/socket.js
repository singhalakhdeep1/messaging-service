const { Server } = require('socket.io');

const socketConfig = {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8, // 100 MB
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    cookie: false
};

const createSocketServer = (server) => {
    const io = new Server(server, socketConfig);
    
    // Origin validation middleware
    io.use((socket, next) => {
        const origin = socket.handshake.headers.origin;
        const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];
        
        if (allowedOrigins.includes(origin)) {
            next();
        } else {
            next(new Error('Origin not allowed'));
        }
    });
    
    return io;
};

module.exports = { socketConfig, createSocketServer };
