# Phase Execution Tracker 2 Pending

Updated: 2026-03-11 00:16 EET

Tracking source:
- Master plan: [`GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md`](GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md)
- Iteration runbook: [`GAME_MODULARITY_ITERATION_PLAN_SHORT.md`](GAME_MODULARITY_ITERATION_PLAN_SHORT.md)

## Current interpretation
This tracker remains pending because the execution batch materially advanced the modularity plan, but the repository is still in compatibility mode for parts of the broader target architecture.

## What remains
1. Broader `server/` and `frontend/*` topology migration is still not the primary runtime shape.
2. Adapter loading remains partially static rather than fully loader-driven.
3. Mobile readiness is still scaffold-level.
4. Full cold-start/self-owned test orchestration is still in progress and is now tracked in [`TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`](TESTS_IMPROVEMENTS_IN_PROGRESS_4.md).
5. AI-optimized documentation/rules/check workflow is still pending and is also tracked in [`TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`](TESTS_IMPROVEMENTS_IN_PROGRESS_4.md).

## Status legend
- `todo`
- `in_progress`
- `done`
- `blocked`

## Phase status
| Phase | Status | Owner | Last update | Evidence |
|---|---|---|---|---|
| P0 Guard rails | done | Codex | 2026-03-09 | Boundary policy doc, boundary script, CI wiring, baseline commands executed |
| P1 Topology migration | in_progress | Codex | 2026-03-10 | Target topology scaffolded, but runtime still primarily lives under `apps/*` compatibility paths |
| P2 Contracts/metadata | done | Codex | 2026-03-09 | Game metadata model extended end-to-end (DB/shared/API/tests) |
| P3 Allowlist/adapter loader | in_progress | Codex | 2026-03-24 | Allowlist registry and health route are live, and app startup now routes through an allowlist-driven backend adapter loader; broader dynamic discovery/future adapter expansion is still open |
| P4 Dual identity/BFF | done | Codex | 2026-03-09 | Delegated game session tokens + scoped enforcement for points flow |
| P5 Web dynamic routing | done | Codex | 2026-03-09 | App routes now built from web game registry |
| P6 Mobile readiness | in_progress | Codex | 2026-03-10 | Directory conformance gate exists, but mobile shell/module contract work is still scaffold-level |
| P7 Flashcards full migration | done | Codex | 2026-03-10 | Web manifest is live and flashcards backend adapter now loads through a dedicated workspace package rooted under `games/flashcards/backend-adapter` |
| P8 Full test sweep | in_progress | Codex | 2026-03-24 | Expanded auth/points matrix plus first adapter-loader validation coverage are in place; broader blocked-launch/expanded multi-game coverage still partial |
| P9 Full docs sweep | in_progress | Codex | 2026-03-10 | Core docs updated, but repo state is still compatibility mode rather than fully-final architecture |
| P10 Cleanup | in_progress | Codex | 2026-03-10 | Canonical dev commands normalized, but compatibility paths and broader topology cleanup remain |

## P0 checklist
- [x] Create boundary policy document.
- [x] Add boundary check script.
- [x] Wire boundary check into CI gate.
- [x] Run baseline verification commands and record results.

## P0 evidence (executed)
1. `pnpm boundary:check` -> passed.
2. `pnpm typecheck` -> passed.
3. `pnpm lint` -> passed.
4. `pnpm test:unit` -> passed.
5. `pnpm test:web` -> passed.
6. `./scripts/dev-db.sh start` -> local postgres ready on `localhost:5432`.
7. `pnpm db:migrate && pnpm db:seed` -> dev DB prepared.
8. `DATABASE_URL=...kids_games_test pnpm --filter @kids-games/api exec tsx src/db/migrate.ts` -> test DB migrated.
9. `DATABASE_URL=...kids_games_test pnpm --filter @kids-games/api exec tsx src/db/seed.ts` -> test DB seeded.
10. `pnpm test:integration` -> passed (65 tests at the time).

## P1 evidence (executed)
1. Topology scaffolds created:
   - `server/`
   - `frontend/web/`
   - `frontend/mobile/`
   - `games/flashcards/{contracts,web,mobile,backend-adapter}`
2. Compatibility alias scripts added:
   - `dev:server`
   - `dev:frontend:web`
   - `phase:p1:verify`
3. Phase gate run:
   - `pnpm phase:p1:verify` -> passed.

