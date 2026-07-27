const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['private', 'group'],
        default: 'private'
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    avatar: {
        type: String
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    settings: {
        onlyAdminsPost: {
            type: Boolean,
            default: false
        },
        isPublic: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ lastActivity: -1 });

// Validate group chat
chatSchema.pre('save', function (next) {
    if (this.isGroupChat && this.participants.length < 2) {
        next(new Error('Group chat must have at least 2 participants'));
    }
    next();
});

// Update lastActivity on save
chatSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    next();
});

module.exports = mongoose.model('Chat', chatSchema);
