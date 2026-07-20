const Chat = require('../models/Chat');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { getIO } = require('../socket');

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
