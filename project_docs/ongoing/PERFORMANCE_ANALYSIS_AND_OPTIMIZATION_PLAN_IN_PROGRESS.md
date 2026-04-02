# Performance Analysis and Optimization Plan

Status: IN_PROGRESS  
Created: 2026-04-02 00:20 EEST  
Owner: Autonomous agents + maintainers  
References:
- `README.md`
- `docs/add-game-guide.md`
- `project_docs/RnD_docs/USAGE.md`
- `project_docs/RnD_docs/IMPLEMENTATION_STATUS.md`
- `project_docs/RnD_docs/PERFORMANCE_REVIEW_STANDARD.md`

## Summary

Build a two-track performance program for the current platform:
1. establish a measured baseline across frontend, API, database, and Podman stack behavior
2. implement only validated optimizations
3. rerun the same measurements and publish before/after evidence

Performance work must stay outside the normal verification path and run only through dedicated opt-in commands.

## Decision Lock Update (timestamped)

Updated: 2026-04-02 00:20 EEST

The following defaults are locked for this work unless the user explicitly changes them:

1. Optimize only measured hotspots first.
2. Keep Podman `4.x+` compatibility.
3. Do not introduce Redux unless a measured bottleneck proves it is the least-complex fix.
4. Do not introduce WebSockets unless a concrete current HTTP path is shown to be the bottleneck.
5. Treat direct `50,000` concurrent-user generation as a later optional distributed campaign, not the default dev workflow.
6. Use direct manual benchmarks in the `100-1000` user range plus profiling and capacity modeling as the canonical evaluation path.
7. Add two docs:
   - reusable standards/checklist in `project_docs/RnD_docs`
   - active execution playbook/tracker in `project_docs/ongoing`
8. Keep performance commands opt-in and excluded from regular CI and `test:full` unless explicitly invoked.

## Current repo reality that this plan must preserve

1. Frontend uses plain React Router plus a custom fetch client.
2. TanStack Query is not currently used.
3. Redux is not currently used.
4. WebSockets are not currently used.
5. Backend uses Fastify + `pg` + direct repository SQL.
6. DB pool is currently small and static (`max: 10`).
7. Local stack uses Podman rootless containers and Caddy.
8. Existing games include:
   - flashcards: backend-backed
   - tic-tac-toe: browser-local
   - snake-classic: browser-local

## Goal

Produce a repeatable performance workflow that:
1. measures current behavior consistently
2. identifies actual hotspots instead of speculative ones
3. introduces only justified optimizations
4. documents what is worth doing now vs deferring
5. leaves future game/module tasks with a clear performance checklist and verification contract

## Benchmark matrix (fixed)

Every baseline and after-optimization run must compare the same scenarios:

1. unauthenticated menu load
2. login + `/auth/me`
3. flashcards deck list load
4. flashcards card list load
5. flashcards progress reads/writes
6. tic-tac-toe route load
7. tic-tac-toe hover and move interactions
8. snake route load
9. snake active gameplay trace
10. `/games`
11. `/flashcards/decks/:id/cards`
12. `/flashcards/decks/:id/progress`
13. auth endpoints
14. direct API path vs Podman+Caddy stack path

## Required metrics

### Frontend

1. bundle size
2. route mount time
3. interaction latency
4. render count
5. React commit duration
6. FPS/jank during hover and gameplay
7. route-specific observations for slower browsers

### Backend

1. latency percentiles
2. throughput
3. error rate
4. event loop lag
5. CPU usage
6. memory usage

### Database

1. query latency
2. slowest queries
3. `EXPLAIN ANALYZE` notes for hot queries
4. connection pool behavior
5. lock/wait observations if relevant

### Containers and stack

1. container CPU usage
2. container memory usage
3. direct-API vs stack-network overhead
4. startup times
5. runtime path overhead through Caddy/Podman

## Phased execution plan

### P0 — Manual-only performance toolkit and command surface

Tasks:
1. Add dedicated manual-only performance commands at the repo root.
2. Keep them separate from `test:full` and regular verification.
3. Cover:
   - frontend profiling/bundle analysis
   - API direct load tests
   - stack load tests
   - DB query/plan analysis
   - before/after report generation
4. Choose one primary HTTP/API load mechanism and one browser-focused measurement path.
5. Ensure artifact output paths are predictable and documented.

Acceptance criteria:
1. Performance commands are available but opt-in only.
2. No regular suite depends on them.
3. Artifact locations are documented and stable.

### P1 — Baseline collection before optimization

Tasks:
1. Capture baseline metrics for the full benchmark matrix.
2. Save baseline results in a stable report format.
3. Record environment notes that affect comparability:
   - OS
   - browser
   - Node version
   - Podman mode/path
   - direct vs stack run mode

Acceptance criteria:
1. Baseline exists before any optimization work is claimed.
2. Before/after comparison points are identical in scope.

