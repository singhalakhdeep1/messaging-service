// gRPC controller for messaging-service
//
// Architecture: gRPC handlers delegate persistence to a MessageRepository.
// In production the repository uses a real database (Mongo/Postgres).
// In development/test without a DB, set MESSAGE_STORE=memory to use the
// in-process InMemoryMessageStore — clearly labelled, not silently injected.

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto file
const PROTO_PATH = __dirname + '/../protos/messaging.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const messagingProto = grpc.loadPackageDefinition(packageDefinition).messaging;

// ── In-memory store (dev/test only) ─────────────────────────────────────────

class InMemoryMessageStore {
  constructor() {
    /** @type {Map<string, object>} */
    this.messages = new Map();
  }

  async save(message) {
    this.messages.set(message.id, message);
    return message;
  }

  async findById(messageId) {
    return this.messages.get(messageId) ?? null;
  }

  async findByUserId(userId) {
    return [...this.messages.values()].filter(m => m.userId === userId || m.recipientId === userId);
  }
}

// ── Database store (production) ──────────────────────────────────────────────
// Replace with your real ORM/driver. Example uses a hypothetical messageModel.

class DatabaseMessageStore {
  constructor(messageModel) {
    this.messageModel = messageModel;
  }

  async save(message) {
    return this.messageModel.create(message);
  }

  async findById(messageId) {
    return this.messageModel.findById(messageId);
  }

  async findByUserId(userId) {
    return this.messageModel.find({ $or: [{ userId }, { recipientId: userId }] });
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

function createMessageStore(messageModel) {
  if (process.env.MESSAGE_STORE === 'memory' || !messageModel) {
    if (!messageModel) {
      console.warn(
        '[messaging-service] No messageModel provided — falling back to InMemoryMessageStore. ' +
        'Set MESSAGE_STORE=memory explicitly to silence this warning in dev.'
      );
    }
    return new InMemoryMessageStore();
  }
  return new DatabaseMessageStore(messageModel);
}

// ── gRPC controller ──────────────────────────────────────────────────────────

class GrpcController {
  /**
   * @param {object|null} messageModel  Mongoose/Sequelize model (optional in dev)
   */
  constructor(messageModel = null) {
    this.store = createMessageStore(messageModel);
    this.server = new grpc.Server();
    this._setupServices();
  }

  _setupServices() {
    this.server.addService(messagingProto.MessagingService.service, {
      sendMessage: this.sendMessage.bind(this),
      getMessage: this.getMessage.bind(this),
      streamMessages: this.streamMessages.bind(this)
    });
  }

  async sendMessage(call, callback) {
    try {
      const { userId, recipientId, content } = call.request;

      const message = {
        id: Date.now().toString(),
        userId,
        recipientId,
        content,
        timestamp: new Date().toISOString()
      };

      await this.store.save(message);

      callback(null, {
        success: true,
        message: JSON.stringify(message)
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  }

  async getMessage(call, callback) {
    try {
      const { messageId } = call.request;

      const message = await this.store.findById(messageId);

      if (!message) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: `Message ${messageId} not found`
        });
      }

      callback(null, message);
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  }

  async streamMessages(call) {
    const { userId } = call.request;

    try {
      const messages = await this.store.findByUserId(userId);

      for (const message of messages) {
        call.write(message);
      }
    } catch (error) {
      call.destroy(error);
    } finally {
      call.end();
    }
  }

  start(port = 50051) {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      () => {
        console.log(`gRPC server running on port ${port}`);
      }
    );
  }

  stop() {
    this.server.tryShutdown((err) => {
      if (err) {
        console.error('Error shutting down gRPC server:', err);
      } else {
        console.log('gRPC server stopped');
      }
    });
  }
}

module.exports = GrpcController;
module.exports.InMemoryMessageStore = InMemoryMessageStore;
module.exports.DatabaseMessageStore = DatabaseMessageStore;
