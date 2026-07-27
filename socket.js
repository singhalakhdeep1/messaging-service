const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

// Initialize Redis
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

(async () => {
    await redisClient.connect();
})();

const { createAdapter } = require('@socket.io/redis-adapter');

let io;

// Store online users
const onlineUsers = new Map();

exports.initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            credentials: true
        }
    });

    // Configure Redis adapter for multi-instance scaling - #1851-1875: System Design / Scaling
    const subClient = redisClient.duplicate();
    subClient.connect().then(() => {
        io.adapter(createAdapter(redisClient, subClient));
        console.log('✅ Redis Socket.io Adapter Configured for Horizontal Scaling');
    }).catch(err => {
        console.error('❌ Redis Adapter duplicate client connect failed', err);
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userEmail = decoded.email;

            // Origin validation
            const origin = socket.handshake.headers.origin;
            const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];
            
            if (!allowedOrigins.includes(origin)) {
                return next(new Error('Origin not allowed'));
            }

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userId}`);

        // User comes online
        onlineUsers.set(socket.userId, socket.id);

        // Update online status in Redis
        redisClient.hSet('onlineUsers', socket.userId, socket.id);

        // Broadcast to all users that this user is online
        io.emit('user:online', { userId: socket.userId });

        // Join user's personal room
        socket.join(socket.userId);

        // Join chat room
        socket.on('join:chat', async (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.userId} joined chat ${chatId}`);
        });

        // Leave chat room
        socket.on('leave:chat', (chatId) => {
            socket.leave(chatId);
            console.log(`User ${socket.userId} left chat ${chatId}`);
        });

        // Send message
        socket.on('message:send', async (data) => {
            try {
                const { chatId, content, type = 'text' } = data;

                // Save message to database
                const message = await Message.create({
                    chat: chatId,
                    sender: socket.userId,
                    content,
                    type
                });

                await message.populate('sender', 'name email avatar');

                // Update chat's last message
                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: message._id,
                    updatedAt: new Date()
                });

                // Get chat participants
                const chat = await Chat.findById(chatId).populate('participants');
                
                // Add delivery confirmations for online users (excluding sender)
                const onlineParticipants = chat.participants.filter(
                    p => p._id.toString() !== socket.userId && onlineUsers.has(p._id.toString())
                );
                
                if (onlineParticipants.length > 0) {
                    message.deliveredTo = onlineParticipants.map(p => p._id);
                    await message.save();
                }

                // Emit message to chat room
                io.to(chatId).emit('message:received', message);

                // Emit delivery confirmations
                if (message.deliveredTo && message.deliveredTo.length > 0) {
                    io.to(chatId).emit('message:delivered', {
                        messageId: message._id,
                        deliveredTo: message.deliveredTo
                    });
                }

                // Stop typing indicator
                io.to(chatId).emit('typing:stop', { userId: socket.userId, chatId });

            } catch (error) {
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing:start', ({ chatId }) => {
            socket.to(chatId).emit('typing:start', {
                userId: socket.userId,
                userEmail: socket.userEmail,
                chatId
            });
        });

        socket.on('typing:stop', ({ chatId }) => {
            socket.to(chatId).emit('typing:stop', {
                userId: socket.userId,
                chatId
            });
        });

        // Message read
        socket.on('message:read', async ({ messageId, chatId }) => {
            try {
                await Message.findByIdAndUpdate(messageId, {
                    $addToSet: { readBy: socket.userId }
                });

                io.to(chatId).emit('message:read', {
                    messageId,
                    userId: socket.userId
                });
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        });

        // Private message
        socket.on('private:message', async (data) => {
            const { recipientId, content } = data;

            // Check if recipient is online
            const recipientSocketId = onlineUsers.get(recipientId);

            if (recipientSocketId) {
                io.to(recipientSocketId).emit('private:message', {
                    senderId: socket.userId,
                    content,
                    timestamp: new Date()
                });
            }
        });

        // Video call signals
        socket.on('call:offer', ({ recipientId, offer }) => {
            const recipientSocketId = onlineUsers.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call:offer', {
                    callerId: socket.userId,
                    offer
                });
            }
        });

        socket.on('call:answer', ({ callerId, answer }) => {
            const callerSocketId = onlineUsers.get(callerId);
            if (callerSocketId) {
                io.to(callerSocketId).emit('call:answer', {
                    recipientId: socket.userId,
                    answer
                });
            }
        });

        socket.on('call:ice-candidate', ({ recipientId, candidate }) => {
            const recipientSocketId = onlineUsers.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('call:ice-candidate', {
                    senderId: socket.userId,
                    candidate
                });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userId}`);

            // Remove from online users
            onlineUsers.delete(socket.userId);
            redisClient.hDel('onlineUsers', socket.userId);

            // Broadcast to all users that this user is offline
            io.emit('user:offline', { userId: socket.userId });
        });
    });

    return io;
};

// Get online users
exports.getOnlineUsers = async () => {
    return await redisClient.hGetAll('onlineUsers');
};

exports.getIO = () => io;
exports.redisClient = redisClient;