### P2 — React/frontend hotspot analysis

Priority files:
1. `frontend/web/src/pages/ticTacToe/TicTacToePage.tsx`
2. `frontend/web/src/pages/snakeClassic/SnakeClassicPage.tsx`
3. `frontend/web/src/pages/flashcards/FlashcardGamePage.tsx`

Tasks:
1. Measure render frequency and causes for hot routes/components.
2. Identify prop identity churn and handler recreation.
3. Identify pointless memoization to remove.
4. Identify expensive derived values worth memoizing.
5. Review state coupling that creates rerender cascades.
6. Inspect `motion`/animation cost on slower browsers.
7. Evaluate whether `Layout` or route-level checks create avoidable rerenders.
8. Produce a hotspot report with:
   - fix now
   - keep as-is
   - defer

Special required evaluations:
1. Determine whether Tic-Tac-Toe hover hiccups are driven by `motion` hover/tap props, SVG gradient/effect cost, repeated derived objects, or parent rerenders.
2. Determine whether Snake’s loop/state model causes unnecessary React rerenders instead of keeping fast-changing state in refs/canvas-only paths.
3. Determine whether TanStack Query would materially help shared read-heavy API state or only add complexity.
4. Document why WebSockets remain unnecessary for the current architecture unless later evidence changes that.

Acceptance criteria:
1. React changes are based on measurement, not speculation.
2. Each proposed optimization has a documented reason.
3. Route-specific hiccup acceptance criteria exist for slower browsers.

### P3 — Backend and database analysis

Tasks:
1. Profile route latency and allocation hotspots for:
   - auth
   - `/games`
   - flashcards reads
   - flashcards progress writes
2. Inspect logging, auth refresh flow, repeated DB calls, and startup/retry behavior for avoidable cost.
3. Review query plans for hot read/write paths.
4. Verify existing indexes against measured hot queries.
5. Evaluate whether pool sizing, query count reduction, or summary-table logic changes are justified.
6. Explicitly document whether route-level caching, batching, or serialization tuning is worth doing now.

Acceptance criteria:
1. DB and API recommendations are tied to measured hot routes.
2. Index/query/pool decisions are documented with evidence.

### P4 — Container and stack analysis

Tasks:
1. Benchmark direct API path vs Podman+Caddy stack path.
2. Measure proxy/network overhead.
3. Capture container startup/runtime costs.
4. Inspect whether current container defaults are meaningful bottlenecks.
5. Evaluate future-only options such as PgBouncer, extra caching, or stack topology changes without forcing them into the immediate phase unless data demands it.

Acceptance criteria:
1. Direct-vs-stack cost is measured rather than guessed.
2. Container tuning recommendations are separated into:
   - do now
   - defer

### P5 — Capacity modeling toward 50,000 concurrent users

Tasks:
1. Run direct manual load tiers:
   - 25
   - 50
   - 100
   - 250
   - 500
   - 1000
2. Identify where throughput, DB pool saturation, latency, or container limits begin to degrade materially.
3. Convert measured throughput/resource use into an explicit capacity model.
4. State clearly:
   - what the current stack can handle
   - what would need to change to move toward 50,000 concurrent users

Acceptance criteria:
1. Capacity statements are based on measured data plus modeling.
2. The plan does not pretend local dev hardware directly proves 50,000-user readiness.

### P6 — Optimization pass and after-metrics

Tasks:
1. Implement only validated hotspots.
2. Rerun the same benchmark matrix.
3. Publish before/after evidence.
4. Record:
   - what improved
   - what did not improve
   - what was explicitly deferred and why

Acceptance criteria:
1. Before/after report exists.
2. Optimizations are evidence-backed.
3. Deferred items remain visible in backlog form.

### P7 — Documentation and future-workflow integration

Tasks:
1. Add reusable performance standards doc in `project_docs/RnD_docs`.
2. Keep this active plan/tracker in `project_docs/ongoing`.
3. Update `docs/add-game-guide.md` so each future game/module task:
   - performs an upfront lightweight performance-risk review
   - records route/render/network/storage risks early
   - performs end-of-task performance verification when the task affects rendering, interaction, backend round-trips, persistence, canvas/animation, or heavy assets
4. Update any other relevant top-level docs so the new standards/playbook are discoverable.

Acceptance criteria:
1. Future agents can follow the performance workflow without asking the user for more decisions.
2. New game/module work includes explicit performance consideration and verification hooks.

## React-specific decision rules

These rules are mandatory for the optimization phase:

1. Remove memoization when derivation is trivial and memo maintenance adds noise/cost.
2. Add memoization only when:
   - derivation is expensive, or
   - referential stability materially reduces rerenders downstream