## P2 evidence (executed)
1. DB migration added and applied:
   - `apps/api/src/db/migrations/002_game_metadata_expansion.sql`
2. Shared contracts updated:
   - `packages/shared/src/types.ts`
   - `packages/shared/src/schemas.ts`
3. Backend mapping/repo/seed updated:
   - `apps/api/src/repositories/game.repository.ts`
   - `apps/api/src/mappers.ts`
   - `apps/api/src/db/seed.ts`
   - `apps/api/src/db/seed-data/english-deck.json`
4. API and web behavior updated:
   - `/games` integration tests expanded
   - menu routing now uses `game.routeBase`
5. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P3 evidence (executed)
1. Allowlist config introduced:
   - `apps/api/src/config.ts` (`allowedGameIds`).
2. Registry module added:
   - `apps/api/src/modules/game-registry.ts`.
3. Allowlist enforcement applied:
   - `apps/api/src/routes/games.ts` now uses allowlisted enabled games only.
   - `apps/api/src/routes/points.ts` rejects non-allowlisted/non-enabled game IDs.
4. Internal diagnostics endpoint added:
   - `GET /internal/games/health` in `apps/api/src/routes/internal.ts`.
5. App route wiring updated:
   - `apps/api/src/app.ts`.
6. New/updated tests:
   - `apps/api/src/tests/internal.integration.test.ts` (new).
   - `apps/api/src/tests/points.integration.test.ts` (allowlist rejection case).
7. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.
8. Follow-up loader slice:
   - `apps/api/src/modules/game-adapter-loader.ts` added to resolve/register allowlisted enabled backend adapters and fail fast on missing/duplicate adapter configuration.
   - `apps/api/src/app.ts` now registers backend adapters through the loader rather than hardcoding flashcards route wiring at the app level.
   - `apps/api/src/modules/game-registry.ts` health output now reports loaded/missing/duplicate adapter IDs.
9. Verification run for loader slice:
   - `pnpm test:unit && ./dev.sh test:int && pnpm --filter @kids-games/api typecheck` -> passed.

## P4 evidence (initial slice executed)
1. Integration-client datastore added:
   - `apps/api/src/db/migrations/003_integration_clients.sql`
2. Integration-client access layer added:
   - `apps/api/src/repositories/integration-client.repository.ts`
3. App client verification module added:
   - `apps/api/src/modules/app-client-auth.ts`
4. Seed updated with default app client for flashcards:
   - `apps/api/src/db/seed.ts`
5. Initial privileged route hardening slice added direct app-client credential checks before the delegated game-session flow replaced that mechanism.
6. Tests updated for the initial slice before the delegated-token cutover.
7. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P4 evidence (completed core slice)
1. Shared contract added:
   - `GameSessionSchema` in `packages/shared/src/schemas.ts`.
2. Delegated token module added:
   - `apps/api/src/modules/game-session.ts`.
3. Auth endpoint added:
   - `POST /auth/game-session` in `apps/api/src/routes/auth.ts` (requires user auth + app client identity).
4. Privileged points flow updated:
   - `POST /points/add` now validates `x-game-session-token` claims (`typ`, `aud`, scope, user/game match).
   - delegated scope issuance now rejects scopes outside the integration client's allowlist and defaults to the game's declared required scopes.
5. JWT typing expanded:
   - `apps/api/src/types.ts`.
6. Tests updated:
   - `apps/api/src/tests/auth.integration.test.ts` (game-session issuance cases).
   - `apps/api/src/tests/points.integration.test.ts` (session token enforcement cases).
7. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P5 evidence (executed)
1. Registry-driven web routes introduced:
   - `apps/web/src/games/registry.tsx`.
2. Hardcoded flashcards routes removed from app shell:
   - `apps/web/src/App.tsx` now uses `buildGameRoutes()`.
3. New tests:
   - `apps/web/src/tests/gameRegistry.test.tsx`.
4. Verification run:
   - `pnpm build && pnpm test:web && pnpm test:unit && pnpm test:integration` -> passed.

## P6 evidence (executed)
1. Game structure conformance script added:
   - `scripts/check-game-structure.sh`.
2. Script integrated into root scripts:
   - `games:conformance` in `package.json`.
3. CI quality gate updated:
   - `.github/workflows/ci.yml` runs conformance check.
