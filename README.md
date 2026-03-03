🚀 Node.js API Gateway

A high-performance Node.js API Gateway with:

JWT Authentication

Redis-backed Token Bucket Rate Limiting

Request Logging via Winston

Multi-core support with Node.js cluster

Proxying to multiple microservices

Example Nginx config for production deployment

⚠️ Brutally honest: This gateway is suitable for learning and medium-scale internal apps. It is not a full enterprise-grade API Gateway like Kong or AWS API Gateway. Security, observability, and scaling depend on your Node cluster and Redis setup.

![PHOTO-2026-03-03-10-32-37](https://github.com/user-attachments/assets/b27db693-a69e-45f3-bec5-f66d637b3b7b)

💡 Features
Token Bucket Rate Limiter

Distributed, Redis-backed rate limiting.

Configurable capacity and refill rate per route.

Works per API key or IP if API key is missing.

Returns X-RateLimit-* headers and proper 429 Retry-After.

JWT Authentication

Protect routes using JWT tokens.

Simple integration with any JWT secret.

Request Logging

Logs HTTP method, URL, status, duration, IP, API key.

Fully JSON-formatted for ingestion into ELK / Grafana.

Proxying

Uses http-proxy-middleware to route requests to microservices.

Handles upstream errors gracefully with 502 Bad Gateway.

Multi-Core Support

Node.js cluster module forks workers equal to CPU cores.

Each worker handles independent event loop connections.

OS distributes connections to workers, but Nginx ensures even load balancing.

Nginx Integration

Reverse proxy in front of Node cluster.

Connection pooling with keepalive reduces TCP overhead.

Round-robin load balancing distributes requests across workers.

Health check endpoint for monitoring.


📊 Performance & Architecture
Load Test Summary (Autocannon)
![PHOTO-2026-03-03-08-40-50](https://github.com/user-attachments/assets/1ed3f925-894d-4e5c-b490-f7fc0cc0b99b)
![PHOTO-2026-03-03-08-41-05](https://github.com/user-attachments/assets/f2fe6821-cb83-4603-b02b-4c0594f101e9)
![PHOTO-2026-03-03-08-41-19](https://github.com/user-attachments/assets/b1197279-7431-4cab-9458-54461b5d5401)
Metric	Test 1 (
Global/No Key)	Test 2 (Client 3)	Test 3 (Client 1)
Total Requests	~90,000	~85,000	~84,000
2xx Successes	124	124	124

Non-2xx (Blocked / 429)	89,337	84,691	83,770
Socket Errors	55	48	47
Avg Latency	8.06 ms	7.65 ms	7.52 ms

Avg Req/Sec	5,964	5,654	5,593

Key Observations:

Token Bucket Behavior:
Capacity = 100, refill = 1.667 tokens/sec → total allowed requests during 15s test ≈ 125. Matches exactly with 124 successful requests.

Throughput:
Most traffic (>99.8%) is rejected (429). Avg latency ~7–8ms, P99 ~20ms → gateway rejects requests immediately without touching backend.

Client Consistency:
All clients hit same success count → bucket applied globally, Redis ensures atomicity with Lua.

Socket Errors:
~45–55 per test → local network stack stress from 90k requests over 15s. Not rate-limit errors.

Node.js Cluster Design

Single-threaded Node cannot utilize all cores → cluster module forks N workers.

Each worker runs independent event loop.

OS distributes TCP connections per worker, but keep-alive connections can stick a client to one worker → uneven load.

Cluster + Nginx solves this: Nginx distributes connections across workers, pooling multiple persistent connections to avoid overloading one worker.

Nginx Design
upstream api_gateway {
  server 127.0.0.1:3000 max_fails=3 fail_timeout=10s;
  keepalive 32;
}

Why Nginx:

Reverse proxy & load balancer: Round-robin across Node workers.

Connection pooling: keepalive reduces TCP handshake overhead.

Health checks & failover: Skip unhealthy workers.

Prevents a client from sticking to one worker, ensuring even load distribution.

Redis & Atomic Token Bucket

Each worker maintains its own Redis connection.

Lua script ensures atomic token decrement & refill.

Redis key shared globally → rate limiting is consistent across all workers.

No race conditions even with high concurrency.

Metrics Insight:

Request rejection is immediate → minimal latency overhead.

Throughput mostly corresponds to error responses (2.2–2.4 MB/s) for rejected requests.

Architecture Overview
[Client]
   |
   v
[Nginx Reverse Proxy]
   |-- connection pooling (keepalive)
   |-- round-robin load balancing
   |
   v
[Node.js API Gateway (Cluster)]
   |-- JWT Auth
   |-- Rate Limiter (Token Bucket + Redis + Lua)
   |-- Logger (Winston)
   |-- Proxy to upstream services
   |
   +--> [Users Service]
   +--> [Orders Service]
   +--> [Products Service]
🧪 Local Testing Servers
node services/users.js
node services/orders.js
node services/products.js

Allows testing the gateway without full backend implementations.

🔧 Environment Variables
PORT=3000
REDIS_URL=redis://localhost:6379

SERVICE_USERS=http://localhost:4001
SERVICE_ORDERS=http://localhost:4002
SERVICE_PRODUCTS=http://localhost:4003

DEFAULT_RATE_LIMIT=100
DEFAULT_WINDOW_SECS=60
JWT_SECRET=hallo
⚠️ Limitations

Performance limited by Redis and Node cluster.

Basic JWT security; no refresh tokens or brute-force protection.

Observability limited to JSON logging; no metrics dashboard.

Not modularized for massive enterprise-scale growth.

📈 Roadmap

Circuit breaker for upstream failures

Prometheus/Grafana metrics

Improved JWT lifecycle and security

Docker + Kubernetes deployment examples
