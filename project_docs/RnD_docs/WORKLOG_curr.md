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
- Added a dedicated pending tracker for independent-agent add-game readiness: `project_docs/ongoing/ADDITIONAL_GAME_AGENT_READINESS_DONE.md` (originally created as a pending tracker before completion).
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
- Updated active project docs to point to the canonical guide, and converted `project_docs/ongoing/ADDITIONAL_GAME_AGENT_READINESS_DONE.md` into a short completion record that redirects to the new canonical spec.

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

## 2026-03-25 23:05 EET

Summary:
- Added `tic-tac-toe` as the second game, implemented as a simple auth-protected web-only game with browser-local board state and no backend gameplay persistence.
- Added the full game module scaffold under `games/tic-tac-toe/`, including web manifest/UI, mobile/contracts placeholders, and a minimal backend-adapter package so the current allowlist-driven loader remains satisfied.
- Updated seed/config/runtime wiring so `tic-tac-toe` is enabled, allowlisted by default, exposed via `/games`, loaded in the backend adapter health path, and reachable through the web game registry and menu.

Verification:
- Before changes:
  - `pnpm test:web` -> passed
  - `pnpm games:conformance` -> passed
- After changes:
  - `pnpm test:web`
  - `pnpm test:unit`
  - `./dev.sh test:int`
- `pnpm games:conformance`
- `pnpm build`
  -> all passed

## 2026-03-25 23:47 EET

Summary:
- Fixed the container stack build path after confirming `./dev.sh stack:init` could show stale game menus even when direct dev mode already exposed `tic-tac-toe`.
- Identified the root cause: `stack:init` and `stack:build` used separate manual `podman build` image tags while the running stack came from `podman-compose` service builds, allowing compose to reuse older service images.
- Updated `dev.sh`, `README.md`, and `USAGE.md` so stack build/init now use compose-managed rebuilds consistently.

## 2026-03-26 00:11 EET

Summary:
- Hardened the stack cleanup flow after repeated Podman rootless networking glitches left stale `rootlessport` helpers and partially removed stack containers behind.
- Updated `./dev.sh stack:down` to force-remove stack-owned containers and clean stale `rootlessport` helpers on the stack ports (`55434`, `8080`, `8443`) when their corresponding stack containers no longer exist.
- Updated `stack:init` and `stack:rebuild` to run the same stale-helper cleanup before starting services, so repeated stack runs can recover from partial Podman teardown failures more reliably.

## 2026-03-29 22:35 EEST

Summary:
- Improved first-time local setup so `./dev.sh init` now checks required prerequisites up front, reports missing tools with installation guidance, and prebuilds internal workspace artifacts before the database setup flow.
- Hardened `./dev.sh server` and `./dev.sh web` by validating supported Node.js and pnpm versions before startup and by ensuring the required internal package build artifacts exist on cold checkouts.
- Updated `README.md` and `project_docs/RnD_docs/USAGE.md` to document the Ubuntu dependency list more explicitly, require at least Node.js 20.x, and recommend Node.js 24.x or later for local development.
- Aligned root `package.json` metadata with the documented setup expectations by requiring Node.js 20.x+ and pnpm 9.x+ in `engines` while keeping the repo-pinned `packageManager` entry for pnpm 10.33.0.

Verification:
- Before changes:
  - `bash -n dev.sh` -> passed
  - `./dev.sh init` -> failed late with unsupported system Node 18 during migration runtime
  - `./dev.sh server` -> failed on missing internal package build artifacts from a cold checkout
- After changes:
  - `bash -n dev.sh` -> passed
  - `./dev.sh init` -> now fails early with a clear prerequisite message when run under unsupported Node 18 in this environment
  - `./dev.sh server` -> now fails early with a clear unsupported Node message when run under unsupported Node 18 in this environment

## 2026-03-29 22:48 EEST

Summary:
- Fixed GitHub Actions pnpm setup after the root `package.json` started pinning `pnpm@10.33.0` via `packageManager`.
- Removed the duplicate hard-coded `version: 9` input from each `pnpm/action-setup@v4` step in `.github/workflows/ci.yml` so CI now uses the repo-declared pnpm version as the single source of truth.

Verification:
- Before changes:
  - GitHub Actions `pnpm/action-setup@v4` failed with "Multiple versions of pnpm specified" because workflow config requested pnpm 9 while `package.json` pinned pnpm 10.33.0
