# Tests Improvements Pending 4

Updated: 2026-03-11 00:16 EET

## Goal
Reach a test workflow where any suite can be started from a cold machine state, provisions exactly what it needs, reuses setup only when appropriate inside a top-level run, and tears down only the resources it started.

## Current state
1. `test:unit` is self-contained.
2. `test:web` is self-contained.
3. `test:e2e` is partly self-contained because it prepares the test DB and starts runtime processes as needed.
4. `test:e2e:stack` is fairly self-contained when run through the stack flow.
5. `test:int` and `test:full` still depend on the long-lived local DB container model and do not fully own DB lifecycle recovery.

## What remains
1. Separate DB-backed test lifecycle ownership from the long-lived local dev DB container.
2. Make `test:int` able to cold-start, repair, or recreate its own isolated test Postgres resource automatically.
3. Make `test:full` the single top-level orchestrator for shared DB-backed setup so sub-suites do not repeat expensive bootstrap work unless isolation requires it.
4. Ensure every test command tears down only the resources it created.
5. Remove remaining manual recovery expectations such as recreating a broken local DB container outside the test command.

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
