# Phase Execution Tracker 2 Pending

Updated: 2026-03-25 00:30 EET

Tracking source:
- Master plan: [`GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md`](GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md)
- Iteration runbook: [`GAME_MODULARITY_ITERATION_PLAN_SHORT.md`](GAME_MODULARITY_ITERATION_PLAN_SHORT.md)

## Current interpretation
This tracker remains pending because the modularity plan is materially advanced, but later-phase mobile, future-game guidance, and orchestration work is still open.

## What remains
1. The core allowlist-driven backend adapter loader is in place, but broader future adapter expansion remains open when additional games are introduced.
2. Mobile readiness is still scaffold-level.
3. Full cold-start/self-owned test orchestration is still in progress and is now tracked in [`TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`](TESTS_IMPROVEMENTS_IN_PROGRESS_4.md).
4. Independent-agent add-game guidance is complete and now centralized in [`../../docs/add-game-guide.md`](../../docs/add-game-guide.md).

## Status legend
- `todo`
- `in_progress`
- `done`
- `blocked`

## Phase status
| Phase | Status | Owner | Last update | Evidence |
|---|---|---|---|---|
| P0 Guard rails | done | Codex | 2026-03-09 | Boundary policy doc, boundary script, CI wiring, baseline commands executed |
| P1 Topology migration | done | Codex | 2026-03-24 | Canonical runtime roots now live under `server/` and `frontend/web/`; root tooling, CI, Podman, and live docs point at the new package locations |
| P2 Contracts/metadata | done | Codex | 2026-03-09 | Game metadata model extended end-to-end (DB/shared/API/tests) |
| P3 Allowlist/adapter loader | in_progress | Codex | 2026-03-24 | Allowlist registry and health route are live, and app startup now routes through an allowlist-driven backend adapter loader; broader dynamic discovery/future adapter expansion is still open |
| P4 Dual identity/BFF | done | Codex | 2026-03-09 | Delegated game session tokens + scoped enforcement for points flow |
| P5 Web dynamic routing | done | Codex | 2026-03-09 | App routes now built from web game registry |
| P6 Mobile readiness | in_progress | Codex | 2026-03-10 | Directory conformance gate exists, but mobile shell/module contract work is still scaffold-level |
| P7 Flashcards full migration | done | Codex | 2026-03-10 | Web manifest is live and flashcards backend adapter now loads through a dedicated workspace package rooted under `games/flashcards/backend-adapter` |
| P8 Full test sweep | done | Codex | 2026-03-24 | Full local suite and stack e2e are green; backend allowlist/loader coverage, web blocked-route coverage, and stack-aware e2e verification are all in place |
| P9 Full docs sweep | done | Codex | 2026-03-25 | Core docs, usage paths, status docs, and tracker wording now reflect the canonical `server/` and `frontend/web/` runtime; remaining add-game guidance is split into its own pending tracker |
| P10 Cleanup | done | Codex | 2026-03-25 | Legacy compatibility wrappers and stale command references were removed from the active workflow; broader future-game/mobile work now lives in separate follow-up phases rather than cleanup debt |

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
4. Final cutover completed:
   - tracked backend package moved from `apps/api` into `server/`
   - tracked web package moved from `apps/web` into `frontend/web/`
   - root workspace config, `dev.sh`, CI, Podman, and live docs updated to use the new canonical roots

## P2 evidence (executed)
1. DB migration added and applied:
   - `server/src/db/migrations/002_game_metadata_expansion.sql`
2. Shared contracts updated:
   - `packages/shared/src/types.ts`
   - `packages/shared/src/schemas.ts`
3. Backend mapping/repo/seed updated:
   - `server/src/repositories/game.repository.ts`
   - `server/src/mappers.ts`
   - `server/src/db/seed.ts`
   - `server/src/db/seed-data/english-deck.json`
4. API and web behavior updated:
   - `/games` integration tests expanded
   - menu routing now uses `game.routeBase`
5. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P3 evidence (executed)
1. Allowlist config introduced:
   - `server/src/config.ts` (`allowedGameIds`).
2. Registry module added:
   - `server/src/modules/game-registry.ts`.
3. Allowlist enforcement applied:
   - `server/src/routes/games.ts` now uses allowlisted enabled games only.
   - `server/src/routes/points.ts` rejects non-allowlisted/non-enabled game IDs.
4. Internal diagnostics endpoint added:
   - `GET /internal/games/health` in `server/src/routes/internal.ts`.
