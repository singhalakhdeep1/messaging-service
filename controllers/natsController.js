// NATS controller for messaging-service

const { connect, StringCodec } = require('nats');

class NatsController {
  constructor(serverUrl = 'nats://localhost:4222') {
    this.serverUrl = serverUrl;
    this.nc = null;
    this.sc = StringCodec();
  }

  async connect() {
    this.nc = await connect({ servers: this.serverUrl });
    console.log('Connected to NATS server');
    return this.nc;
  }

  async disconnect() {
    if (this.nc) {
      await this.nc.close();
      this.nc = null;
    }
  }

  async publish(subject, data) {
    if (!this.nc) {
      await this.connect();
    }
    return this.nc.publish(subject, this.sc.encode(JSON.stringify(data)));
  }

  async subscribe(subject, callback) {
    if (!this.nc) {
      await this.connect();
    }

    const sub = this.nc.subscribe(subject);
    (async () => {
      for await (const msg of sub) {
        const data = JSON.parse(this.sc.decode(msg.data));
        callback(data);
      }
    })();

    return sub;
  }

  async request(subject, data, timeout = 5000) {
    if (!this.nc) {
      await this.connect();
    }

    const response = await this.nc.request(
      subject,
      this.sc.encode(JSON.stringify(data)),
      { timeout }
    );

    return JSON.parse(this.sc.decode(response.data));
  }

  async createKeyValueStore(bucketName = 'MESSAGES') {
    if (!this.nc) {
      await this.connect();
    }
    return this.nc.jetstream().views.kv(bucketName);
  }

  async publishMessage(userId, recipientId, content) {
    const subject = `messages.${recipientId}`;
    const message = {
      id: Date.now().toString(),
      userId,
      recipientId,
      content,
      timestamp: new Date().toISOString()
    };

    return this.publish(subject, message);
  }

  async subscribeToMessages(userId, callback) {
    const subject = `messages.${userId}`;
    return this.subscribe(subject, (data) => {
      callback(data);
    });
  }

  async publishToQueue(queueName, data) {
    if (!this.nc) {
      await this.connect();
    }

    const js = this.nc.jetstream();
    await js.publish(queueName, this.sc.encode(JSON.stringify(data)));
  }

  async consumeFromQueue(queueName, callback) {
    if (!this.nc) {
      await this.connect();
    }

    const js = this.nc.jetstream();
    const consumer = await js.consumers.get(queueName);
    
    const sub = await js.subscribe(queueName, { manual_ack: true });
    (async () => {
      for await (const msg of sub) {
        const data = JSON.parse(this.sc.decode(msg.data));
        await callback(data);
        msg.ack();
      }
    })();
  }
}

module.exports = NatsController;