- After changes:
  - `.github/workflows/ci.yml` no longer declares a second pnpm version alongside the root `packageManager` pin

## 2026-03-29 22:53 EEST

Summary:
- Reworked the Tic-Tac-Toe page into a Figma-inspired motion UI while preserving the existing KGP shell and route contracts.
- Added browser-local gameplay polish: animated X/O marks, score cards, reset flow, win/draw state panels, and reduced-motion-aware confetti behavior.
- Added the approved web dependencies needed for the redesign: `motion`, `canvas-confetti`, and `lucide-react`.
- Updated the status and worklog docs to reflect the redesigned tic-tac-toe UX and the refreshed web test counts.

Verification:
- Baseline before edits:
  - `pnpm test:web` -> passed
- After edits:
  - `pnpm test:web` -> passed, 78 web tests
  - `pnpm typecheck` -> passed across all workspace packages

## 2026-03-29 23:06 EEST

Summary:
- Added a persistent in-game Effects toggle so confetti, hover feedback, entrance motion, and win pulses can be switched on or off directly from the Tic-Tac-Toe screen.
- Kept reduced-motion preference respected underneath the toggle, so accessibility settings still suppress motion when needed.
- Generalized the motion gating so the toggle now controls the full effect set instead of only confetti.

Verification:
- Before edits:
  - `pnpm test:web` -> passed, 78 web tests
- After edits:
  - `pnpm --filter @kids-games/web typecheck` -> passed
  - `pnpm test:web` -> passed, 79 web tests

## 2026-03-29 23:09 EEST

Summary:
- Increased the confetti celebration into a multi-burst sequence with a higher z-index so it is much easier to see against the game background.
- Kept the effect toggle and reduced-motion gating intact while making the winner celebration more visually obvious.

Verification:
- After edits:
  - `pnpm test:web` -> passed, 79 web tests
  - `pnpm typecheck` -> passed across all workspace packages

## 2026-03-29 23:21 EEST

Summary:
- Changed Tic-Tac-Toe celebratory effects so the user-facing Effects toggle now overrides reduced-motion and allows confetti/motion when enabled.
- Updated the confetti test coverage to match the new override behavior instead of the old reduced-motion suppression rule.
- Synced the implementation status notes to reflect that reduced-motion no longer blocks celebratory effects when the toggle is on.

Verification:
- Before edits:
  - `pnpm test:web` -> passed, 79 web tests
- After edits:
  - `pnpm test:web` -> passed, 79 web tests
  - `pnpm typecheck` -> passed across all workspace packages

## 2026-03-30 11:22 EEST

Summary:
- Switched Tic-Tac-Toe from the dark neon palette to a light pastel palette while preserving the same gameplay, layout structure, motion model, and effects toggle behavior.
- Kept the existing visual identity cues (fuchsia/cyan player tones, glass-style cards, animated marks), but remapped surfaces, borders, shadows, and typography contrast for light-theme readability.
- Left route contracts, game logic, and persistence behavior unchanged.

Verification:
- Before edits:
  - `pnpm test:web` -> passed, 79 web tests
- After edits:
  - `pnpm test:web` -> passed, 79 web tests

## 2026-03-30 12:02 EEST

Summary:
- Implemented `snake-classic` as a fully integrated browser-local third game under the current KGP modularity model.
- Added the required `games/snake-classic/` module structure, manifest, engine, storage helpers, no-op run-summary seam, and minimal backend adapter.
- Registered Snake Classic through the central web game registry, backend adapter loader, DB seed metadata, and default allowlist/config paths without changing existing game route contracts.
- Added adaptive 50x50 canvas gameplay with keyboard, hold-follow mouse, and swipe/touch controls, plus persistent high score/settings and reduced-motion-aware behavior.
- Extended verification coverage across web route tests, engine/page tests, API integration tests, and routed Playwright coverage for the live Snake route.
- Updated the core docs and tracker status to reflect that Snake Classic is now implemented.
- Because this environment could not refresh workspace metadata from the public registry, the new workspace lockfile entries for the Snake backend adapter were synced manually to match the existing flashcards/tic-tac-toe patterns after `pnpm install` and `pnpm install --lockfile-only --offline` both failed on `typescript` metadata fetch.

Verification:
- Before edits:
  - `pnpm test:web` -> passed, 79 web tests
  - `pnpm typecheck` -> passed across all workspace packages
  - `./dev.sh test:int` -> passed, 81 integration tests
