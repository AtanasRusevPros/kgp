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

## 2026-03-24 20:54 EET

Status:
- Starting the next bounded `P8` slice autonomously.
- Immediate focus:
  1. add missing failure-path coverage for the backend adapter loader
  2. add broader multi-game loader-plan coverage without widening into `P1`
  3. update tracker/worklog evidence after verification

## 2026-03-24 20:55 EET

Summary:
- Completed the next bounded `P8` slice for backend adapter-loader coverage.
- Expanded `apps/api/src/tests/game-adapter-loader.test.ts` to cover:
  - multi-game load-plan ordering/filtering
  - combined duplicate-plus-missing plan reporting
  - duplicate-adapter registration failure
  - adapter registration failure propagation
- Reverified the bounded backend surface after the new coverage with:
  - `pnpm test:unit`
  - `./dev.sh test:int`

Remaining follow-up:
- `P8` still needs broader invalid-startup and expanded multi-game/runtime-path coverage if we want to go beyond the current test-only adapter-plan proofs.

## 2026-03-24 21:11 EET

Summary:
- Reviewed the latest uncommitted `P8` follow-up slice across documentation, test coverage, and the affected runtime surface.
- Synced stale test-count references in the docs, clarified one historical tracker line so it reads correctly as prior evidence, and kept the current status docs aligned with the latest verified totals.
- Preparing the final narrow verification and commit for this loader-coverage and docs-sync mini-slice.

## 2026-03-24 22:37 EET

Summary:
- Reassessed the remaining roadmap after the recent `P3` and `P8` commits.
- Chose to continue with `P8` autonomously before attempting the broader `P1` cutover.
- Immediate focus:
  1. add runtime-path coverage around backend adapter registration during app startup
  2. strengthen internal registry-health assertions for the current allowlisted flashcards path
  3. update tracker/worklog evidence and any affected test counts after verification

## 2026-03-24 22:39 EET

Summary:
- Completed another bounded `P8` slice focused on startup/runtime-path confidence around the backend adapter loader.
- Added `apps/api/src/tests/app-loader-startup.test.ts` to cover successful allowlisted adapter registration during app startup and failure propagation when adapter registration rejects.
- Tightened `apps/api/src/tests/internal.integration.test.ts` so `/internal/games/health` now asserts the exact current flashcards allowlist payload instead of only broad shape checks.
- Updated the affected test-count documentation after the extra API unit coverage and reverified with:
  - `pnpm test:unit` -> passed (`41` total unit tests, `30` API unit tests)
  - `./dev.sh test:int` -> passed (`77` integration tests)

## 2026-03-24 22:39 EET

Status:
- Continuing directly into another `P3/P8` follow-up slice without pausing.
- Immediate focus:
  1. prove seeded-but-unallowlisted games are blocked at runtime
  2. prove registry health reports missing allowlisted IDs deterministically
  3. update tracker/worklog evidence after verification

## 2026-03-24 22:46 EET

Summary:
- Completed another backend-focused `P3/P8` slice around blocked allowlist behavior.
- Added `apps/api/src/tests/allowlist.integration.test.ts` to prove:
  - seeded-but-unallowlisted games are blocked from `/games` and `/games/:gameId`
  - `/internal/games/health` reports missing allowlisted IDs deterministically when config includes a non-existent game
- Reverified the affected backend surface with:
  - `pnpm test:unit` -> passed (`41` total unit tests, `30` API unit tests)
  - `./dev.sh test:int` -> passed (`79` integration tests)
- Review result:
  - backend `P3/P8` coverage is materially stronger now
  - the most meaningful remaining `P8` work has shifted to broader web blocked-launch behavior and stack/CI gating rather than another immediate backend loader test

## 2026-03-24 23:00 EET

Roadmap summary:
- Next best step remains the unfinished part of `P8`: add broader web-side blocked-launch coverage and stronger stack/CI gating so the modularity and allowlist rules are proven end to end, not only in backend tests.
- After that, do any remaining small `P3` hardening only if new tests expose gaps in the backend adapter-loader contract; the core loader itself is already in a solid in-progress state.
- Then start `P1`, the real runtime cutover from compatibility-mode structure to the intended `server/` and `frontend/*` runtime shape, which will make the architecture cleaner and remove ambiguity about the canonical execution paths.
- After `P1`, complete `P6` only when mobile becomes a real project priority; its value is to make the architecture genuinely mobile-ready instead of scaffold-only.
- Once the runtime shape is stable, finish `P9` so the docs fully describe the final reality rather than transitional compatibility-mode caveats.
- Last, finish `P10` cleanup by removing compatibility shims, deprecated paths, and temporary aliases so the repo ends in a cleaner canonical state.

## 2026-03-24 23:25 EET

