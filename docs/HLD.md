# Distributed Redis-Backed Rate Limiter

## 1. Overview

This project implements a production-oriented distributed rate limiting service for Node.js and Express applications.

The system supports multiple rate limiting algorithms and provides a pluggable architecture for policies, algorithms, storage, failure handling, observability, and HTTP integration.

### Supported algorithms

- Fixed Window
- Sliding Window
- Token Bucket
- Leaky Bucket

Redis provides shared state so that rate limits remain consistent across multiple application instances.

---

# 2. Goals

The system is designed to provide:

- Distributed rate limiting
- Multiple rate limiting algorithms
- Per-route policies
- Per-user/IP/API-key identification
- Redis-backed shared state
- Configurable failure behavior
- HTTP 429 handling
- Standard rate-limit headers
- Health and readiness endpoints
- Testable architecture
- SOLID-oriented design
- Dependency injection
- Extensible algorithm registry

---

# 3. Non-Goals

The project does not attempt to provide:

- Authentication
- Authorization
- API gateway functionality
- Full API management
- Distributed tracing platform
- Long-term analytics storage

Those concerns can be integrated externally.

---

# 4. High-Level Architecture

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
Rate Limiting Algorithm
  |
  v
Redis Store
  |
  v
Redis
```

---

# 5. Request Flow

For every incoming request:

1. Middleware creates a `RateLimitContext`.
2. Policy engine resolves the applicable policy.
3. Key generator generates the distributed rate-limit key.
4. Algorithm registry creates the configured algorithm.
5. Algorithm consumes a request from the configured store.
6. Redis maintains distributed state.
7. The service returns a `RateLimitResult`.
8. Middleware adds HTTP rate-limit headers.
9. Allowed requests continue.
10. Rejected requests receive HTTP 429.

---

# 6. Core Components

## RateLimitMiddleware

Responsible for HTTP integration.

Responsibilities:

- Extract request information
- Build rate-limit context
- Invoke `RateLimitService`
- Add rate-limit headers
- Return HTTP 429
- Forward errors

It should not contain algorithm logic.

---

## RateLimitService

Application-level orchestration layer.

Responsibilities:

- Resolve policies
- Select algorithms
- Execute algorithms
- Record metrics
- Apply failure strategy

It does not directly manage Redis.

---

## PolicyEngine

Combines:

- Policy resolver
- Rate-limit key generator

The engine determines:

```text
Request
  |
  +-- Policy
  |
  +-- Distributed Key
```

---

## AlgorithmRegistry

Provides algorithm creation based on configuration.

Example:

```text
"fixed-window"  -> FixedWindow
"sliding-window" -> SlidingWindow
"token-bucket"  -> TokenBucket
"leaky-bucket"  -> LeakyBucket
```

This avoids large conditional blocks throughout the application.

---

# 7. Algorithms

## Fixed Window

Requests are counted inside fixed time windows.

Example:

```text
100 requests / 60 seconds
```

Advantages:

- Simple
- Fast
- Low memory

Disadvantages:

- Boundary burst problem

---

## Sliding Window

Redis Sorted Sets maintain request timestamps.

Typical operations:

```text
ZADD
ZREMRANGEBYSCORE
ZCARD
```

Advantages:

- More accurate than fixed windows
- Smooth request distribution

Disadvantages:

- Higher Redis operation cost
- Requires atomic operations for strict concurrency guarantees

---

## Token Bucket

Each client receives a bucket containing tokens.

Each request consumes a token.

Tokens are replenished at a configured rate.

Advantages:

- Supports bursts
- Smooth long-term traffic

---

## Leaky Bucket

Requests enter a bucket and are processed at a controlled rate.

Advantages:

- Smooth traffic
- Useful for protecting downstream systems

---

# 8. Policy Architecture

Policies are configuration-driven.

Example:

```ts
{
  name: "users-read",
  route: "/api/users",
  method: "GET",
  algorithm: "sliding-window",
  limit: 100,
  windowMs: 60_000
}
```

Policy resolution is separated from algorithm execution.

This follows the Single Responsibility Principle.

---

# 9. Redis Architecture

Redis acts as the distributed state store.

Multiple Node.js instances can therefore share the same rate-limit state.

```text
Instance A ─┐
Instance B ─┼──> Redis
Instance C ─┘
```

Without Redis:

```text
Instance A → local memory
Instance B → different local memory
```

which would produce inconsistent limits.

---

# 10. Failure Handling

Redis is an external dependency and can fail.

The service therefore supports failure strategies.

## Fail Open

When Redis fails:

```text
Redis error
   |
   v
