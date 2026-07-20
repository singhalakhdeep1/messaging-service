const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    avatar: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

// Validate group chat
chatSchema.pre('save', function (next) {
    if (this.isGroupChat && this.participants.length < 2) {
        next(new Error('Group chat must have at least 2 participants'));
    }
    next();
});

module.exports = mongoose.model('Chat', chatSchema);
