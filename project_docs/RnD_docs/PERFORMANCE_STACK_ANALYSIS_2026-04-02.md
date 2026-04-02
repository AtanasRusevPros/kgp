Created: 2026-04-02 09:58 EEST

# Performance Stack and Container Analysis

## Scope

This checkpoint compares:
1. direct local API benchmarking at `http://127.0.0.1:3400`
2. routed stack benchmarking through Caddy at `http://localhost:8080/api`

Matched artifact pair:
1. direct: `/tmp/kgp-perf/20260402-094954/api-load.json`
2. stack: `/tmp/kgp-perf/20260402-094912/stack-api-load.json`

## Important setup note

For this repository, `./dev.sh stack:init` is the correct first-time path before stack benchmarking. Using `./dev.sh stack:up` alone can leave the API booting before migrations/seed are present, which makes the stack unhealthy and invalidates any comparison run.

## Comparison highlights

### Read-heavy routes

Direct vs stack p95:
1. `games_list`: `85.52 ms` direct vs `92.08 ms` stack
2. `flashcards_cards`: `16.84 ms` direct vs `28.47 ms` stack
3. `flashcards_progress_read`: `10.12 ms` direct vs `16.33 ms` stack

Interpretation:
1. The routed stack adds measurable overhead on several read paths, but the penalty is not extreme.
2. This looks like a combination of container/proxy/network overhead rather than a database bottleneck.

### Write paths

Direct vs stack p95:
1. `flashcards_progress_position_write`: `140.00 ms` direct vs `146.28 ms` stack
2. `flashcards_progress_known_write`: `151.69 ms` direct vs `241.52 ms` stack

Interpretation:
1. Position writes are close enough that the stack overhead is modest.
2. Known-card writes degrade more noticeably through the stack, but the current data is still too noisy to justify a code rewrite on its own.

### Auth path

Direct vs stack p95:
1. `auth_login_then_me`: `1803.58 ms` direct vs `7220.27 ms` stack

Interpretation:
1. This is not a pure container/proxy cost comparison.
2. The direct perf server runs with `NODE_ENV=test`, which uses the lighter development/test bcrypt cost.
3. The stack API runs in production mode, which keeps the stronger production bcrypt cost.
4. So the auth gap here is dominated more by runtime security settings than by Caddy or Podman networking.

## Conclusions

### Keep

1. Use the stack benchmark to understand full-path overhead.
2. Treat direct benchmarks as the cleaner signal for route-level application bottlenecks.

### Do not conclude

1. Do not claim that all stack overhead is caused by containers alone.
2. Do not use the auth route as a pure proxy/network comparison until direct and stack runs use equivalent bcrypt settings.

### Next follow-up options

1. If cleaner stack-vs-direct auth comparison is needed later, run an explicit apples-to-apples test with equivalent bcrypt settings.
2. For now, the stack data is good enough to show that full-path overhead exists, but not enough to justify infra changes such as PgBouncer or topology changes.