Summary:
- Completed the remaining `P8` work for web blocked-route coverage and the stack-backed verification gate.
- Added a dedicated unsupported-game page plus router coverage in the web shell, and extended the shared Playwright suite so unsupported game routes are explicitly blocked in browser verification.
- Hardened the stack verification path so stack e2e uses the API through Caddy and the stack DB binds to host port `55434`, avoiding collisions with the local dev/test DB on `5432`.
- Final `P8` verification on the completed tree:
  - `./dev.sh test:full` -> passed
  - `pnpm test:e2e:stack` -> passed (`3` stack e2e tests)
- Status: `P8` can now be treated as complete; the next remaining roadmap focus shifts back to `P3` analysis/future hardening and the later `P1` cutover.

## 2026-03-24 23:28 EET

Summary:
- Reassessed the remaining `P3` work against the current backend runtime after the completed `P8` gate.
- Confirmed that the core `P3` goal is now materially achieved:
  - app startup registers backend routes through the allowlist-driven adapter loader
  - missing or duplicate adapters fail fast
  - allowlisted/unallowlisted runtime behavior is covered
  - `/internal/games/health` reports adapter state deterministically
- Narrowed the true remaining `P3` work to future-facing hardening rather than another immediate feature slice:
  - keep the adapter-loader contract stable as new games are introduced
  - broaden beyond the built-in adapter set only when a second real backend adapter exists
  - finish the final end-state cleanup as part of the later `P1` and `P10` work
- Updated status docs so `P8` is no longer listed as partial and the tracker now reflects the smaller real remainder for `P3`.

Execution recommendation:
1. Stop treating `P3` as the immediate active phase.
2. Move the roadmap focus to `P1` runtime cutover planning/execution.
3. Reopen `P3` only for small hardening if later topology or new-game work exposes an actual gap.

## 2026-03-24 23:44 EET

Summary:
- Completed `P1` by moving the canonical backend package from `apps/api` to `server/` and the canonical web package from `apps/web` to `frontend/web/`.
- Updated root workspace configuration, `dev.sh`, CI, Podman image/runtime paths, boundary checks, and the live docs/tracker so they point at the new runtime roots.
- Added a compatibility fallback in `dev.sh` for an existing legacy `apps/api/.env`, while making `server/.env` the canonical local env file.
- Hardened API runtime startup for stack mode so transient database/bootstrap errors are retried during fresh container bring-up.
- Reordered stack bootstrap/verification so fresh-stack migrations and seed run after DB readiness and before the HTTP smoke gate.

Verification:
- `pnpm boundary:check` -> passed
- `pnpm games:conformance` -> passed
- `pnpm build` -> passed
- `./dev.sh test:full` -> passed
- `./dev.sh stack:verify` -> passed

Review result:
- The initial path cutover exposed two real issues:
  1. moved package-local workspace links required a root `pnpm install` refresh
  2. fresh-stack bootstrap needed explicit DB-readiness ordering plus startup retry handling
- Both issues were fixed in the same `P1` slice and reverified before closeout.

## 2026-03-25 00:30 EET

Summary:
- Added a dedicated pending tracker for independent-agent add-game readiness: `project_docs/ongoing/ADDITIONAL_GAME_AGENT_READINESS_PENDING.md`.
- Finished the remaining `P9` docs sweep against the canonical runtime by aligning active usage/status/tracker language with `server/` and `frontend/web/`, and by removing the last compatibility-era wording from current-facing docs.
- Finished the active `P10` cleanup slice by removing transitional root dev command wrappers from `package.json`, making `./dev.sh` require `server/.env` directly, and stopping the active workflow from depending on the legacy `apps/api/.env` fallback.

Verification:
- Before changes:
  - `pnpm build` -> passed
  - `./dev.sh test:full` -> passed
- After changes:
  - `pnpm build`
  - `pnpm boundary:check`
  - `./dev.sh test:full`
  - `./dev.sh stack:verify`
  -> all passed

## 2026-03-25 00:41 EET

Summary:
- Completed the add-game agent-readiness task by consolidating all active additional-game guidance into one canonical document: `docs/add-game-guide.md`.
- Reduced the previous split add-game docs (`docs/add-game-checklist.md`, `docs/game-module-spec.md`, `docs/backend-allowlist-security.md`) to compatibility pointer pages so they no longer act as competing sources of truth.
- Updated active project docs to point to the canonical guide, and converted `project_docs/ongoing/ADDITIONAL_GAME_AGENT_READINESS_PENDING.md` into a short completion record that redirects to the new canonical spec.

Verification:
- Before changes:
  - `pnpm games:conformance` -> passed
  - `pnpm boundary:check` -> passed
  - `pnpm build` -> passed
- After changes:
  - `pnpm games:conformance`
  - `pnpm boundary:check`
  - `pnpm build`
  -> all passed
