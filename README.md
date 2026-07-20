# Real-time Messaging Service

A real-time messaging service with WebSocket support, Redis pub/sub for scalability, typing indicators, read receipts, and messaging features.

## Overview

This service handles instant messaging, group chats, and real-time notifications. Built with Node.js, Express, Socket.io, and Redis, implementing WebSocket connections with horizontal scaling through Redis pub/sub.

## Features

- Real-time messaging via WebSocket
- Private and group chats
- Read receipts and delivery confirmations
- Typing indicators
- Online presence tracking
- Message history with pagination
- File sharing in conversations
- Message reactions and editing
- Message deletion
- Full-text search
- User mentions
- Redis pub/sub for horizontal scaling
- Socket.io rooms for broadcasting
- Automatic reconnection
- Message queuing
- JWT authentication
- Optional end-to-end encryption
- Rate limiting
- Content moderation

## Tech Stack

- Node.js 18.x
- Express.js 4.18.x
- Socket.io 4.7.x
- Redis 7.x
- MongoDB 6.0+
- Mongoose 8.0.x
- JWT 9.0.x
- Multer 1.4.x
- Sharp 0.32.x
- Winston 3.10.x

## Project Structure

```
messaging-service/
├── config/
│   ├── redis.js              # Redis configuration
│   └── socket.js             # Socket.io configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── chatController.js     # Chat management
│   └── messageController.js  # Message handling
├── middleware/
│   ├── auth.js               # JWT verification
│   └── errorHandler.js       # Error handling
├── models/
│   ├── User.js               # User schema
│   ├── Chat.js               # Chat/conversation schema
│   ├── Message.js            # Message schema
│   └── Notification.js       # Notification schema
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── chatRoutes.js         # Chat management endpoints
│   ├── messageRoutes.js      # Message endpoints
│   ├── notificationRoutes.js # Notification endpoints
│   ├── analyticsRoutes.js    # Analytics endpoints
│   └── integrationRoutes.js  # Third-party integrations
├── utils/
│   ├── logger.js             # Winston logger
│   └── validator.js         # Input validation
├── frontend-test/            # React test frontend
├── socket.js                 # Socket.io setup and events
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── server.js                 # Entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB 6.0+ (local or Atlas)
- Redis 7.x (for pub/sub scaling)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Alakhdeepsingh/messaging-service.git
cd messaging-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/messaging-service
REDIS_URL=redis://localhost:6379
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
MAX_MESSAGE_LENGTH=10000
MAX_FILE_SIZE=10485760
RATE_LIMIT_PER_MINUTE=60
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Chats

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chats` | Get user chats | Yes |
| POST | `/api/chats` | Create new chat | Yes |
| GET | `/api/chats/:id` | Get chat details | Yes |
| PUT | `/api/chats/:id` | Update chat | Yes |
| DELETE | `/api/chats/:id` | Delete chat | Yes |
| POST | `/api/chats/:id/participants` | Add participants | Yes |
| DELETE | `/api/chats/:id/participants/:userId` | Remove participant | Yes |

