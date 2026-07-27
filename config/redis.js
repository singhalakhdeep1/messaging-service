const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis reconnection failed after 10 attempts');
                return new Error('Redis reconnection failed');
            }
            const delay = Math.min(retries * 100, 3000);
            console.log(`Redis reconnecting in ${delay}ms...`);
            return delay;
        }
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis Connected');
});

redisClient.on('reconnecting', () => {
    console.log('Redis Reconnecting...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis Ready');
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
    }
};

module.exports = { redisClient, connectRedis };
