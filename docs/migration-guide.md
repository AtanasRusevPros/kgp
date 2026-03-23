# Modularity Migration Guide

## Current migration posture
1. Compatibility mode is active for topology and flashcards wiring.
2. Core architecture gates are enabled (boundary + conformance checks).
3. Phases and completion status are tracked in [`PHASE_EXECUTION_TRACKER_2_PENDING.md`](../project_docs/ongoing/PHASE_EXECUTION_TRACKER_2_PENDING.md).

## Safe migration loop
1. Implement one phase slice.
2. Run `pnpm build && pnpm test:full`.
3. Update tracker evidence.
4. Continue to next phase.