3. Prefer simple local derived values over extra state where safe.
4. Consolidate state only when measurement shows rerender chains or update-order issues.
5. Avoid abstract factory/state patterns that add indirection without measured benefit.
6. Avoid Redux unless there is a measured, high-confidence justification and the benefit clearly outweighs the added complexity.
7. Do not introduce TanStack Query unless measured request duplication, cache invalidation needs, or loading-state complexity justify it.

## Required artifacts

Every major performance phase must leave behind:

1. route-level frontend findings
2. backend latency/throughput summary
3. DB query-plan notes and index decisions
4. container overhead summary
5. explicit `keep / fix now / defer` recommendations
6. before/after report using the same scenarios and environment notes

## What is explicitly out of scope by default

1. speculative large refactors without evidence
2. WebSocket migration for browser-local games
3. Redux adoption for general app state
4. forcing direct 50,000-user generation in the normal local workflow
5. making performance commands part of `test:full` or standard CI by default

## Recommended first implementation slice

1. Add the manual-only command surface and artifact directories.
2. Establish the baseline report format.
3. Capture the first baseline on:
   - menu
   - flashcards reads/writes
   - tic-tac-toe route + hover
   - snake route + gameplay trace
   - direct API vs stack API
4. Use that baseline to decide the first real optimization slice instead of guessing.

## 2026-04-02 00:40 EEST

Progress update:
1. This tracker is now promoted from `PENDING` to `IN_PROGRESS`.
2. Active implementation focus:
   - add manual-only performance commands and scripts
   - add the reusable standards doc under `project_docs/RnD_docs`
   - add the first baseline report flow and run it once before optimization work begins
3. Immediate requirement for the first execution slice:
   - leave regular CI and `test:full` untouched
   - keep direct-load tiers in the `25-1000` range
   - capture a before-optimization report before any broader code cleanup starts

## 2026-04-02 07:35 EEST

Progress update:
1. Manual-only performance commands are now wired into `dev.sh` and the root/package script surfaces.
2. The reusable standards doc now lives at `project_docs/RnD_docs/PERFORMANCE_REVIEW_STANDARD.md`.
3. The first before-optimization baseline run completed and produced:
   - report: `project_docs/RnD_docs/PERFORMANCE_BASELINE_REPORT_2026-04-02.md`
   - raw artifacts: `/tmp/kgp-perf/20260402-072835`
4. Current measured signals from that first run:
   - Tic-Tac-Toe hover path is materially slower than the Snake route baseline and is the first frontend hotspot to inspect.
   - `auth_login_then_me` is by far the slowest API scenario in the first direct-load pass and should be the first backend hotspot review target.
   - direct stack comparison was skipped in this run because the Podman+Caddy stack was not already healthy.

Remaining immediate work:
1. inspect the measured Tic-Tac-Toe and auth hotspots before making any broader cleanup changes
2. capture the missing direct-vs-stack comparison when the stack is up
3. then begin the first measured optimization slice

## 2026-04-02 08:00 EEST

Progress update:
1. The first measured optimization slice is now in flight and has already validated improvements on both a frontend hotspot and a backend hotspot.
2. Tic-Tac-Toe hover interactions were lightened by replacing `motion.button` hover/tap animation on empty cells with narrower CSS transform-based hover feedback and memoizing the small board components.
3. Auth hashing cost is now configurable via `BCRYPT_SALT_ROUNDS`, with development/test defaulting to `10` rounds and production retaining `12` by default.

Measured outcomes so far:
1. Tic-Tac-Toe hover sweep improved from `1434.72 ms` to `1390.12 ms`.
2. Tic-Tac-Toe sampled animation rate improved from `42.67 FPS` to `54.73 FPS`.
3. `auth_login_then_me` improved from `p95 7409.22 ms` / `4.22 req/s` to `p95 2015.51 ms` / `16.82 req/s`.

Evidence:
1. Before-optimization report: `project_docs/RnD_docs/PERFORMANCE_BASELINE_REPORT_2026-04-02.md`
2. In-progress optimization evidence: `project_docs/RnD_docs/PERFORMANCE_OPTIMIZATION_PROGRESS_2026-04-02.md`

Remaining immediate work:
1. inspect whether Tic-Tac-Toe still has avoidable parent/status rerender cost beyond the hover path
2. evaluate Snake and shared layout behavior next, since Snake is currently healthier and can serve as the comparison route
3. restore a healthy Podman+Caddy stack path so the missing direct-vs-stack measurements can be collected

## 2026-04-02 08:55 EEST

Progress update:
1. The Snake/shared-layout follow-up pass is complete.
2. Snake-specific cleanup removed repeated settings writes during active input and moved static option arrays out of render scope.
3. The browser rerun showed Snake remaining healthy with no meaningful route-level gain or regression, so broader Snake refactors remain deferred.

Implication:
1. Tic-Tac-Toe remains the only frontend route with a strong measured hotspot signature so far.
2. The next performance phase should lean more heavily into backend/database analysis while keeping the missing direct-vs-stack measurement on deck.
