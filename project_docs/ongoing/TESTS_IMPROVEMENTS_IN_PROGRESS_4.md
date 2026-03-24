# Tests Improvements In Progress 4

Updated: 2026-03-24 07:38 EET

## Goal
Reach a test workflow where any suite can be started from a cold machine state, provisions exactly what it needs, reuses setup only when appropriate inside a top-level run, and tears down only the resources it started.

## Current state
1. `test:unit` is self-contained.
2. `test:web` is self-contained.
3. `test:int` now owns an isolated local Postgres test container lifecycle.
4. `test:e2e` now uses the same owned isolated test DB pattern locally before starting the API runtime.
5. `test:full` now acts as the local top-level orchestrator and reuses one prepared isolated test DB across DB-backed substeps.
6. DB-backed local cleanup now removes only the managed test resources created by the run.
7. `test:e2e:stack` is fairly self-contained when run through the stack flow.

## What remains
1. Align CI with the same owned orchestration model where appropriate, or document clearly why it intentionally remains separate.
2. Decide whether stack-mode e2e should stay a distinct path or be partially unified with the local orchestration model.
3. Reduce remaining local dependence on `apps/api/.env` for non-DB config if full zero-setup cold-start behavior is still a goal.
4. Consider whether optional debug retention for the managed test DB container should remain an escape hatch or become a documented workflow.
5. Decide whether the broader AI-optimized documentation and cheap local verification workflow should stay in this tracker or move to a separate follow-up document.

## Additional future task: AI-optimized documentation and cheap local verification workflow
Added: 2026-03-11 00:16 EET

1. Reorganize project documentation so AI coding agents can find current status, progress tracking, implementation notes, and next actions with minimal search overhead.
2. Introduce a Claude Code style documentation/rules approach with coherent markdown files for:
   - current status
   - active tasks
   - completed work
   - pending work
   - test and documentation update obligations
3. Add rules files that require timestamps on status/progress docs and require documenting what changed, what remains, and what was verified.
4. Add rules that require cheap local verification steps to be run from the IDE/workspace between edit sessions so AI agents do not need to spend unnecessary tokens rediscovering project state after each commit.
5. Add rules that require documentation updates and targeted test updates whenever new functionality is introduced.
6. Optimize the workflow so Codex can cheaply run local checks, detect repo state quickly, and confirm project health between editing sessions.
7. Add missing tests for new functionality as part of that workflow so capability growth and verification stay aligned.

## Recommended next direction
1. Introduce a dedicated ephemeral test Postgres container flow for DB-backed tests.
2. Teach `test:int` and DB-backed preparatory steps to own start, validate, migrate, seed, and teardown of that test resource.
3. Add an orchestration mode for `test:full` so subcommands can run in an already-prepared environment without redoing setup.
4. Keep dev resources and test resources separate so test cleanup stays safe.

## 2026-03-24 00:24 EET

Progress update:
1. `./dev.sh test:int` now starts its own isolated Postgres test container on a dedicated high port, migrates/seeds that database, runs integration tests, and tears down only the container it created.
2. `./dev.sh test:e2e` now uses the same owned test DB session pattern before starting the local API runtime for Playwright.
3. `./dev.sh test:full` now provisions one isolated test DB container once, prepares it once, reuses it across the DB-backed substeps, and tears it down on exit.
4. Root `pnpm test:full` now delegates to `./dev.sh test:full`, making the shell workflow the canonical top-level orchestrator for the full local suite.
5. `scripts/dev-db.sh` now supports environment-driven container name/port/database overrides so the same helper can manage both the long-lived dev DB and isolated test DB resources.

What remains after this slice:
1. CI still uses its own GitHub Actions Postgres service flow rather than the local self-owned orchestration path.
2. The stack-mode e2e path remains separate from the local isolated test DB flow.
3. Local DB-backed scripts still assume `apps/api/.env` exists for non-DB settings, so "cold machine" is improved substantially for DB lifecycle ownership but not yet fully zero-setup.
4. Additional follow-up could add optional debug retention for the managed test DB container beyond the `KG_KEEP_TEST_DB=1` escape hatch.

## 2026-03-24 07:38 EET

Status refinement:
1. This document is renamed from `PENDING` to `IN_PROGRESS` because the core local DB-backed orchestration work is now materially implemented.
2. Completed in this slice:
   - `test:int` now owns an isolated local Postgres test container lifecycle.
   - `test:e2e` now uses the same isolated owned test DB pattern locally.
   - `test:full` now acts as the local top-level orchestrator and reuses one prepared isolated test DB across DB-backed substeps.
   - DB-backed local test cleanup now removes only the managed test resources created by the run.
3. Still open before this document can be considered fully done:
   - align CI with the same owned orchestration model where appropriate, or document why it intentionally remains separate
   - decide whether stack-mode e2e should stay a distinct path or be partially unified with the local orchestration model
   - reduce remaining local dependence on `apps/api/.env` for non-DB config if full zero-setup cold-start behavior is still a goal
   - complete or explicitly split out the broader AI-optimized documentation and cheap local verification workflow section if it should not block closure of the DB-orchestration task
