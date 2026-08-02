// GraphQL Subscription controller for messaging-service

const { PubSub } = require('graphql-subscriptions');

class GraphQLSubscriptionController {
  constructor() {
    this.pubsub = new PubSub();
  }

  publish(event, payload) {
    return this.pubsub.publish(event, payload);
  }

  asyncIterator(event) {
    return this.pubsub.asyncIterator(event);
  }

  publishMessage(message) {
    return this.publish('MESSAGE_SENT', { messageSent: message });
  }

  publishTypingIndicator(userId, isTyping) {
    return this.publish('TYPING_INDICATOR', { typingIndicator: { userId, isTyping } });
  }

  publishOnlineStatus(userId, isOnline) {
    return this.publish('ONLINE_STATUS', { onlineStatus: { userId, isOnline } });
  }

  messageSentIterator() {
    return this.asyncIterator('MESSAGE_SENT');
  }

  typingIndicatorIterator() {
    return this.asyncIterator('TYPING_INDICATOR');
  }

  onlineStatusIterator() {
    return this.asyncIterator('ONLINE_STATUS');
  }

  // Subscription resolvers
  getSubscriptionResolvers() {
    return {
      messageSent: {
        subscribe: () => this.messageSentIterator()
      },
      typingIndicator: {
        subscribe: () => this.typingIndicatorIterator()
      },
      onlineStatus: {
        subscribe: () => this.onlineStatusIterator()
      }
    };
  }
}

module.exports = GraphQLSubscriptionController;
