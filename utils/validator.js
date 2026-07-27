const validator = require('validator');

// Email validation
const isValidEmail = (email) => {
    return validator.isEmail(email);
};

// Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
const isValidPassword = (password) => {
    if (!password || password.length < 8) {
        return false;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
};

// Username validation (alphanumeric, 3-30 chars)
const isValidUsername = (username) => {
    return validator.isAlphanumeric(username) && username.length >= 3 && username.length <= 30;
};

// URL validation
const isValidUrl = (url) => {
    return validator.isURL(url);
};

// Sanitize input
const sanitizeInput = (input) => {
    return validator.escape(input);
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
    return validator.isMongoId(id);
};

// Message content validation
const isValidMessageContent = (content) => {
    if (!content || typeof content !== 'string') {
        return false;
    }
    const maxLength = process.env.MAX_MESSAGE_LENGTH || 10000;
    return content.length > 0 && content.length <= maxLength;
};

// File validation
const isValidFile = (file) => {
    if (!file) return false;
    
    const maxSize = process.env.MAX_FILE_SIZE || 10485760; // 10MB default
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain"',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    return file.size <= maxSize && allowedMimeTypes.includes(file.mimetype);
};

// Profanity filter (basic list)
const profanityList = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard', 'whore',
    'slut', 'dick', 'pussy', 'cock', 'penis', 'vagina', 'sex'
];

const containsProfanity = (text) => {
    const lowerText = text.toLowerCase();
    return profanityList.some(word => lowerText.includes(word));
};

const filterProfanity = (text) => {
    let filteredText = text;
    profanityList.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidUsername,
    isValidUrl,
    sanitizeInput,
    isValidObjectId,
    isValidMessageContent,
    isValidFile,
    containsProfanity,
    filterProfanity
};
