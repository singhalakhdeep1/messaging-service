// Parse mentions from message content
// Mentions are in format @username or @userId

const parseMentions = (content) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push({
            text: match[0],
            username: match[1],
            index: match.index
        });
    }

    return mentions;
};

// Replace mentions with formatted HTML
const formatMentions = (content, usersMap) => {
    let formattedContent = content;
    const mentions = parseMentions(content);

    mentions.forEach(mention => {
        const user = usersMap[mention.username];
        if (user) {
            const mentionHtml = `<span class="mention" data-user-id="${user._id}">@${user.name}</span>`;
            formattedContent = formattedContent.replace(mention.text, mentionHtml);
        }
    });

    return formattedContent;
};

// Get user IDs from mentions
const getMentionedUserIds = async (content, User) => {
    const mentions = parseMentions(content);
    const usernames = mentions.map(m => m.username);

    if (usernames.length === 0) return [];

    const users = await User.find({
        $or: usernames.map(username => ({ name: new RegExp(`^${username}$`, 'i') }))
    }).select('_id name');

    return users.map(user => user._id);
};

// Create mention notifications
const createMentionNotifications = async (mentionedUserIds, message, Notification, io) => {
    const notifications = [];

    for (const userId of mentionedUserIds) {
        // Skip if the mentioned user is the sender
        if (userId.toString() === message.sender.toString()) continue;

        const notification = await Notification.create({
            recipient: userId,
            sender: message.sender,
            type: 'mention',
            title: 'You were mentioned',
            message: `${message.sender.name} mentioned you in a message`,
            chat: message.chat,
            data: {
                messageId: message._id,
                chatId: message.chat
            }
        });

        notifications.push(notification);

        // Emit notification via Socket.io
        if (io) {
            io.to(userId.toString()).emit('notification', notification);
        }
    }

    return notifications;
};

module.exports = {
    parseMentions,
    formatMentions,
    getMentionedUserIds,
    createMentionNotifications
};