4. Verification run:
   - `pnpm games:conformance` -> passed.

## P7 evidence (executed)
1. Canonical flashcards backend adapter package added:
   - `games/flashcards/backend-adapter/package.json`
   - `games/flashcards/backend-adapter/src/index.ts`
2. Flashcards backend route now delegates through the workspace package:
   - `apps/api/src/routes/flashcards.ts`
3. Compatibility copy removed:
   - deleted `apps/api/src/games/flashcards/backend-adapter.ts`
4. Web game manifest added:
   - `games/flashcards/web/src/module.ts`.
5. Web registry now consumes game manifest:
   - `apps/web/src/games/registry.tsx`.
6. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P8 evidence (executed)
1. Root e2e harness updated:
   - `package.json` (`test:e2e` now uses `./dev.sh test:e2e`).
2. Dev harness recursion fixed:
   - `dev.sh` now calls `pnpm test:e2e:direct`.
3. E2E test stability fix:
   - `apps/web/e2e/flashcards.spec.ts` stable deck selector.
4. Full quality gate result:
   - `pnpm test:full` -> passed.
5. Follow-up loader coverage slice:
   - `apps/api/src/tests/game-adapter-loader.test.ts` adds unit coverage for adapter resolution, duplicate detection, missing-adapter failure, and successful registration.
   - `apps/api/src/tests/internal.integration.test.ts` now asserts adapter health reporting for the allowlisted flashcards adapter.
6. Verification run for loader coverage slice:
   - `pnpm test:unit && ./dev.sh test:int` -> passed.
7. Second loader coverage slice:
   - `apps/api/src/tests/game-adapter-loader.test.ts` now also covers multi-game load-plan ordering/filtering, combined duplicate-plus-missing plan reporting, duplicate-adapter registration failure, and adapter registration failure propagation.
8. Verification run for second loader coverage slice:
   - `pnpm test:unit && ./dev.sh test:int` -> passed.

## P9 evidence (executed)
1. Updated core docs:
   - `README.md`
   - [`ARCHITECTURE.md`](../RnD_docs/ARCHITECTURE.md)
   - [`IMPLEMENTATION_STATUS.md`](../RnD_docs/IMPLEMENTATION_STATUS.md)
   - [`USAGE.md`](../RnD_docs/USAGE.md)
   - [`WORKLOG_curr.md`](../RnD_docs/WORKLOG_curr.md)
2. Added new modular docs:
   - `docs/game-module-spec.md`
   - `docs/backend-allowlist-security.md`
   - `docs/migration-guide.md`
   - `docs/add-game-checklist.md`
3. Follow-up doc corrections applied after review:
   - env template now documents `ALLOWED_GAME_IDS` and `FLASHCARDS_CLIENT_SECRET`
   - status/tracker wording updated to reflect compatibility-mode reality instead of overstating full cleanup

## P10 evidence (executed)
1. Removed temporary migration script:
   - deleted `phase:p1:verify` from root scripts.
2. Canonicalized dev command paths:
   - removed `dev:api` and `dev:web` aliases.
   - kept canonical `dev:server` and `dev:frontend:web`.
   - updated `dev.sh` to call canonical commands.
3. Remaining cleanup still open:
   - broader `server/` / `frontend/*` migration is not complete
   - compatibility wrappers remain in place
4. Verification:
   - `pnpm test:full` -> passed after cleanup-adjacent changes, but final no-compatibility end-state is not yet reached.

## 2026-03-24 00:24 EET

Progress update:
1. The "full cold-start/self-owned test orchestration" item moved from pure pending to materially in progress.
2. `./dev.sh test:int` now provisions, prepares, and tears down its own isolated Postgres test container instead of relying on the long-lived local dev DB container.
3. `./dev.sh test:e2e` now uses the same isolated owned test DB flow for its DB-backed preparation.
4. `./dev.sh test:full` now owns a single shared isolated test DB session for the DB-backed substeps and reuses that prepared state within the top-level run.
5. Root `pnpm test:full` now routes through the `./dev.sh test:full` orchestrator.

Remaining follow-up for this tracker item:
1. CI still uses a separate service-container setup rather than the local shell-managed orchestration path.
2. Stack e2e remains a distinct verification path.
3. The broader modularity phases (`P1`, `P3`, `P6`, `P8`, `P9`, `P10`) are still open exactly as previously noted.
