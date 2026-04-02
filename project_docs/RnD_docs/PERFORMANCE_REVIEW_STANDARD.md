# Performance Review Standard

Created: 2026-04-02 00:20 EEST

Canonical performance-review checklist and workflow for Kids Games Platform.

Use this document when:
1. profiling the current platform
2. deciding whether an optimization should be implemented
3. evaluating a new game/module before and after implementation

## Core rules

1. Measure first, then optimize.
2. Do not add speculative complexity without evidence.
3. Keep manual performance commands opt-in and out of `test:full` by default.
4. Compare before/after using the same route set, same load tiers, and same environment notes.
5. Prefer simpler data flow and state flow over abstraction unless measurement shows the abstraction helps.

## Required measurement surfaces

### Frontend

Always review:
1. bundle size
2. route mount time
3. interaction latency
4. React render count
5. commit duration
6. animation smoothness or approximate FPS for interactive routes

Always inspect:
1. rerender causes
2. prop identity churn
3. handler recreation
4. unnecessary memoization
5. missing memoization on expensive derivations
6. state coupling that cascades into rerenders
7. animation overhead on slower browsers

### Backend

Always review:
1. latency percentiles
2. throughput
3. error rate
4. event loop lag
5. CPU and memory usage

Always inspect:
1. repeated DB calls
2. route serialization cost
3. auth/session flow overhead
4. logging cost if hot paths are noisy

### Database

Always review:
1. query latency
2. `EXPLAIN ANALYZE` for hot queries
3. existing indexes vs measured query patterns
4. pool saturation behavior
5. lock/wait signs where writes exist

### Containers and stack

Always review:
1. direct app path vs Podman+Caddy stack path
2. container CPU/memory
3. startup and readiness time
4. network/proxy overhead

## Frontend decision rules

Updated: 2026-04-02 10:24 EEST

The detailed React/frontend-specific rules now live in:
1. `project_docs/RnD_docs/REACT_PERFORMANCE_GUIDELINES.md`

This document keeps the cross-stack performance workflow and measurement contract, while the dedicated React guide owns:
1. rerender checks
2. memoization rules
3. state-shape rules
4. handler and interaction rules
5. motion/canvas/game-loop guidance
6. TanStack Query / Redux / WebSocket decision rules for frontend work

## Required benchmark matrix

Use the same matrix for every major before/after comparison:
1. unauthenticated menu load
2. login + `/auth/me`
3. flashcards deck list load
4. flashcards card list load
5. flashcards progress reads/writes
6. tic-tac-toe route load
7. tic-tac-toe hover and move interactions
8. snake route load
9. snake active gameplay trace
10. direct API path vs stack path

## Load-testing policy

1. Direct local/manual load tiers:
   - 25
   - 50
   - 100
   - 250
   - 500
   - 1000
2. Use profiling and capacity modeling to estimate the path toward `50,000` concurrent users.
3. Do not treat local direct generation of `50,000` users as a normal workflow requirement.
4. If a future task truly requires direct `50,000` concurrency, treat it as a separate distributed campaign.

## Required artifacts

Every major performance slice must produce:
1. route-level frontend findings
2. API latency/throughput summary
3. DB query-plan notes and index decisions
4. container overhead summary
5. explicit `keep / fix now / defer` recommendations
6. before/after report

## Future game/module checklist

Before implementing a new game/module, record:
1. likely hot routes
2. likely rerender-heavy views
3. expected network calls
4. persistence/write behavior
5. animation/canvas/heavy-asset risks
6. whether direct API, DB, or stack work is involved

After implementing a new game/module, verify:
1. route load still feels acceptable on slower browsers
2. new interactions do not create obvious rerender or animation regressions
3. any new API path is measured if it is on the user-critical path
4. any new DB-backed path has acceptable query behavior
5. the work is documented as:
   - measured and worth keeping
   - measured and not worth changing
   - deferred for later

## Current repo-specific defaults

Updated: 2026-04-02 00:20 EEST

1. React Router + custom fetch client are the current frontend defaults.
2. TanStack Query is not currently integrated.
3. Redux is not currently integrated.
4. WebSockets are not currently integrated.
5. Fastify + `pg` + direct repository SQL remain the backend baseline.
6. Podman `4.x+` compatibility must be preserved.

## React-specific reference

Added: 2026-04-02 10:20 EEST

For future React/module work, use the dedicated frontend guide alongside this broader standard:
1. `project_docs/RnD_docs/REACT_PERFORMANCE_GUIDELINES.md`