- After edits:
  - `pnpm boundary:check` -> passed
  - `pnpm games:conformance` -> passed
  - `pnpm typecheck` -> passed across all workspace packages
  - `pnpm test:web` -> passed, 94 web tests
  - `./dev.sh test:int` -> passed, 83 integration tests
  - `./dev.sh test:e2e` -> passed, 5 Playwright e2e tests

## 2026-03-30 12:27 EEST
- Updated `docs/add-game-guide.md` to treat post-implementation game exposure as an explicit user decision instead of an automatic final step.
- Documented the enable-now path for new games: add the new game ID to `server/.env.example`, update the active runtime allowlist in `server/.env` or deployment env, re-seed the database, and restart the API or full stack so the game appears in `/games` and on the homepage.
- Documented the keep-hidden path so agents can finish code, tests, and docs without changing the active runtime allowlist, while clearly reporting that the game remains hidden until allowlist + seed + restart are completed.

## 2026-03-30 12:32 EEST
- Refined `docs/add-game-guide.md` so the new-game exposure decision is taken at task provision instead of at final handoff.
- Clarified that if the user approves immediate exposure up front, the same implementation task should carry the full enablement path through seed metadata, `.env.example`, active runtime allowlist, DB reseed, and API/stack restart without another user prompt.

## 2026-03-30 12:36 EEST
- Shortened the `docs/add-game-guide.md` exposure-decision section so it keeps the same behavior with less agent context overhead.
- Kept the same execution contract: ask at task provision, lock the answer into the plan, and if enabled complete seed + allowlist + reseed + restart in the same task.

## 2026-04-01 23:55 EEST

Summary:
- Hardened the local Podman developer workflow against two host-environment failure classes seen during cross-distro onboarding verification.
- Added `scripts/podman-env.sh` and sourced it from `dev.sh` plus `scripts/dev-db.sh` so Podman commands automatically normalize clearly sandboxed Snap/Flatpak XDG paths back to the real Linux home only when those broken paths are detected.
- Extended `scripts/dev-db.sh` to detect rootless Podman networking failures around `pasta` and `/dev/net/tun`, then print a precise fallback recommendation using per-user `slirp4netns` configuration instead of failing with an opaque Podman error.
- Updated `README.md` and `project_docs/RnD_docs/USAGE.md` so the supported Podman requirement stays `4.x+`, the Snap/Flatpak storage-path workaround is documented, and Podman 5 rootless-network fallback guidance is available during setup/troubleshooting.

Verification:
- Baseline before edits:
  - `bash -n dev.sh` -> passed
  - `bash -n scripts/dev-db.sh` -> passed
- After edits:
  - `bash -n dev.sh` -> passed
  - `bash -n scripts/dev-db.sh` -> passed
  - `bash -n scripts/podman-env.sh` -> passed
  - `git diff --check` -> passed
  - simulated Snap-style XDG environment -> confirmed normalization back to `/home/luke/.local/share` and `/home/luke/.config`
  - live host validation on Manjaro after reboot -> `./dev.sh init` succeeded with rootless Podman using `slirp4netns` and graph root `/home/luke/.local/share/containers/storage`

Commit message:
`harden podman onboarding across snap and rootless network quirks`

## 2026-04-02 00:20 EEST

Summary:
- Started the dedicated performance-analysis workstream and promoted the new performance tracker into active execution.
- Added a reusable performance standards/checklist document for React, backend, DB, containers, load testing, and future game/module reviews.
- Added manual-only performance commands and baseline scripts for direct API load measurement, browser-route tracing, DB query-plan capture, stack comparison, and report generation.
- Updated the top-level docs and add-game guide so performance review is now an explicit planning and closeout concern for future game/module work.
- Reserved the first performance baseline as a before-optimization report so later improvements can be compared against the same benchmark matrix.

Verification:
- Baseline before edits:
  - `bash -n dev.sh` -> passed
- After edits:
  - `bash -n dev.sh` -> passed
  - `node --check server/scripts/perf-api-load.mjs` -> passed
  - `node --check server/scripts/perf-db-analysis.mjs` -> passed
  - `node --check frontend/web/scripts/perf-browser-baseline.mjs` -> passed
  - `node --check scripts/perf-report.mjs` -> passed
  - `git diff --check` -> passed
  - `./dev.sh perf:baseline` -> passed