5. App route wiring updated:
   - `server/src/app.ts`.
6. New/updated tests:
   - `server/src/tests/internal.integration.test.ts` (new).
   - `server/src/tests/points.integration.test.ts` (allowlist rejection case).
7. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.
8. Follow-up loader slice:
   - `server/src/modules/game-adapter-loader.ts` added to resolve/register allowlisted enabled backend adapters and fail fast on missing/duplicate adapter configuration.
   - `server/src/app.ts` now registers backend adapters through the loader rather than hardcoding flashcards route wiring at the app level.
   - `server/src/modules/game-registry.ts` health output now reports loaded/missing/duplicate adapter IDs.
9. Verification run for loader slice:
   - `pnpm test:unit && ./dev.sh test:int && pnpm --filter @kids-games/api typecheck` -> passed.

## P4 evidence (initial slice executed)
1. Integration-client datastore added:
   - `server/src/db/migrations/003_integration_clients.sql`
2. Integration-client access layer added:
   - `server/src/repositories/integration-client.repository.ts`
3. App client verification module added:
   - `server/src/modules/app-client-auth.ts`
4. Seed updated with default app client for flashcards:
   - `server/src/db/seed.ts`
5. Initial privileged route hardening slice added direct app-client credential checks before the delegated game-session flow replaced that mechanism.
6. Tests updated for the initial slice before the delegated-token cutover.
7. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P4 evidence (completed core slice)
1. Shared contract added:
   - `GameSessionSchema` in `packages/shared/src/schemas.ts`.
2. Delegated token module added:
   - `server/src/modules/game-session.ts`.
3. Auth endpoint added:
   - `POST /auth/game-session` in `server/src/routes/auth.ts` (requires user auth + app client identity).
4. Privileged points flow updated:
   - `POST /points/add` now validates `x-game-session-token` claims (`typ`, `aud`, scope, user/game match).
   - delegated scope issuance now rejects scopes outside the integration client's allowlist and defaults to the game's declared required scopes.
5. JWT typing expanded:
   - `server/src/types.ts`.
6. Tests updated:
   - `server/src/tests/auth.integration.test.ts` (game-session issuance cases).
   - `server/src/tests/points.integration.test.ts` (session token enforcement cases).
7. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P5 evidence (executed)
1. Registry-driven web routes introduced:
   - `frontend/web/src/games/registry.tsx`.
2. Hardcoded flashcards routes removed from app shell:
   - `frontend/web/src/App.tsx` now uses `buildGameRoutes()`.
3. New tests:
   - `frontend/web/src/tests/gameRegistry.test.tsx`.
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
   - `server/src/routes/flashcards.ts`
3. Compatibility copy removed:
   - deleted `server/src/games/flashcards/backend-adapter.ts`
4. Web game manifest added:
   - `games/flashcards/web/src/module.ts`.
5. Web registry now consumes game manifest:
   - `frontend/web/src/games/registry.tsx`.
6. Verification run:
   - `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web` -> passed.

## P8 evidence (executed)
1. Root e2e harness updated:
   - `package.json` (`test:e2e` now uses `./dev.sh test:e2e`).
2. Dev harness recursion fixed:
   - `dev.sh` now calls `pnpm test:e2e:direct`.
3. E2E test stability fix:
   - `frontend/web/e2e/flashcards.spec.ts` stable deck selector.
4. Full quality gate result:
   - `pnpm test:full` -> passed.
5. Follow-up loader coverage slice:
   - `server/src/tests/game-adapter-loader.test.ts` adds unit coverage for adapter resolution, duplicate detection, missing-adapter failure, and successful registration.
   - `server/src/tests/internal.integration.test.ts` now asserts adapter health reporting for the allowlisted flashcards adapter.
6. Verification run for loader coverage slice:
   - `pnpm test:unit && ./dev.sh test:int` -> passed.
7. Second loader coverage slice:
   - `server/src/tests/game-adapter-loader.test.ts` now also covers multi-game load-plan ordering/filtering, combined duplicate-plus-missing plan reporting, duplicate-adapter registration failure, and adapter registration failure propagation.
8. Verification run for second loader coverage slice:
   - `pnpm test:unit && ./dev.sh test:int` -> passed.
9. Third loader/runtime coverage slice:
   - `server/src/tests/app-loader-startup.test.ts` now covers successful allowlisted adapter registration during app startup and propagation of startup-time adapter registration failures.
   - `server/src/tests/internal.integration.test.ts` now asserts the exact allowlisted flashcards health payload returned by `/internal/games/health`.