### Messages

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/messages/chat/:chatId` | Get chat messages | Yes |
| POST | `/api/messages` | Send message | Yes |
| PUT | `/api/messages/:id` | Edit message | Yes |
| DELETE | `/api/messages/:id` | Delete message | Yes |
| POST | `/api/messages/:id/reaction` | Add reaction | Yes |
| DELETE | `/api/messages/:id/reaction` | Remove reaction | Yes |
| POST | `/api/messages/:id/read` | Mark as read | Yes |

### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get notifications | Yes |
| PUT | `/api/notifications/:id/read` | Mark as read | Yes |
| PUT | `/api/notifications/read-all` | Mark all as read | Yes |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## 🔌 WebSocket Events

### Client → Server

| Event | Description | Payload |
|-------|-------------|---------|
| `join_chat` | Join a chat room | `{ chatId }` |
| `leave_chat` | Leave a chat room | `{ chatId }` |
| `send_message` | Send a message | `{ chatId, content, type }` |
| `typing_start` | Start typing | `{ chatId }` |
| `typing_stop` | Stop typing | `{ chatId }` |
| `message_read` | Mark message as read | `{ messageId }` |
| `edit_message` | Edit a message | `{ messageId, content }` |
| `delete_message` | Delete a message | `{ messageId }` |

### Server → Client

| Event | Description | Payload |
|-------|-------------|---------|
| `new_message` | New message received | `{ message }` |
| `message_updated` | Message updated | `{ message }` |
| `message_deleted` | Message deleted | `{ messageId }` |
| `user_typing` | User started typing | `{ chatId, userId }` |
| `user_stopped_typing` | User stopped typing | `{ chatId, userId }` |
| `message_read` | Message read by user | `{ messageId, userId }` |
| `user_joined` | User joined chat | `{ chatId, user }` |
| `user_left` | User left chat | `{ chatId, userId }` |
| `notification` | New notification | `{ notification }` |

---

## Security Features

### Authentication
- **JWT Verification**: All WebSocket connections authenticated with JWT
- **Token Expiration**: Automatic disconnection on token expiration
- **User Validation**: Verify user permissions before chat access

### Message Security
- **Access Control**: Users can only access chats they're part of
- **Message Encryption**: Optional end-to-end encryption support
- **Content Filtering**: Profanity filter and content moderation
- **Rate Limiting**: Message rate limits per user

### Connection Security
- **CORS**: Configured CORS policy for WebSocket connections
- **Origin Validation**: Verify client origin before connection
- **Rate Limiting**: Connection rate limits to prevent abuse

---

## Database Schema

### Chat Model
```javascript
{
  name: String,
  type: String (enum: ['private', 'group']),
  participants: [ObjectId (ref: User)],
  createdBy: ObjectId (ref: User),
  admins: [ObjectId (ref: User)],
  lastMessage: ObjectId (ref: Message),
  lastActivity: Date,
  isArchived: Boolean (default: false),
  settings: {
    onlyAdminsPost: Boolean (default: false),
    isPublic: Boolean (default: false)
  },
  createdAt: Date
}
```

### Message Model
```javascript
{
  chat: ObjectId (ref: Chat),
  sender: ObjectId (ref: User),
  content: String,
  type: String (enum: ['text', 'image', 'file', 'system']),
  file: {
    url: String,
    name: String,
    size: Number,
    mimeType: String
  },
  replyTo: ObjectId (ref: Message),
  reactions: [{
    user: ObjectId (ref: User),
    emoji: String
  }],
  readBy: [{
    user: ObjectId (ref: User),
    readAt: Date
  }],
  edited: Boolean (default: false),
  editedAt: Date,
  isDeleted: Boolean (default: false),
  deletedFor: [ObjectId (ref: User)],
  createdAt: Date
}
```

### Notification Model
```javascript
{
  user: ObjectId (ref: User),
  type: String (enum: ['new_message', 'mention', 'chat_invite']),
  chat: ObjectId (ref: Chat),
  message: ObjectId (ref: Message),
  sender: ObjectId (ref: User),
  isRead: Boolean (default: false),
  readAt: Date,
  createdAt: Date
}
```

---

## Testing

The project includes comprehensive test suites:

- **WebSocket Tests**: Connection, messaging, room management
- **API Tests**: REST endpoint testing
- **Authentication Tests**: JWT verification and authorization
- **Performance Tests**: Concurrent connection handling
- **Integration Tests**: Redis pub/sub functionality

Run tests with coverage:
```bash
npm test -- --coverage
```

---

## Monitoring & Logging

### Winston Logger Configuration
- **Console**: Colored output for development
- **File**: Combined logs in `logs/combined.log`
- **Error File**: Error-specific logs in `logs/error.log`
- **Socket File**: WebSocket-specific logs in `logs/socket.log`
- **Log Levels**: error, warn, info, http, debug

### Metrics Tracked
- Active connections
- Messages sent per minute
- Average message delivery time
- Connection success/failure rates
- Redis pub/sub latency

---

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/messaging-service
REDIS_URL=redis://your-redis-instance:6379
JWT_SECRET=your-production-secret-key
JWT_EXPIRE=7d
CLIENT_URL=https://yourdomain.com
MAX_MESSAGE_LENGTH=10000
MAX_FILE_SIZE=10485760
RATE_LIMIT_PER_MINUTE=60
ENABLE_CONTENT_MODERATION=true
```

### Deployment Platforms

- **Heroku**: Ready for Heroku deployment with Redis add-on
- **Railway**: Compatible with Railway platform
- **AWS**: Can be deployed to EC2 with ElastiCache Redis
- **DigitalOcean**: Compatible with App Platform with Redis

### Scaling Considerations

- **Horizontal Scaling**: Use Redis adapter for multiple Socket.io servers
- **Load Balancer**: Configure sticky sessions for WebSocket connections
- **Database Sharding**: Consider sharding for large-scale deployments
- **CDN**: Use CDN for static file delivery

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Proprietary - All rights reserved.

---

## Author

**Alakhdeep Singh**

- GitHub: [@Alakhdeepsingh](https://github.com/Alakhdeepsingh)
- LinkedIn: [Alakhdeep Singh](https://linkedin.com/in/alakhdeepsingh)

---

## 🙏 Acknowledgments

- Built following Socket.io best practices
- Redis pub/sub pattern for horizontal scaling
- Security patterns from OWASP guidelines
- Inspired by industry-standard messaging platforms like Slack and Discord
