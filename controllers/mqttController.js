// MQTT controller for messaging-service

const mqtt = require('mqtt');

class MqttController {
  constructor(brokerUrl = 'mqtt://localhost:1883') {
    this.brokerUrl = brokerUrl;
    this.client = null;
    this.subscriptions = new Map();
  }

  connect() {
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    this.client.on('message', (topic, message) => {
      const handlers = this.subscriptions.get(topic) || [];
      handlers.forEach(handler => handler(topic, message.toString()));
    });

    return this.client;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  publish(topic, message, options = {}) {
    if (!this.client) {
      this.connect();
    }
    return this.client.publish(topic, JSON.stringify(message), options);
  }

  subscribe(topic, callback) {
    if (!this.client) {
      this.connect();
    }

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
      this.client.subscribe(topic);
    }

    this.subscriptions.get(topic).push(callback);
  }

  unsubscribe(topic, callback) {
    if (this.client) {
      this.client.unsubscribe(topic);
      
      if (this.subscriptions.has(topic)) {
        const handlers = this.subscriptions.get(topic);
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        if (handlers.length === 0) {
          this.subscriptions.delete(topic);
        }
      }
    }
  }

  async publishMessage(userId, recipientId, content) {
    const topic = `messages/${recipientId}`;
    const message = {
      id: Date.now().toString(),
      userId,
      recipientId,
      content,
      timestamp: new Date().toISOString()
    };

    return this.publish(topic, message, { qos: 1 });
  }

  async subscribeToMessages(userId, callback) {
    const topic = `messages/${userId}`;
    return this.subscribe(topic, (topic, messageStr) => {
      const message = JSON.parse(messageStr);
      callback(message);
    });
  }
}

module.exports = MqttController;
