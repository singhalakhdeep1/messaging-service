const redis = require('../config/redis').redisClient;
const logger = require('../utils/logger');

const QUEUE_NAME = 'message_queue';
const PROCESSING_QUEUE_NAME = 'message_queue:processing';

// Add message to queue
const addToQueue = async (messageData) => {
    try {
        const message = JSON.stringify(messageData);
        await redis.rpush(QUEUE_NAME, message);
        logger.info(`Message added to queue: ${messageData._id}`);
        return true;
    } catch (error) {
        logger.error('Error adding message to queue:', error);
        return false;
    }
};

// Get next message from queue
const getNextMessage = async () => {
    try {
        const message = await redis.lpop(QUEUE_NAME);
        if (message) {
            const messageData = JSON.parse(message);
            // Add to processing queue for tracking
            await redis.rpush(PROCESSING_QUEUE_NAME, message);
            return messageData;
        }
        return null;
    } catch (error) {
        logger.error('Error getting message from queue:', error);
        return null;
    }
};

// Mark message as processed
const markAsProcessed = async (messageId) => {
    try {
        await redis.lrem(PROCESSING_QUEUE_NAME, 1, JSON.stringify({ _id: messageId }));
        logger.info(`Message marked as processed: ${messageId}`);
        return true;
    } catch (error) {
        logger.error('Error marking message as processed:', error);
        return false;
    }
};

// Get queue stats
const getQueueStats = async () => {
    try {
        const queueLength = await redis.llen(QUEUE_NAME);
        const processingLength = await redis.llen(PROCESSING_QUEUE_NAME);
        return {
            pending: queueLength,
            processing: processingLength,
            total: queueLength + processingLength
        };
    } catch (error) {
        logger.error('Error getting queue stats:', error);
        return { pending: 0, processing: 0, total: 0 };
    }
};

// Process queue continuously
const processQueue = async (processCallback) => {
    logger.info('Starting message queue processor');
    
    const processNext = async () => {
        try {
            const message = await getNextMessage();
            if (message) {
                await processCallback(message);
                await markAsProcessed(message._id);
            }
        } catch (error) {
            logger.error('Error processing queue message:', error);
        }
        
        // Process next message after a short delay
        setTimeout(processNext, 100);
    };
    
    processNext();
};

// Clear queue (for testing/admin)
const clearQueue = async () => {
    try {
        await redis.del(QUEUE_NAME);
        await redis.del(PROCESSING_QUEUE_NAME);
        logger.info('Message queue cleared');
        return true;
    } catch (error) {
        logger.error('Error clearing queue:', error);
        return false;
    }
};

module.exports = {
    addToQueue,
    getNextMessage,
    markAsProcessed,
    getQueueStats,
    processQueue,
    clearQueue
};