10. Verification run for third loader/runtime coverage slice:
   - `pnpm test:unit` -> passed (41 total tests, including 30 API unit tests).
   - `./dev.sh test:int` -> passed (77 integration tests).
11. Fourth loader/runtime coverage slice:
   - `server/src/tests/allowlist.integration.test.ts` now proves seeded-but-unallowlisted games are blocked from `/games` and `/games/:gameId`.
   - `server/src/tests/allowlist.integration.test.ts` also proves `/internal/games/health` reports missing allowlisted IDs deterministically when config includes a non-existent game.
12. Verification run for fourth loader/runtime coverage slice:
   - `pnpm test:unit` -> passed (41 total tests, including 30 API unit tests).
   - `./dev.sh test:int` -> passed (79 integration tests).
13. Web blocked-route coverage slice:
   - `frontend/web/src/pages/GameUnavailablePage.tsx` adds a dedicated unsupported-game page for web fallback handling.
   - `frontend/web/src/tests/AppRoutes.test.tsx` proves unsupported game routes are blocked in the web router.
   - `frontend/web/e2e/flashcards.spec.ts` now covers unsupported-game route blocking in both dev and stack browser flows.
14. Stack verification hardening:
   - `frontend/web/package.json` stack e2e command now targets the API through Caddy at `http://localhost:8080/api`.
   - `infra/podman/compose.yml` now binds stack Postgres to host port `55434` so stack verification can coexist with the local dev/test DB.
   - `infra/podman/Dockerfile.web` now asserts the blocked-route bundle exists during the image build and copies the built assets into a clean nginx document root.
15. Final phase gate verification:
   - `./dev.sh test:full` -> passed.
   - `pnpm test:e2e:stack` -> passed (3 stack e2e tests).

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
   - `docs/add-game-guide.md`
3. Follow-up doc corrections applied after review:
   - env template now documents `ALLOWED_GAME_IDS` and `FLASHCARDS_CLIENT_SECRET`
   - status/tracker wording updated to reflect compatibility-mode reality instead of overstating full cleanup
4. Final doc sweep against canonical runtime roots:
   - direct local dev instructions now use `./dev.sh server` and `./dev.sh web`
   - status docs now describe the canonical `server/` and `frontend/*` runtime without compatibility-mode caveats
   - add-game guidance is consolidated into the canonical `docs/add-game-guide.md`

## P10 evidence (executed)
1. Removed temporary migration script:
   - deleted `phase:p1:verify` from root scripts.
2. Canonicalized dev command paths:
   - removed transitional `dev:server` and `dev:frontend:web` root wrappers.
   - updated `dev.sh` and live docs to use the canonical runtime entrypoints directly.
3. Removed active legacy env fallback:
   - `dev.sh` now requires `server/.env` and no longer treats `apps/api/.env` as part of the active workflow.
4. Verification:
   - `pnpm build` -> passed.
   - `./dev.sh test:full` -> passed.

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
3. The broader modularity phases (`P3`, `P6`, `P9`, `P10`) are still open exactly as previously noted.

## 2026-03-24 23:28 EET

P3 remaining-work assessment:
1. The core `P3` acceptance criteria are now materially satisfied in the current backend runtime:
   - allowlisted enabled games are the only games loaded and exposed
   - startup registers backend adapters through the allowlist-driven loader
   - missing or duplicate adapters fail fast
   - `/internal/games/health` reports adapter status deterministically
2. The remaining `P3` work is now narrower than the original phase definition:
   - keep the loader contract stable as new games are added
   - expand from the built-in adapter set only when a second real backend adapter exists
   - keep the remaining add-game guidance and future cleanup aligned as new adapters are introduced
3. Execution recommendation:
   - treat `P3` as functionally strong enough to stop being the immediate focus
   - move the roadmap priority past `P1`, with only small `P3` hardening if later work exposes gaps

## 2026-03-24 23:40 EET

P1 completion update:
1. The backend package now lives under `server/`, and the web shell package now lives under `frontend/web/`.
2. Root workspace configuration, `dev.sh`, CI, Podman build/runtime paths, and boundary checks now treat those locations as canonical.
3. The old `apps/api` and `apps/web` runtime ownership is no longer the primary execution shape.
4. Remaining related work belongs to later cleanup/doc phases rather than to `P1` itself.
