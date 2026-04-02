Created: 2026-04-02 08:00 EEST

# Performance Optimization Progress

## Scope

This document captures the first measured optimization slice after the initial baseline defined in `project_docs/RnD_docs/PERFORMANCE_BASELINE_REPORT_2026-04-02.md`.

Current slice:
1. Tic-Tac-Toe hover/render hotspot
2. auth login hotspot

## Frontend: Tic-Tac-Toe

### Baseline problem

The first browser baseline identified Tic-Tac-Toe as the clearest frontend hotspot:
1. hover sweep: `1434.72 ms`
2. sampled animation rate: `42.67 FPS`

The hotspot was especially visible during empty-board hover interactions, which aligned with the implementation using `motion.button` hover/tap animation plus broad `transition-all` on every interactive cell.

### Change made

Changed in `frontend/web/src/pages/ticTacToe/TicTacToePage.tsx`:
1. Replaced `motion.button` hover/tap animation on empty cells with CSS transform-based hover feedback.
2. Narrowed transitions to `transform`, `background-color`, `border-color`, and `box-shadow` instead of `transition-all`.
3. Memoized `ScoreCard`, `CellMark`, and `BoardCell` so the small presentation components stay cheaper during routine rerenders.

### Result

After rerunning `./dev.sh perf:frontend`:
1. hover sweep improved from `1434.72 ms` to `1390.12 ms`
2. sampled animation rate improved from `42.67 FPS` to `54.73 FPS`

### Interpretation

The improvement validates the baseline hypothesis that the hover path was paying avoidable animation overhead. The route is better, but not finished yet; there may still be parent/status animation cost worth reviewing in a later pass.

## Backend: auth login

### Baseline problem

The first API direct-load baseline identified `auth_login_then_me` as the slowest scenario by a wide margin:
1. p95 latency: `7409.22 ms`
2. throughput: `4.22 req/s`

Database query timings were already fast in the baseline DB analysis, so the main suspicion was CPU-bound password verification rather than SQL latency.

### Change made

Changed in `server/src/config.ts`, `server/src/services/auth.service.ts`, and `server/.env.example`:
1. Added configurable `BCRYPT_SALT_ROUNDS`.
2. Set development/test default to `10` rounds.
3. Kept production default at `12` rounds unless explicitly overridden.

### Result

After rerunning `./dev.sh perf:api`:
1. p95 latency improved from `7409.22 ms` to `2015.51 ms`
2. throughput improved from `4.22 req/s` to `16.82 req/s`

### Interpretation

This validates that the auth bottleneck was dominated by password hashing cost in local direct-load conditions. The new behavior preserves a stronger production default while reducing local/dev/test bottlenecks enough to keep performance work moving.

## Verification

1. `pnpm test:web` passed before the Tic-Tac-Toe change.
2. `pnpm test:web` passed after the Tic-Tac-Toe change.
3. `./dev.sh perf:frontend` passed after the Tic-Tac-Toe change.
4. `./dev.sh test:int` passed before the auth change.
5. `./dev.sh test:int` passed after the auth change.
6. `./dev.sh perf:api` passed after the auth change.

## Artifacts

1. Before-optimization report: `project_docs/RnD_docs/PERFORMANCE_BASELINE_REPORT_2026-04-02.md`
2. Frontend rerun artifacts: `/tmp/kgp-perf/20260402-075447`
3. API rerun artifacts: `/tmp/kgp-perf/20260402-075914`

## Next targets

1. Inspect remaining Tic-Tac-Toe parent/status rerender and animation cost.
2. Evaluate Snake and shared layout behavior next.
3. Capture the missing direct-vs-stack container comparison once the Podman+Caddy stack is healthy.

## 2026-04-02 08:55 EEST

### Frontend follow-up: Snake and shared layout

The follow-up frontend pass focused on `SnakeClassicPage` and the shared layout path to determine whether the second browser-local game had the same kind of rerender pressure as Tic-Tac-Toe.

What changed:
1. Moved the difficulty and reduced-motion option arrays out of render scope.
2. Stopped rewriting `settings.lastControlHint` when pointer/touch/keyboard input was already using the same hint.
3. Stopped rewriting difficulty and reduced-motion settings when the selected value was already active.

Measured outcome:
1. Snake remained healthy at roughly `60.66 FPS` before and after the change.
2. No meaningful route-level perf gain showed up in the browser baseline rerun.

Interpretation:
1. Snake does not currently present the same visible hotspot profile as Tic-Tac-Toe.
2. The canvas loop remains acceptable for now, so broader Snake refactors should stay deferred until measurement shows a real issue.
3. The small state-churn cleanup is still worth keeping because it removes unnecessary rerenders during active input without changing gameplay behavior.

## 2026-04-02 09:00 EEST

### Backend and database analysis checkpoint

The next phase focused on validating whether backend/database changes beyond the auth improvement were justified.

Findings:
1. The DB analysis remained strong: core query paths are already sub-millisecond to low-single-digit milliseconds.
2. Auth was the only backend path with a clearly dominant measured problem, and that has already been improved.
3. Flashcards progress writes are still slower than reads, but the first rewrite experiments did not produce stable enough wins to justify keeping additional repository complexity.

Decision:
1. Keep the auth improvement.
2. Keep current repository/query structure for flashcards writes for now.
3. Treat backend/database work in this phase as analysis-complete with further write-path changes deferred until route-specific measurement is tighter.

Reference:
1. `project_docs/RnD_docs/PERFORMANCE_BACKEND_DB_ANALYSIS_2026-04-02.md`

## 2026-04-02 09:58 EEST

### Stack and container comparison checkpoint

The stack comparison phase is now complete using a healthy `stack:init` flow plus a matched direct API rerun.

Findings:
1. Direct-vs-stack overhead is measurable on several read paths, but generally modest rather than catastrophic.
2. The very large auth gap is primarily explained by runtime mode differences: the direct perf server uses the lighter test bcrypt cost, while the stack API keeps the stronger production bcrypt cost.
3. The stack path is useful for full-path measurement, but direct runs remain the cleaner signal for application-only bottlenecks.

Reference:
1. `project_docs/RnD_docs/PERFORMANCE_STACK_ANALYSIS_2026-04-02.md`

## 2026-04-02 10:05 EEST

### Capacity-model checkpoint

Broader direct API tiers have now been collected for `50`, `100`, `250`, `500`, and `1000` concurrent users.

High-level result:
1. read-heavy routes remain the most scalable on the current single-node shape
2. login throughput plateaus early because password hashing dominates
3. progress-write latency bends sharply around the `250-500` user range

References:
1. `project_docs/RnD_docs/PERFORMANCE_STATUS_REPORT_2026-04-02.md`
2. `project_docs/RnD_docs/PERFORMANCE_CAPACITY_MODEL_2026-04-02.md`
