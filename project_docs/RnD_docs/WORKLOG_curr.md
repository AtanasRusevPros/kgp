# Kids Games Platform — Current Work Log

Append-only dated log for current and future documentation/workflow updates.

See [`WORKLOG_initial.md`](WORKLOG_initial.md) for the original narrative work log and earlier project history.

## 2026-03-23 23:45 EET

Summary:
- Reorganized root-level project documentation into `project_docs/RnD_docs`, `project_docs/ongoing`, `project_docs/history`, and `project_docs/future`.
- Renamed archival documents with date suffixes where appropriate, while keeping core root docs (`README.md`, `AGENTS.md`, `CLAUDE.md`) in place.
- Normalized internal markdown links after the move and adjusted staging so Git recognizes the reorganization as renames where possible.

Commit message:
`reorganize project docs and normalize internal references`

## 2026-03-24 00:20 EET

Summary:
- Assessed the real repository state against the active ongoing planning documents instead of relying on documentation alone.
- Confirmed that the ongoing docs are directionally accurate: the repo is still in compatibility mode, with target topology present but runtime still centered on `apps/api` and `apps/web`.
- Confirmed that `P1` remains incomplete because `server/` and `frontend/*` are still scaffold/documentation boundaries rather than the canonical runtime paths.
- Confirmed that `P3` remains incomplete because allowlist metadata and health reporting exist, but backend adapter loading is still effectively static and flashcards-specific.
- Confirmed that `P5` is improved but not fully final because the web shell uses a manifest-driven registry shape while still directly importing and wiring flashcards-specific route elements.
- Confirmed that `P6` remains scaffold-level because mobile readiness is currently enforced mostly through directory/entry presence checks rather than a real mobile shell or contract-driven runtime.
- Confirmed that `P8` remains partial because useful auth/allowlist tests exist, but broader loader/conformance/blocked-launch coverage and CI enforcement are not yet complete, and stack E2E is not wired into CI.
- Confirmed that `TESTS_IMPROVEMENTS_IN_PROGRESS_4.md` is still valid for DB-backed orchestration: `test:int` and `test:full` still depend on shared local Postgres lifecycle rather than fully isolated, self-owned setup and teardown.
- Noted one stale area in the pending docs: the AI-optimized documentation/workflow task has progressed further than recorded because the `project_docs` reorganization already happened on 2026-03-23.
- Recommended next execution order based on real code state:
  1. Finish DB-backed test orchestration hardening first.
  2. Complete `P3` real allowlist-driven adapter loading.
  3. Expand `P8` test and CI coverage around the new runtime behavior.
  4. Then perform the true `P1` runtime cutover from `apps/*` to `server/` and `frontend/*`.
  5. Keep `P6` mobile work behind those steps unless mobile becomes an immediate product priority.
  6. Finish `P9` docs sweep and `P10` cleanup only after the runtime architecture is actually final.

Notes:
- This entry reflects analysis against actual repository files, scripts, and CI configuration, not only against the planning markdown.
- No repository code behavior was changed as part of this assessment; this was a documentation append only.

## 2026-03-24 00:24 EET

Summary:
- Implemented the first test-orchestration hardening slice from `TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`.
- `./dev.sh test:int` now owns an isolated Postgres test container, applies migrations and seed data there, runs integration tests, and cleans up only the container it created.
- `./dev.sh test:e2e` now uses the same owned isolated test DB flow before starting the local API runtime for Playwright.
- `./dev.sh test:full` now acts as the top-level orchestrator for the local full suite and reuses one prepared isolated test DB across the DB-backed substeps instead of bootstrapping repeatedly.
- Root `pnpm test:full` now delegates to `./dev.sh test:full` so the orchestrated path is canonical.
- Extended `scripts/dev-db.sh` to accept environment-driven container name, port, and database overrides so the same helper can manage both long-lived dev DB resources and isolated test DB resources.
- Tightened the Postgres readiness check in `scripts/dev-db.sh` so isolated DB startup no longer emits the transient socket error observed during the first verification pass.

Verification:
- Baseline before edits:
  - `pnpm test:unit` -> passed
  - `pnpm test:web` -> passed
  - `./dev.sh test:int` -> passed
- After edits:
  - `bash -n dev.sh` -> passed
  - `bash -n scripts/dev-db.sh` -> passed
  - `./dev.sh test:int` -> passed using an isolated `kids-games-test-postgres-*` container
  - `pnpm test:full` -> passed using `./dev.sh test:full`
  - `podman ps -a --filter name=kids-games-test-postgres ...` -> no leftover managed test DB containers after cleanup

Remaining follow-up:
- CI still uses its own Postgres service-container setup and has not yet been aligned with the local shell-managed orchestration flow.
- Stack e2e remains separate from this local isolated DB-backed orchestration path.
- Local DB-backed test commands still rely on `apps/api/.env` for non-DB configuration, so the DB lifecycle is now self-owned even though the broader environment bootstrap is not yet fully zero-setup.

