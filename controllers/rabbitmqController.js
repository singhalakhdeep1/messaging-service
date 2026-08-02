// RabbitMQ controller for messaging-service

const amqp = require('amqplib');

class RabbitMQController {
  constructor(url = 'amqp://localhost') {
    this.url = url;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
    console.log('Connected to RabbitMQ');
    return this.channel;
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async assertQueue(queueName, options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel.assertQueue(queueName, {
      durable: true,
      ...options
    });
  }

  async assertExchange(exchangeName, type = 'direct', options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel.assertExchange(exchangeName, type, options);
  }

  async bindQueue(queueName, exchangeName, routingKey) {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel.bindQueue(queueName, exchangeName, routingKey);
  }

  async publishToQueue(queueName, message) {
    if (!this.channel) {
      await this.connect();
    }

    await this.assertQueue(queueName);
    return this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
  }

  async publishToExchange(exchangeName, routingKey, message) {
    if (!this.channel) {
      await this.connect();
    }

    return this.channel.publishToExchange(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message))
    );
  }

  async consumeFromQueue(queueName, callback) {
    if (!this.channel) {
      await this.connect();
    }

    await this.assertQueue(queueName);
    
    return this.channel.consume(queueName, (msg) => {
      if (msg) {
        const message = JSON.parse(msg.content.toString());
        callback(message, msg);
        this.channel.ack(msg);
      }
    });
  }

  async publishMessage(userId, recipientId, content) {
    const queueName = `messages-${recipientId}`;
    const message = {
      id: Date.now().toString(),
      userId,
      recipientId,
      content,
      timestamp: new Date().toISOString()
    };

    return this.publishToQueue(queueName, message);
  }

  async subscribeToMessages(userId, callback) {
    const queueName = `messages-${userId}`;
    return this.consumeFromQueue(queueName, (message) => {
      callback(message);
    });
  }

  async createFanoutExchange(exchangeName) {
    return this.assertExchange(exchangeName, 'fanout');
  }

  async createTopicExchange(exchangeName) {
    return this.assertExchange(exchangeName, 'topic');
  }
}

module.exports = RabbitMQController;
