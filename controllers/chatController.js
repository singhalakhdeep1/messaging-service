const Chat = require('../models/Chat');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// @desc    Create or get one-on-one chat
// @route   POST /api/chats
exports.createChat = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;

    if (!userId) {
        return next(new AppError('User ID is required', 400));
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: [req.user.id, userId] }
    })
        .populate('participants', '-password')
        .populate('lastMessage');

    if (chat) {
        return res.status(200).json({
            success: true,
            data: chat
        });
    }

    // Create new chat
    chat = await Chat.create({
        participants: [req.user.id, userId],
        isGroupChat: false
    });

    chat = await chat.populate('participants', '-password');

    res.status(201).json({
        success: true,
        data: chat
    });
});

// @desc    Get all chats for user
// @route   GET /api/chats
exports.getUserChats = asyncHandler(async (req, res, next) => {
    const chats = await Chat.find({
        participants: req.user.id
    })
        .populate('participants', '-password')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        data: chats
    });
});

// @desc    Create group chat
// @route   POST /api/chats/group
exports.createGroupChat = asyncHandler(async (req, res, next) => {
    const { name, participants } = req.body;

    if (!name || !participants || participants.length < 2) {
        return next(new AppError('Please provide name and at least 2 participants', 400));
    }

    // Add creator to participants
    const allParticipants = [...new Set([req.user.id, ...participants])];

    const chat = await Chat.create({
        name,
        isGroupChat: true,
        participants: allParticipants,
        admin: req.user.id
    });

    const populatedChat = await chat.populate('participants', '-password');

    res.status(201).json({
        success: true,
        data: populatedChat
    });
});

// @desc    Add user to group
// @route   PUT /api/chats/:id/add
exports.addToGroup = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;

    const chat = await Chat.findOne({
        _id: req.params.id,
        admin: req.user.id,
        isGroupChat: true
    });

    if (!chat) {
        return next(new AppError('Chat not found or you are not admin', 404));
    }

    chat.participants.push(userId);
    await chat.save();

    const updatedChat = await chat.populate('participants', '-password');

    res.status(200).json({
        success: true,
        data: updatedChat
    });
});

// @desc    Remove user from group
// @route   PUT /api/chats/:id/remove
exports.removeFromGroup = asyncHandler(async (req, res, next) => {
    const { userId } = req.body;

    const chat = await Chat.findOne({
        _id: req.params.id,
        admin: req.user.id,
        isGroupChat: true
    });

    if (!chat) {
        return next(new AppError('Chat not found or you are not admin', 404));
    }

    chat.participants = chat.participants.filter(
        p => p.toString() !== userId
    );
    await chat.save();

    const updatedChat = await chat.populate('participants', '-password');

    res.status(200).json({
        success: true,
        data: updatedChat
    });
});
