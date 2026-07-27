const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis').redisClient;

// General API rate limiter
const apiLimiter = rateLimit({
    store: process.env.REDIS_URL ? new RedisStore({
        client: redis
    }) : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_PER_MINUTE ? parseInt(process.env.RATE_LIMIT_PER_MINUTE) * 15 : 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter (stricter for login/register)
const authLimiter = rateLimit({
    store: process.env.REDIS_URL ? new RedisStore({
        client: redis
    }) : undefined,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Message rate limiter
const messageLimiter = rateLimit({
    store: process.env.REDIS_URL ? new RedisStore({
        client: redis
    }) : undefined,
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Too many messages, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Upload rate limiter
const uploadLimiter = rateLimit({
    store: process.env.REDIS_URL ? new RedisStore({
        client: redis
    }) : undefined,
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Too many uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// WebSocket connection rate limiter (custom implementation)
const wsConnections = new Map();

const wsLimiter = (socket, next) => {
    const ip = socket.handshake.address;
    const now = Date.now();
    const connections = wsConnections.get(ip) || [];

    // Remove connections older than 1 hour
    const recentConnections = connections.filter(time => now - time < 3600000);

    if (recentConnections.length >= 10) {
        return next(new Error('Too many WebSocket connections'));
    }

    recentConnections.push(now);
    wsConnections.set(ip, recentConnections);

    next();
};

module.exports = {
    apiLimiter,
    authLimiter,
    messageLimiter,
    uploadLimiter,
    wsLimiter
};