Artifacts:
- Standards doc: `project_docs/RnD_docs/PERFORMANCE_REVIEW_STANDARD.md`
- Active tracker: `project_docs/ongoing/PERFORMANCE_ANALYSIS_AND_OPTIMIZATION_PLAN_IN_PROGRESS.md`
- First baseline report: `project_docs/RnD_docs/PERFORMANCE_BASELINE_REPORT_2026-04-02.md`

Early measured findings:
- Tic-Tac-Toe hover remains the most obvious frontend hotspot from the first browser baseline and should be investigated before broader UI cleanup.
- `auth_login_then_me` is the slowest API scenario in the first direct-load pass and is the clearest backend hotspot for the first optimization slice.
- Stack comparison was skipped in the first run because the Podman+Caddy stack was not already healthy at baseline time.

## 2026-04-02 08:00 EEST

Summary:
- Completed the first measured optimization slice after the baseline milestone commit.
- Reduced Tic-Tac-Toe hover-path cost by replacing JS-driven `motion.button` hover/tap animation on empty cells with lighter CSS transform-based hover feedback and memoizing the small board components.
- Made auth hashing cost configurable through `BCRYPT_SALT_ROUNDS`, with development/test defaulting to `10` rounds and production retaining `12` by default.
- Captured before/after evidence for both the Tic-Tac-Toe and auth hotspots in a dedicated optimization progress report.

Verification:
- Before Tic-Tac-Toe edits:
  - `pnpm test:web` -> passed
- After Tic-Tac-Toe edits:
  - `pnpm test:web` -> passed
  - `./dev.sh perf:frontend` -> passed
- Before auth edits:
  - `./dev.sh test:int` -> passed
- After auth edits:
  - `./dev.sh test:int` -> passed
  - `./dev.sh perf:api` -> passed

Measured deltas:
- Tic-Tac-Toe hover sweep improved from `1434.72 ms` to `1390.12 ms`.
- Tic-Tac-Toe sampled animation rate improved from `42.67 FPS` to `54.73 FPS`.
- `auth_login_then_me` improved from `p95 7409.22 ms` / `4.22 req/s` to `p95 2015.51 ms` / `16.82 req/s`.

Artifacts:
- Optimization progress report: `project_docs/RnD_docs/PERFORMANCE_OPTIMIZATION_PROGRESS_2026-04-02.md`
- Frontend rerun artifacts: `/tmp/kgp-perf/20260402-075447`
- API rerun artifacts: `/tmp/kgp-perf/20260402-075914`

Next focus:
- inspect remaining Tic-Tac-Toe render/status cost
- evaluate Snake and shared layout behavior
- capture the missing direct-vs-stack comparison once the Podman+Caddy stack is healthy

## 2026-04-02 08:55 EEST

Summary:
- Completed the next frontend analysis slice on `SnakeClassicPage` and the shared layout path.
- Removed obvious repeated state writes during active Snake input and moved static option arrays out of render scope.
- Kept the broader Snake canvas architecture unchanged because the measured browser baseline still shows the route as healthy.

Verification:
- `pnpm test:web` -> passed
- `./dev.sh perf:frontend` -> passed

Measured outcome:
- Snake stayed near `60.66 FPS` before and after the change, with no meaningful route-level regression or major improvement.
- The result supports keeping Snake largely as-is for now while focusing deeper optimization effort elsewhere.

Artifacts:
- Frontend rerun artifacts: `/tmp/kgp-perf/20260402-085012`
- Optimization progress report: `project_docs/RnD_docs/PERFORMANCE_OPTIMIZATION_PROGRESS_2026-04-02.md`

Next focus:
- shift into deeper backend/database hotspot analysis beyond auth
- capture missing direct-vs-stack metrics after the stack path is healthy

## 2026-04-02 09:00 EEST

Summary:
- Completed the backend/database analysis checkpoint after the auth improvement.
- Revalidated that the database query layer is already fast for the currently measured read and progress-plan paths.
- Evaluated additional backend optimizations beyond auth, but intentionally kept them out of the codebase because the measured evidence was not strong or stable enough.

Verification:
- `./dev.sh test:int` -> passed after the backend analysis phase remained on the measured-safe code path
- `./dev.sh perf:api` -> rerun completed for comparison