## 2026-03-24 07:29 EET

Summary:
- Marked the first local test-orchestration hardening slice as completed in the current working documentation.
- Updated `README.md` so the root command reference and test guidance now describe isolated owned test DB behavior for `test:int`, `test:e2e`, and `test:full`.
- Updated `project_docs/RnD_docs/USAGE.md` so the detailed local workflow guide matches the current wrapper behavior, including isolated test DB ownership and the top-level `test:full` reuse flow.
- Updated `project_docs/RnD_docs/IMPLEMENTATION_STATUS.md` to reflect the current local test-orchestration status and the latest verified test counts.
- Left the task tracked as partially complete at the broader project level because CI alignment, stack-path alignment, and fully zero-setup local bootstrap are still follow-up work.

Commit message:
`harden local test orchestration and sync test workflow docs`

## 2026-03-24 07:38 EET

Summary:
- Renamed the active test-orchestration tracker from `TESTS_IMPROVEMENTS_PENDING_4.md` to `TESTS_IMPROVEMENTS_IN_PROGRESS_4.md` to match the current implementation state.
- Added an explicit status section to that tracker clarifying what is now done and what still remains before the work can be considered fully complete.
- Updated repository documentation references so they point to the renamed in-progress tracker consistently.

Commit message:
`harden local test orchestration, rename tracker to in-progress, and sync docs`

## 2026-03-24 07:49 EET

Summary:
- Compacted the outstanding-work view from the earlier repo-state analysis.
- Remaining major items from the ongoing planning docs are:
  - finish real backend adapter loading and validation (`P3`)
  - expand matching modularity/security/blocked-launch coverage and CI gating (`P8`)
  - complete the true runtime cutover from `apps/*` to `server/` and `frontend/*` (`P1`)
  - complete the remaining mobile-readiness slice (`P6`)
  - finish the broader docs/cleanup endgame (`P9`, `P10`)
  - continue the remaining CI/stack/bootstrap follow-up in `TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`
- Best autonomous next move identified:
  1. implement the bounded `P3` backend adapter-loader slice
  2. add the matching `P8` tests/coverage immediately after
  3. reassess the broader `P1` runtime cutover only after that

## 2026-03-24 07:49 EET

Status:
- Starting autonomous execution of `P3` and `P8`.
- Immediate focus:
  1. replace the current partially static backend adapter wiring with a stricter allowlist-driven loader path
  2. add matching tests for loader validation, allowlist behavior, and failure paths
  3. update tracker/status docs after verification

## 2026-03-24 07:52 EET

Summary:
- Implemented the first bounded `P3` backend adapter-loader slice.
- Added `apps/api/src/modules/game-adapter-loader.ts` to resolve and register allowlisted enabled backend adapters and fail fast on missing or duplicate adapter configuration.
- Updated `apps/api/src/app.ts` so backend route registration now flows through the allowlist-driven loader instead of directly hardcoding flashcards route registration at the app level.
- Updated `apps/api/src/modules/game-registry.ts` health output so `/internal/games/health` now reports loaded adapter IDs plus missing/duplicate adapter conditions.
- Kept the current scope intentionally narrow: this is a stricter allowlist-driven loader path for the built-in adapter set, not yet a broader dynamic discovery system.
- Implemented the matching first `P8` coverage slice:
  - added `apps/api/src/tests/game-adapter-loader.test.ts`
  - expanded `apps/api/src/tests/internal.integration.test.ts` to assert adapter health reporting
- Updated project status/tracker docs to reflect the stronger `P3` and `P8` state and the latest verified suite counts.

Verification:
- Baseline before edits:
  - `pnpm test:unit` -> passed
  - `./dev.sh test:int` -> passed
- After edits:
  - `pnpm test:unit` -> passed
  - `./dev.sh test:int` -> passed
  - `pnpm --filter @kids-games/api typecheck` -> passed

Remaining follow-up:
- Backend adapter loading is now allowlist-driven at startup, but still limited to the built-in adapter set rather than a broader future multi-game/dynamic module expansion model.
- Broader `P8` work still remains for additional blocked-launch, invalid-adapter-startup, and multi-game coverage.

## 2026-03-24 20:51 EET

Summary:
- Performed a review pass over the markdown docs and the runtime/test surface affected by the recent `P3`/`P8` loader work.
- Fixed `project_docs/ongoing/TESTS_IMPROVEMENTS_IN_PROGRESS_4.md` so its `Current state` and `What remains` sections now match the actual completed local orchestration slice instead of contradicting the later progress updates.
- Fixed `project_docs/RnD_docs/ARCHITECTURE.md` so the integration-test count in the CI architecture diagram matches the currently verified suite size.
- Reconfirmed the changed backend path through unit/integration verification, API typecheck, and a direct API startup smoke check against an isolated review Postgres container.
