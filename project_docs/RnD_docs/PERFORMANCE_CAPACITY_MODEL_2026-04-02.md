Created: 2026-04-02 10:05 EEST

# Performance Capacity Model

## Scope

This model is based on direct API load tiers collected at:
1. `/tmp/kgp-perf/capacity-50/api-load.json`
2. `/tmp/kgp-perf/capacity-100/api-load.json`
3. `/tmp/kgp-perf/capacity-250/api-load.json`
4. `/tmp/kgp-perf/capacity-500/api-load.json`
5. `/tmp/kgp-perf/capacity-1000/api-load.json`

The goal is not to claim that this single machine proves `50,000` concurrent-user readiness. The goal is to identify:
1. where current routes start to bend
2. which workloads saturate first
3. what must change before the platform can move toward that scale

## Measured saturation shape

### Read-heavy routes

Selected p95 latencies and throughput:
1. `games_list`
   - `50 users`: p95 `88.68 ms`, throughput `900.84 req/s`
   - `250 users`: p95 `255.60 ms`, throughput `1414.00 req/s`
   - `500 users`: p95 `389.14 ms`, throughput `1792.57 req/s`
   - `1000 users`: p95 `657.17 ms`, throughput `2152.67 req/s`
2. `flashcards_cards`
   - `50 users`: p95 `30.30 ms`, throughput `1683.05 req/s`
   - `250 users`: p95 `138.63 ms`, throughput `2272.22 req/s`
   - `500 users`: p95 `170.38 ms`, throughput `3094.17 req/s`
   - `1000 users`: p95 `274.11 ms`, throughput `3363.89 req/s`
3. `flashcards_progress_read`
   - `50 users`: p95 `24.85 ms`, throughput `2740.57 req/s`
   - `250 users`: p95 `73.07 ms`, throughput `3892.76 req/s`
   - `500 users`: p95 `139.76 ms`, throughput `4138.96 req/s`
   - `1000 users`: p95 `288.95 ms`, throughput `4091.40 req/s`

Interpretation:
1. Read-heavy routes still scale reasonably on a single node up to the tested local bands.
2. By `500-1000` concurrent users, latency is clearly rising, but the system is still serving thousands of read requests per second on the easier routes.

### Auth path

`auth_login_then_me`:
1. `50 users`: p95 `3437.02 ms`, throughput `16.41 req/s`
2. `100 users`: p95 `6543.18 ms`, throughput `16.53 req/s`
3. `250 users`: p95 `15622.63 ms`, throughput `16.56 req/s`
4. `500 users`: p95 `30744.84 ms`, throughput `16.48 req/s`
5. `1000 users`: p95 `60808.91 ms`, throughput `16.59 req/s`

Interpretation:
1. Login throughput is essentially capped around `16.5 req/s` on this node.
2. The dominant limiter is password hashing cost, not SQL.
3. Concurrent login-heavy traffic will become unacceptable far earlier than read-heavy traffic.

### Write paths

`flashcards_progress_position_write`:
1. `50 users`: p95 `104.75 ms`, throughput `490.00 req/s`
2. `100 users`: p95 `208.80 ms`, throughput `485.40 req/s`
3. `250 users`: p95 `562.90 ms`, throughput `438.09 req/s`
4. `500 users`: p95 `2284.39 ms`, throughput `282.29 req/s`
5. `1000 users`: p95 `2720.31 ms`, throughput `382.37 req/s`

`flashcards_progress_known_write`:
1. `50 users`: p95 `150.36 ms`, throughput `394.42 req/s`
2. `100 users`: p95 `258.34 ms`, throughput `389.37 req/s`
3. `250 users`: p95 `561.62 ms`, throughput `450.76 req/s`
4. `500 users`: p95 `1203.43 ms`, throughput `419.87 req/s`
5. `1000 users`: p95 `2449.38 ms`, throughput `408.96 req/s`

Interpretation:
1. Progress writes bend much earlier than read-heavy routes.
2. Around `250` users, p95 write latency is already in the half-second range.
3. Around `500+` users, write latency is into multi-second territory and should be treated as degraded service.

## What the current stack can realistically handle

Current single-node local shape suggests:
1. read-heavy traffic scales the farthest
2. authenticated login traffic is the earliest hard limiter
3. progress-write heavy workloads are the next limiter after login

Practical reading of the current shape:
1. The project can support meaningful local/dev-scale and early staging-scale concurrency on read paths.
2. It is not ready to claim `50,000` concurrent users on the current single-node application shape.
3. The path to `50,000` requires architecture and infrastructure changes, not just micro-optimizations.

## What would need to change to move toward 50,000 concurrent users

### Auth

1. Separate login-heavy capacity planning from ordinary authenticated request planning.
2. Consider isolating or horizontally scaling auth separately if login bursts matter.
3. Revisit password-hash cost strategy and operational shape for production traffic, balancing security and throughput.

### Write-heavy flashcards progress

1. Revisit write-path design with tighter route-specific measurement.
2. Consider reducing synchronous write work per request.
3. Consider batching, asynchronous aggregation, or more specialized persistence design if write-heavy usage becomes primary.

### Application and infrastructure

1. Horizontal API scaling behind the edge proxy/load balancer
2. Stronger connection-pool and DB concurrency strategy
3. Possibly a cache layer for the right read-heavy endpoints if production evidence supports it
4. Better apples-to-apples stack-vs-direct measurement in a staging-like environment

### Database

1. Current query plans are not the immediate blocker
2. DB changes should follow real growth in data size, write contention, or lock behavior
3. PgBouncer/read replicas remain future options, not immediate requirements based on current evidence

## Recommendation

Treat the current repo as:
1. measurably improving
2. read-path capable at meaningful local concurrency
3. still clearly limited by login throughput and write-path latency long before `50,000` concurrent users

The next responsible step is not to promise `50,000` on the current shape. The next responsible step is to use these curves to prioritize:
1. auth capacity strategy
2. progress-write strategy
3. horizontally scalable staging verification later
