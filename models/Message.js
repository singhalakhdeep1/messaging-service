const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'video', 'audio'],
        default: 'text'
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveredTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Cryptographic helpers - #194-200: Symmetric encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(32); // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text || typeof text !== 'string') return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        return text;
    }
}

function decrypt(text) {
    if (!text || typeof text !== 'string' || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        return text;
    }
}

// Mongoose Hooks
messageSchema.pre('save', function (next) {
    if (this.isModified('content') && this.type === 'text') {
        this.content = encrypt(this.content);
    }
    next();
});

messageSchema.post('init', function (doc) {
    if (doc.content && doc.type === 'text') {
        doc.content = decrypt(doc.content);
    }
});

messageSchema.post('save', function (doc) {
    if (doc.content && doc.type === 'text') {
        doc.content = decrypt(doc.content);
    }
});

// Indexes
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ content: 'text' }); // For full-text search

module.exports = mongoose.model('Message', messageSchema);