Allow request
```

Useful when availability is more important than strict rate limiting.

## Fail Closed

When Redis fails:

```text
Redis error
   |
   v
Reject request
```

Useful when protecting a sensitive downstream service is more important than availability.

The strategy is injected rather than hard-coded.

---

# 11. HTTP Contract

Allowed:

```http
HTTP 200

RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 60
```

Rejected:

```http
HTTP 429

RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 10
Retry-After: 10
```

---

# 12. Health Endpoints

## `/health`

Checks application liveness.

```http
GET /health
```

Returns:

```json
{
  "status": "ok"
}
```

## `/ready`

Checks application readiness and Redis availability.

Redis unavailable:

```http
503 Service Unavailable
```

---

# 13. Observability

The system exposes an abstraction for metrics.

Important metrics include:

```text
rate_limit_allowed
rate_limit_rejected
rate_limit_errors
rate_limit_check_duration
```

Metrics should use bounded labels such as:

```text
policy
algorithm
route
```

Unbounded identifiers such as:

- IP
- user ID
- API key
- Redis key

must not be used as metric labels.

---

# 14. SOLID Design

## Single Responsibility

Each component has one primary responsibility.

Examples:

```text
PolicyEngine → policy resolution
Algorithm → rate limiting logic
Store → persistence
Middleware → HTTP integration
Metrics → observability
FailureStrategy → failure behavior
```

## Open/Closed

New algorithms can be registered without modifying the service.

## Liskov Substitution

Algorithms and stores implement their respective abstractions.

## Interface Segregation

Small interfaces are used for:

- stores
- policies
- metrics
- failure strategies
- key generation

## Dependency Inversion

High-level components depend on abstractions rather than Redis-specific implementations.

---

# 15. Scalability

The application layer is stateless.

```text
                 Load Balancer
                       |
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      Node.js       Node.js      Node.js
          \            |            /
           \           |           /
                    Redis
```

Additional application instances can therefore be added horizontally.

---

# 16. Security Considerations

Potential abuse scenarios include:

- IP spoofing
- API-key sharing
- Distributed clients
- Header manipulation
- Extremely high-cardinality identifiers

Trusted identity information should preferably come from an authenticated identity layer rather than arbitrary client-controlled headers.

---

# 17. Testing Strategy

Testing should occur at multiple levels:

```text
Unit
  ↓
Component
  ↓
Integration
  ↓
Concurrency
  ↓
Load
```

Unit tests validate algorithms and components.

Integration tests validate:

```text
Express
 → Middleware
 → Service
 → Algorithm
 → Redis
```

Concurrency tests validate distributed correctness.

---

# 18. Deployment

Local development:

```bash
docker compose up -d
npm run dev
```

Production:

```text
Load Balancer
      |
      v
Node.js containers
      |
      v
Managed Redis
```

Redis should preferably be deployed using a managed/high-availability Redis service in production.

---

# 19. Future Enhancements

Potential future improvements:

- Redis Lua scripts for atomic operations
- Redis Cluster
- OpenTelemetry
- Prometheus
- Grafana
- Dynamic policy management
- Configuration service
- Multi-region rate limiting
- Distributed tracing
- Adaptive rate limiting
- Circuit breakers
- Load testing
