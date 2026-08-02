// gRPC controller for messaging-service

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

class GrpcController {
  constructor() {
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
      
      // Mock message storage
      const message = {
        id: Date.now().toString(),
        userId,
        recipientId,
        content,
        timestamp: new Date().toISOString()
      };

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
      
      // Mock message retrieval
      const message = {
        id: messageId,
        userId: 'user-1',
        recipientId: 'user-2',
        content: 'Hello world',
        timestamp: new Date().toISOString()
      };

      callback(null, message);
    } catch (error) {
      callback({
        code: grpc.status.NOT_FOUND,
        details: error.message
      });
    }
  }

  async *streamMessages(call) {
    const { userId } = call.request;
    
    // Mock streaming messages
    for (let i = 0; i < 10; i++) {
      yield {
        id: (Date.now() + i).toString(),
        userId,
        content: `Message ${i}`,
        timestamp: new Date().toISOString()
      };
      await new Promise(resolve => setTimeout(resolve, 1000));
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
