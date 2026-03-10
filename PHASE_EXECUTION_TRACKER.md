# Phase Execution Tracker

Tracking source:
- Master plan: `GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md`
- Iteration runbook: `GAME_MODULARITY_ITERATION_PLAN_SHORT.md`

## Status legend
- `todo`
- `in_progress`
- `done`
- `blocked`

## Phase status
| Phase | Status | Owner | Last update | Evidence |
|---|---|---|---|---|
| P0 Guard rails | done | Codex | 2026-03-09 | Boundary policy doc, boundary script, CI wiring, baseline commands executed |
| P1 Topology migration | done | Codex | 2026-03-09 | Target root topology scaffold + compatibility aliases + phase gate pass |
| P2 Contracts/metadata | done | Codex | 2026-03-09 | Game metadata model extended end-to-end (DB/shared/API/tests) |
| P3 Allowlist/adapter loader | done | Codex | 2026-03-09 | Config allowlist + registry module + internal health route + enforcement in games/points |
| P4 Dual identity/BFF | done | Codex | 2026-03-09 | Delegated game session tokens + scoped enforcement for points flow |
| P5 Web dynamic routing | done | Codex | 2026-03-09 | App routes now built from web game registry |
| P6 Mobile readiness | done | Codex | 2026-03-09 | Game module structure conformance gate added to scripts and CI |
| P7 Flashcards full migration | done | Codex | 2026-03-09 | Flashcards backend adapter and web manifest wiring migrated with compatibility bridge |
| P8 Full test sweep | done | Codex | 2026-03-09 | Full suite green including managed e2e |
| P9 Full docs sweep | done | Codex | 2026-03-09 | Core docs updated + new modularity/security/game onboarding docs added |
| P10 Cleanup | done | Codex | 2026-03-10 | Temporary phase scripts removed, canonical dev commands normalized, full suite green |

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
10. `pnpm test:integration` -> passed (65 tests).

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

## P4 evidence (initial slice executed)
1. Integration-client datastore added:
   - `apps/api/src/db/migrations/003_integration_clients.sql`
2. Integration-client access layer added:
   - `apps/api/src/repositories/integration-client.repository.ts`
3. App client verification module added:
   - `apps/api/src/modules/app-client-auth.ts`
4. Seed updated with default app client for flashcards:
   - `apps/api/src/db/seed.ts`
5. Privileged route hardening added:
   - `apps/api/src/routes/points.ts` now requires valid `x-game-client-id` + `x-game-client-secret` for `POST /points/add` in addition to user auth.
6. Tests updated:
   - `apps/api/src/tests/points.integration.test.ts` now covers missing/invalid app client credentials.
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
1. Backend flashcards adapter runtime moved to game adapter layer:
   - `apps/api/src/games/flashcards/backend-adapter.ts`.
2. Flashcards backend route now delegates through adapter:
   - `apps/api/src/routes/flashcards.ts`.
3. Game-owned backend entrypoint added:
   - `games/flashcards/backend-adapter/src/index.ts`.
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

## P9 evidence (executed)
1. Updated core docs:
   - `README.md`
   - `ARCHITECTURE.md`
   - `IMPLEMENTATION_STATUS.md`
   - `USAGE.md`
   - `WORKLOG.md`
2. Added new modular docs:
   - `docs/game-module-spec.md`
   - `docs/backend-allowlist-security.md`
   - `docs/migration-guide.md`
   - `docs/add-game-checklist.md`

## P10 evidence (executed)
1. Removed temporary migration script:
   - deleted `phase:p1:verify` from root scripts.
2. Canonicalized dev command paths:
   - removed `dev:api` and `dev:web` aliases.
   - kept canonical `dev:server` and `dev:frontend:web`.
   - updated `dev.sh` to call canonical commands.
3. Full final verification:
   - `pnpm test:full` -> passed.
