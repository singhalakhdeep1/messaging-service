# Messaging Service - Implementation

## Overview
This document describes the messaging protocol integrations added to Messaging Service.

## Technologies Added

### 1. gRPC
- Protocol Buffers definition
- gRPC server setup
- Unary RPC (sendMessage, getMessage)
- Server streaming (streamMessages)
- Error handling with status codes
- Async message streaming

### 2. MQTT
- MQTT broker connection
- Topic-based pub/sub
- QoS support
- Message publishing
- Subscription management
- Connection lifecycle

### 3. NATS
- NATS server connection
- Subject-based pub/sub
- Request/Reply pattern
- JetStream KV store
- Queue consumption
- Manual acknowledgment

### 4. Kafka
- Kafka producer/consumer
- Topic management
- Partition support
- Message keys
- Consumer groups
- Offset handling

### 5. RabbitMQ
- AMQP connection
- Queue declaration
- Exchange management
- Direct, fanout, topic exchanges
- Queue binding
- Message acknowledgment

### 6. GraphQL Subscriptions
- PubSub-based events
- Real-time message updates
- Typing indicators
- Online status updates
- Subscription resolvers
- Event publishing

## Files Created

### Controllers
- `controllers/grpcController.js` - gRPC server with streaming
- `controllers/mqttController.js` - MQTT pub/sub client
- `controllers/natsController.js` - NATS client with JetStream
- `controllers/kafkaController.js` - Kafka producer/consumer
- `controllers/rabbitmqController.js` - RabbitMQ AMQP client
- `controllers/graphqlSubscriptionController.js` - GraphQL subscriptions

### Protobuf
- `protos/messaging.proto` - Protocol Buffers schema

## Installation Required

Add to `package.json`:
```json
{
  "dependencies": {
    "@grpc/grpc-js": "^1.9.0",
    "@grpc/proto-loader": "^0.7.0",
    "mqtt": "^5.3.0",
    "nats": "^2.20.0",
    "kafkajs": "^2.2.0",
    "amqplib": "^0.10.0",
    "graphql-subscriptions": "^2.0.0"
  }
}
```

Run:
```bash
npm install
```

## Environment Variables

```env
# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883

# NATS
NATS_SERVER_URL=nats://localhost:4222

# Kafka
KAFKA_BROKERS=localhost:9092

# RabbitMQ
RABBITMQ_URL=amqp://localhost
```

## Notes
- All code is written but packages are not installed (per user request)
- gRPC requires Protocol Buffers compilation
- MQTT requires MQTT broker (Mosquitto, HiveMQ, etc.)
- NATS requires NATS server
- Kafka requires Kafka broker
- RabbitMQ requires RabbitMQ server
- GraphQL subscriptions require GraphQL server setup
- All messaging protocols support real-time communication
