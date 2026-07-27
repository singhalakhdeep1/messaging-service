const { containsProfanity, filterProfanity } = require('../utils/validator');
const logger = require('../utils/logger');

const contentModeration = (req, res, next) => {
    const { content } = req.body;

    // Skip moderation if content is not present or not text
    if (!content || typeof content !== 'string') {
        return next();
    }

    // Check if content moderation is enabled
    if (process.env.ENABLE_CONTENT_MODERATION !== 'true') {
        return next();
    }

    // Check for profanity
    if (containsProfanity(content)) {
        logger.warn(`Profanity detected from user ${req.user.id}: ${content.substring(0, 50)}`);
        
        // Option 1: Block the message completely
        // return res.status(400).json({
        //     success: false,
        //     error: 'Message contains inappropriate language'
        // });

        // Option 2: Filter the profanity (replace with asterisks)
        req.body.content = filterProfanity(content);
        req.body.wasFiltered = true;
        
        logger.info(`Profanity filtered for user ${req.user.id}`);
    }

    next();
};

// Spam detection based on message frequency
const spamDetection = (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    
    // Store message timestamps in memory (in production, use Redis)
    if (!global.messageTimestamps) {
        global.messageTimestamps = new Map();
    }
    
    const userTimestamps = global.messageTimestamps.get(userId) || [];
    
    // Remove timestamps older than 1 minute
    const recentTimestamps = userTimestamps.filter(timestamp => now - timestamp < 60000);
    
    // Check if user sent more than 20 messages in the last minute
    if (recentTimestamps.length > 20) {
        logger.warn(`Spam detected from user ${userId}: ${recentTimestamps.length} messages in 1 minute`);
        return res.status(429).json({
            success: false,
            error: 'You are sending messages too fast. Please slow down.'
        });
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    global.messageTimestamps.set(userId, recentTimestamps);
    
    next();
};

// Link detection and validation
const linkModeration = (req, res, next) => {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
        return next();
    }

    // Check if content moderation is enabled
    if (process.env.ENABLE_CONTENT_MODERATION !== 'true') {
        return next();
    }

    // Detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);

    if (urls && urls.length > 0) {
        // Option 1: Block links completely
        // return res.status(400).json({
        //     success: false,
        //     error: 'Links are not allowed in messages'
        // });

        // Option 2: Log and allow
        logger.info(`Link detected in message from user ${req.user.id}: ${urls.length} link(s)`);
        
        // Add metadata to request
        req.body.containsLinks = true;
        req.body.links = urls;
    }

    next();
};

module.exports = {
    contentModeration,
    spamDetection,
    linkModeration
};
