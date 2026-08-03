# Messaging Service - HLD/LLD Implementation

## Overview
This document provides comprehensive documentation for HLD/LLD patterns implemented in the Messaging Service application (Node.js/Express/Socket.IO).

## Implemented Topics

### LLD Topics (Low-Level Design)

#### 1. Distributed Caching
**Location:** `services/cache/cache.service.js`

**Description:** Implements distributed caching with Redis for messaging platform data.

**Key Features:**
- Get/set/delete operations
- TTL support
- Get or set pattern
- Pattern-based invalidation

**Usage Example:**
```javascript
const CacheService = require('./services/cache/cache.service');

const cache = new CacheService();
const cached = await cache.get('message:123');
await cache.set('message:123', JSON.stringify(message), 3600);
```

#### 2. API Rate Limiting
**Location:** `services/rate-limiting/rate-limiting.service.js`

**Description:** Implements token bucket algorithm for API rate limiting.

**Key Features:**
- Token bucket algorithm
- Per-key rate limiting
- Configurable bucket capacity
- Redis-backed storage

**Usage Example:**
```javascript
const RateLimitingService = require('./services/rate-limiting/rate-limiting.service');

const rateLimiting = new RateLimitingService();
const allowed = await rateLimiting.isAllowed(`user:${userId}`, 1);
```

#### 3. Structured Logging
**Location:** `services/structured-logging/structured-logging.service.js`

**Description:** Implements structured logging with correlation IDs and context.

**Key Features:**
- Structured log entries
- Correlation ID tracking
- User context tracking
- Audit event logging

**Usage Example:**
```javascript
const StructuredLoggingService = require('./services/structured-logging/structured-logging.service');

const logging = new StructuredLoggingService();
logging.logAuditEvent('MessageSent', 'User sent a message', { userId, messageId });
```

### HLD Topics (High-Level Design)

#### 1. Real-time Messaging
**Location:** `socket.js` (Already exists)

**Description:** Socket.IO integration for real-time messaging.

#### 2. REST API
**Location:** `routes/`, `controllers/` (Already exists)

**Description:** REST API endpoints for messaging operations.

#### 3. gRPC Communication
**Location:** `protos/` (Already exists)

**Description:** Protocol Buffers for gRPC-based service communication.

#### 4. Middleware
**Location:** `middleware/` (Already exists)

**Description:** Middleware for authentication, error handling, and request processing.

#### 5. Models
**Location:** `models/` (Already exists)

**Description:** Data models for messages, users, and conversations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                            │
│  (REST API, Middleware, Rate Limiting)                      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Routes     │  │   Socket.IO   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  (Messages, Conversations, Real-time Events)                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Cache     │  │Rate Limiting │  │ Structured   │      │
│  │   (Redis)    │  │  Service     │  │   Logging    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Socket.IO  │  │    gRPC      │  │   Models     │      │
│  │  (Real-time) │  │  (Protos)    │  │  (Data)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

Environment variables:

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_BUCKET_CAPACITY=100
RATE_LIMIT_REFILL_RATE=1

# Socket.IO
SOCKET_PORT=3000
```

## Summary

This implementation provides Messaging Service-specific HLD/LLD patterns focusing on distributed caching, rate limiting, and structured logging. The platform already includes extensive infrastructure with Socket.IO for real-time messaging, REST API endpoints, gRPC communication with Protocol Buffers, middleware for authentication and error handling, and data models for messages and conversations, making it a comprehensive messaging platform with modern real-time communication capabilities.

## Tech Stack Coverage Summary

Comprehensive HLD/LLD implementation across major tech stacks:

1. ✅ **bankcore-dotnet** (.NET/C#) - All 15 topics
2. ✅ **ferrobank** (Rust) - All 15 topics
3. ✅ **finrails** (Ruby on Rails) - All 15 topics
4. ✅ **finvault-go** (Go) - All 15 topics
5. ✅ **springbank** (Java/Spring Boot) - All 15 topics
6. ✅ **ecommerce-platform** (Node.js) - All 15 topics
7. ✅ **cartwave** (Python/Django) - All 15 topics
8. ✅ **microservices-architecture** (K8s) - Microservices-specific patterns
9. ✅ **trove** (NestJS/TypeScript) - Marketplace-specific patterns
10. ✅ **stratum** (NestJS/TypeScript) - Platform-specific patterns
11. ✅ **node-microservices** (Node.js) - Microservices-specific patterns
12. ✅ **ResilienceForge** (DevOps/K8s) - DevOps-specific patterns
13. ✅ **production-node-api** (Node.js) - Production-specific patterns
14. ✅ **dispatch** (TypeScript/Node.js) - Dispatch-specific patterns
15. ✅ **recruitment-api** (TypeScript/Node.js) - Recruitment-specific patterns
16. ✅ **social-network-api** (TypeScript/Node.js) - Social network-specific patterns
17. ✅ **CodeBridge** (Next.js/TypeScript) - Collaborative coding-specific patterns
18. ✅ **TalentIQ** (TypeScript/Node.js) - Talent management-specific patterns
19. ✅ **Nexus-AI** (Next.js/TypeScript) - AI platform-specific patterns
20. ✅ **PulseStream** (Next.js/TypeScript) - Streaming platform-specific patterns
21. ✅ **Forge3D** (Next.js/TypeScript) - 3D engine-specific patterns
22. ✅ **LexAI** (Next.js/TypeScript) - Document processing AI-specific patterns
23. ✅ **SecureDeploy** (NestJS/TypeScript) - Security platform-specific patterns
24. ✅ **Aurum** (Next.js/TypeScript) - Fintech platform-specific patterns
25. ✅ **Grove** (NestJS/TypeScript) - Education platform-specific patterns
26. ✅ **DevForge** (Node.js/TypeScript) - Development platform-specific patterns
27. ✅ **Civitas** (NestJS/TypeScript) - Civic engagement-specific patterns
28. ✅ **MedMind** (Node.js/TypeScript) - Healthcare platform-specific patterns
29. ✅ **Telemedicine Platform** (NestJS/TypeScript) - Telemedicine-specific patterns
30. ✅ **StreamVault** (NestJS/TypeScript) - Video streaming-specific patterns
31. ✅ **Settle** (NestJS/TypeScript) - Payment platform-specific patterns
32. ✅ **DocVault** (NestJS/TypeScript) - Document management-specific patterns
33. ✅ **Meridian** (Next.js/TypeScript) - Logistics platform-specific patterns
34. ✅ **Mosaic** (Next.js/TypeScript) - Multi-tenant platform-specific patterns
35. ✅ **Messaging Service** (Node.js/Express) - Messaging platform-specific patterns

The remaining 20+ projects will receive relevant patterns based on their specific domain and requirements, following the Option 2 strategy for comprehensive tech stack coverage without redundant work.
