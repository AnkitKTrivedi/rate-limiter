# Distributed Redis Rate Limiter

Production-oriented distributed rate limiter built with **Node.js, Express, TypeScript and Redis**.

The project demonstrates multiple rate-limiting algorithms using a clean, extensible architecture based on SOLID principles, dependency injection, strategy pattern and registry pattern.

## Features

- Fixed Window
- Sliding Window
- Token Bucket
- Leaky Bucket
- Redis-backed distributed state
- Configurable policies
- Per-user/IP/API-key rate-limit keys
- Fail-open / fail-closed strategies
- HTTP 429 responses
- `RateLimit-*` headers
- `Retry-After`
- Health/readiness endpoints
- Configuration validation
- Observability abstraction
- Unit testing
- Integration testing
- Concurrency testing
- Docker support

---

## Architecture

```text
Client
  |
  v
Express
  |
  v
Rate Limit Middleware
  |
  v
RateLimitService
  |
  +---- PolicyEngine
  |
  +---- AlgorithmRegistry
  |
  +---- FailureStrategy
  |
  +---- Metrics
  |
  v
Algorithm
  |
  v
Redis Store
  |
  v
Redis
```

See [docs/HLD.md](docs/HLD.md) for the detailed architecture.

---

## Tech Stack

| Technology     | Purpose                  |
| -------------- | ------------------------ |
| Node.js        | Runtime                  |
| TypeScript     | Type safety              |
| Express        | HTTP API                 |
| Redis          | Distributed state        |
| Jest           | Unit testing             |
| Supertest      | HTTP integration testing |
| Docker         | Local infrastructure     |
| Docker Compose | Redis orchestration      |

---

## Rate Limiting Algorithms

### Fixed Window

Counts requests within fixed intervals.

```text
100 requests / 60 seconds
```

Simple and efficient but susceptible to boundary bursts.

### Sliding Window

Uses Redis Sorted Sets to track request timestamps.

```text
ZADD
ZREMRANGEBYSCORE
ZCARD
```

Provides more accurate rolling-window enforcement.

### Token Bucket

Supports controlled traffic with bursts.

```text
capacity = 5
refillRate = 0.1
```

### Leaky Bucket

Controls the processing rate and smooths traffic.

---

## Project Structure

```text
src/
├── algorithms/
│   ├── fixed-window/
│   ├── sliding-window/
│   ├── token-bucket/
│   └── leaky-bucket/
│
├── config/
│
├── core/
│   ├── AlgorithmRegistry.ts
│   ├── PolicyEngine.ts
│   ├── RateLimitPolicy.ts
│   ├── RateLimitResult.ts
│   └── RateLimitService.ts
│
├── middleware/
│   └── rateLimiter.ts
│
├── observability/
│
├── policies/
│
├── stores/
│
├── validation/
│
├── health/
│
├── routes/
│
├── app.ts
└── server.ts

tests/
├── unit/
└── integration/

docs/
└── HLD.md
```

---

## Requirements

- Node.js 22+
- npm
- Docker Desktop

---

## Installation

```bash
npm install
```

---

## Start Redis

```bash
docker compose up -d
```

Check:

```bash
docker compose ps
```

Redis should report a healthy status.

---

## Environment Variables

Create `.env`:

```env
PORT=6000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

---

## Start Development Server

```bash
npm run dev
```

The API runs on:

```text
http://localhost:6000
```

---

## Example API

### Users

```bash
curl http://localhost:6000/api/users
```

Expected:

```json
{
  "success": true,
  "message": "Users fetched successfully"
}
```

---

## Rate Limit Headers

Successful responses include:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 60
```

When the limit is exceeded:

```http
HTTP 429 Too Many Requests
```

with:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 10
Retry-After: 10
```

---

## Health Checks

### Liveness

```bash
curl http://localhost:6000/health
```

### Readiness

```bash
curl http://localhost:6000/ready
```

`/ready` verifies Redis availability.

---

## Testing

Run all tests:

```bash
npm test
```

Run tests serially:

```bash
npm test -- --runInBand
```

Type checking:

```bash
npx tsc --noEmit
```

---

## Design Principles

The project intentionally follows:

### SOLID

Responsibilities are separated between policies, algorithms, stores, middleware, failure handling and observability.

### KISS

Infrastructure abstractions are introduced only when they provide meaningful separation.

### DRY

Common behavior such as HTTP headers, policy validation and dependency creation is centralized.

### Dependency Injection

Dependencies are assembled at the application composition root.

### Strategy Pattern

Failure behavior can be changed without modifying the rate-limit service.

### Registry Pattern

Algorithms are registered and resolved dynamically.

---

## Distributed Architecture

Application instances are stateless:

```text
                 Load Balancer
                       |
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       Node.js      Node.js      Node.js
          \            |            /
           \           |           /
                    Redis
```

Because rate-limit state is stored in Redis, all instances share the same state.

---

## Failure Handling

Two strategies are supported.

### Fail Open

Redis failure allows requests to continue.

Suitable when application availability is the priority.

### Fail Closed

Redis failure rejects requests.

Suitable when strict traffic protection is the priority.

---

## Production Considerations

Before production deployment, the following should be completed or evaluated:

- Redis atomic Lua operations
- Redis timeouts
- Redis retry strategy
- Connection pool/configuration
- Integration tests
- Concurrent request tests
- Load testing
- Prometheus/OpenTelemetry integration
- Redis high availability
- Redis Cluster where required
- Authentication-aware key generation
- Security review

---

## Roadmap

- [x] Fixed Window
- [x] Sliding Window
- [x] Token Bucket
- [x] Leaky Bucket
- [x] Redis stores
- [x] Policy Engine
- [x] Algorithm Registry
- [x] Failure strategies
- [x] Policy validation
- [x] HTTP 429
- [x] Rate-limit headers
- [x] Health/readiness
- [x] Observability abstraction
- [x] Docker support
- [x] HLD documentation
- [x] Repository documentation
- [x] Redis atomic Lua scripts
- [x] Integration tests
- [x] Concurrency tests
