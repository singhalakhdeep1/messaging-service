// Kafka controller for messaging-service

const { Kafka, logLevel } = require('kafkajs');

class KafkaController {
  constructor(brokers = ['localhost:9092']) {
    this.kafka = new Kafka({
      clientId: 'messaging-service',
      brokers: brokers,
      logLevel: logLevel.INFO
    });
    this.producer = null;
    this.consumer = null;
  }

  async createProducer() {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    console.log('Kafka producer connected');
    return this.producer;
  }

  async createConsumer(groupId = 'messaging-group') {
    this.consumer = this.kafka.consumer({ groupId });
    await this.consumer.connect();
    console.log('Kafka consumer connected');
    return this.consumer;
  }

  async disconnect() {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }

  async sendMessage(topic, key, value) {
    if (!this.producer) {
      await this.createProducer();
    }

    return this.producer.send({
      topic,
      messages: [{
        key,
        value: JSON.stringify(value),
        timestamp: Date.now()
      }]
    });
  }

  async subscribe(topic, callback) {
    if (!this.consumer) {
      await this.createConsumer();
    }

    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = JSON.parse(message.value.toString());
        callback({ topic, partition, offset: message.offset, value });
      }
    });
  }

  async createTopic(topic, numPartitions = 3, replicationFactor = 1) {
    const admin = this.kafka.admin();
    await admin.connect();
    
    try {
      await admin.createTopics({
        topics: [{
          topic,
          numPartitions,
          replicationFactor
        }]
      });
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
    } finally {
      await admin.disconnect();
    }
  }

  async publishMessage(userId, recipientId, content) {
    const topic = 'messages';
    const key = recipientId;
    const message = {
      id: Date.now().toString(),
      userId,
      recipientId,
      content,
      timestamp: new Date().toISOString()
    };

    return this.sendMessage(topic, key, message);
  }

  async subscribeToMessages(userId, callback) {
    const topic = 'messages';
    
    await this.subscribe(topic, ({ value }) => {
      if (value.recipientId === userId) {
        callback(value);
      }
    });
  }

  async publishToQueue(topic, data) {
    return this.sendMessage(topic, 'queue', data);
  }

  async consumeFromQueue(topic, callback) {
    return this.subscribe(topic, callback);
  }
}

module.exports = KafkaController;