Decision record:
- Keep the auth hashing improvement already landed.
- Defer flashcards write-path rewrites until route-specific measurement is tighter.
- Defer registry micro-caching until `/games` is shown to be a meaningful bottleneck with cleaner evidence.

Artifacts:
- Backend/DB analysis report: `project_docs/RnD_docs/PERFORMANCE_BACKEND_DB_ANALYSIS_2026-04-02.md`
- Optimization progress report: `project_docs/RnD_docs/PERFORMANCE_OPTIMIZATION_PROGRESS_2026-04-02.md`

Next focus:
- capture the missing direct-vs-stack/container measurements
- then move into broader capacity-model work

## 2026-04-02 09:58 EEST

Summary:
- Completed the direct-vs-stack/container measurement phase.
- Confirmed that the correct stack setup path for performance work is `./dev.sh stack:init`, not `./dev.sh stack:up`, because the init flow ensures migrations and seed complete before the stack API boots.
- Captured a matched direct API rerun and healthy routed stack run for comparison.

Verification:
- `./dev.sh stack:init` -> passed
- `./dev.sh perf:stack` -> passed
- `./dev.sh perf:api` -> passed

Measured interpretation:
- The stack adds modest-to-moderate overhead on several read and write paths.
- The very large auth gap is mostly explained by runtime bcrypt differences between the direct test server and the production-mode stack API, not by proxy/container cost alone.

Artifacts:
- Stack analysis report: `project_docs/RnD_docs/PERFORMANCE_STACK_ANALYSIS_2026-04-02.md`
- Matched direct API artifact: `/tmp/kgp-perf/20260402-094954/api-load.json`
- Stack API artifact: `/tmp/kgp-perf/20260402-094912/stack-api-load.json`

Next focus:
- run broader load tiers and capacity modeling
- update the before/after reporting with the current measured checkpoints

## 2026-04-02 10:05 EEST

Summary:
- Completed the broader direct-load tier sweep for `50`, `100`, `250`, `500`, and `1000` concurrent users.
- Generated a current consolidated status report and a dedicated capacity model document.
- Converted the raw load-tier artifacts into a practical roadmap for how this platform would need to evolve before any serious `50,000` concurrent-user claim.

Verification:
- direct API load tiers completed successfully for `50`, `100`, `250`, `500`, and `1000` users
- `node scripts/perf-report.mjs ...` -> passed for the current status report generation

Measured interpretation:
- Read-heavy routes scale farthest on the current node.
- Login throughput plateaus early because bcrypt dominates.
- Flashcards progress writes become the next limiter, with multi-second p95 latency emerging in the higher tiers.

Artifacts:
- Current status report: `project_docs/RnD_docs/PERFORMANCE_STATUS_REPORT_2026-04-02.md`
- Capacity model: `project_docs/RnD_docs/PERFORMANCE_CAPACITY_MODEL_2026-04-02.md`
- Load-tier artifacts: `/tmp/kgp-perf/capacity-50`, `/tmp/kgp-perf/capacity-100`, `/tmp/kgp-perf/capacity-250`, `/tmp/kgp-perf/capacity-500`, `/tmp/kgp-perf/capacity-1000`

Next focus:
- fold the current findings into a final close-out state for this performance phase
- keep future optimizations anchored to the measured bottlenecks now documented

## 2026-04-02 12:20 EEST

Summary:
- Added a reusable bootstrap framework for future projects with a policy-focused guide and a templates-focused companion document.
- Extended the framework with stronger command-surface, dependency-reporting, test-harness preflight, real-runtime verification, and optional quality-layer guidance.
- Added Linux-family template support for pure Linux projects, daemon/service work, linkable libraries, IPC-oriented systems, and optional CMake bootstrap patterns.
- Kept the framework decision-complete but explicitly classification-driven, so future agents can choose between the full-stack app blueprint, Linux-family templates, or a deliberate hybrid based on the actual project.

Docs added or updated:
- `project_docs/RnD_docs/NEW_PROJECT_AGENT_BOOTSTRAP_GUIDE.md`
- `project_docs/RnD_docs/NEW_PROJECT_AGENT_BOOTSTRAP_TEMPLATES.md`
- `README.md`

Verification:
- `git diff --check` -> passed repeatedly during the bootstrap-framework refinement pass

Decision record:
- The bootstrap framework is now ready for reuse as a transferable project-setup standard.
- Future improvements should add more project-family blueprints rather than more general rules.
