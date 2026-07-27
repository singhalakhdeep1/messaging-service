const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { getIO } = require('../socket');
const { getMentionedUserIds, createMentionNotifications } = require('../utils/mentions');

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
exports.getMessages = asyncHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant
    const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user.id
    });

    if (!chat) {
        return next(new AppError('Chat not found or access denied', 404));
    }

    const messages = await Message.find({ chat: chatId, deleted: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('sender', 'name email avatar')
        .populate('replyTo', 'content sender');

    const total = await Message.countDocuments({ chat: chatId, deleted: false });

    res.status(200).json({
        success: true,
        data: {
            messages: messages.reverse(),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// @desc    Send message
// @route   POST /api/messages
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { chatId, content, type, replyTo } = req.body;

    // Verify chat exists and user is participant
    const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user.id
    });

    if (!chat) {
        return next(new AppError('Chat not found or access denied', 404));
    }

    const message = await Message.create({
        chat: chatId,
        sender: req.user.id,
        content,
        type: type || 'text',
        replyTo
    });

    await message.populate('sender', 'name email avatar');

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        updatedAt: new Date()
    });

    // Handle mentions
    if (content && content.includes('@')) {
        const mentionedUserIds = await getMentionedUserIds(content, User);
        if (mentionedUserIds.length > 0) {
            const io = getIO();
            await createMentionNotifications(mentionedUserIds, message, Notification, io);
        }
    }

    // Emit via Socket.io
    const io = getIO();
    io.to(chatId).emit('message:received', message);

    res.status(201).json({
        success: true,
        data: message
    });
});

// @desc    Edit message
// @route   PUT /api/messages/:id
exports.editMessage = asyncHandler(async (req, res, next) => {
    const message = await Message.findOne({
        _id: req.params.id,
        sender: req.user.id
    });

    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    message.content = req.body.content;
    message.edited = true;
    await message.save();

    // Emit via Socket.io
    const io = getIO();
    io.to(message.chat.toString()).emit('message:edited', message);

    res.status(200).json({
        success: true,
        data: message
    });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
exports.deleteMessage = asyncHandler(async (req, res, next) => {
    const message = await Message.findOne({
        _id: req.params.id,
        sender: req.user.id
    });

    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await message.save();

    // Emit via Socket.io
    const io = getIO();
    io.to(message.chat.toString()).emit('message:deleted', {
        messageId: message._id
    });

    res.status(200).json({
        success: true,
        message: 'Message deleted'
    });
});

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reaction
exports.addReaction = asyncHandler(async (req, res, next) => {
    const { emoji } = req.body;

    if (!emoji) {
        return next(new AppError('Emoji is required', 400));
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
        r => r.user.toString() === req.user.id && r.emoji === emoji
    );

    if (existingReaction) {
        // Remove reaction if already exists (toggle)
        message.reactions = message.reactions.filter(
            r => !(r.user.toString() === req.user.id && r.emoji === emoji)
        );
    } else {
        // Add new reaction
        message.reactions.push({
            user: req.user.id,
            emoji,
            createdAt: new Date()
        });
    }

    await message.save();
    await message.populate('reactions.user', 'name avatar');

    // Emit via Socket.io
    const io = getIO();
    io.to(message.chat.toString()).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
    });

    res.status(200).json({
        success: true,
        data: message.reactions
    });
});

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:id/reaction
exports.removeReaction = asyncHandler(async (req, res, next) => {
    const { emoji } = req.query;

    if (!emoji) {
        return next(new AppError('Emoji is required', 400));
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
        return next(new AppError('Message not found', 404));
    }

    message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user.id && r.emoji === emoji)
    );

    await message.save();
    await message.populate('reactions.user', 'name avatar');

    // Emit via Socket.io
    const io = getIO();
    io.to(message.chat.toString()).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
    });

    res.status(200).json({
        success: true,
        data: message.reactions
    });
});

// @desc    Search messages
// @route   GET /api/messages/search
exports.searchMessages = asyncHandler(async (req, res, next) => {
    const { q, chatId, page = 1, limit = 20 } = req.query;

    if (!q) {
        return next(new AppError('Search query is required', 400));
    }

    // Build search query
    const query = {
        deleted: false,
        $text: { $search: q }
    };

    // Filter by chat if specified
    if (chatId) {
        // Verify user has access to chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: req.user.id
        });

        if (!chat) {
            return next(new AppError('Chat not found or access denied', 404));
        }

        query.chat = chatId;
    } else {
        // Search in all user's chats
        const userChats = await Chat.find({ participants: req.user.id }).distinct('_id');
        query.chat = { $in: userChats };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('sender', 'name email avatar')
        .populate('chat', 'name');

    const total = await Message.countDocuments(query);

    res.status(200).json({
        success: true,
        data: {
            messages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});
