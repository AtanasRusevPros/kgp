# Game Modularity Iteration Plan (AI Short Version)

## Goal
Deliver closed, allowlisted modular architecture with backend independence, dual identity security, and full test+docs sweep.

## Locked decisions
1. Deploy-time allowlist only.
2. Dual identity (`app + delegated user`).
3. BFF/gateway for privileged flows.
4. Game-owned backend adapters loaded only if allowlisted.
5. Target structure: `server/`, `frontend/web`, `frontend/mobile`, `games/<id>/*`, `packages/*`.

## Execution method
1. Execute strictly `P0 -> P10` (no phase skipping).
2. Use one branch per phase (`phase/pN-*`).
3. Use `GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md` as architecture truth.
4. Use `PHASE_EXECUTION_TRACKER_2_PENDING.md` for live status/evidence/blockers.
5. Complete each phase with code + tests + docs for changed behavior.
6. Enforce hard gates: no affected test/doc skipping.
7. Delivery waves:
   - Wave A: `P0-P2`
   - Wave B: `P3-P5`
   - Wave C: `P6-P7`
   - Wave D: `P8-P10`

## Phase checklist

### P0 Guard rails
- Add architecture boundary checks + baseline behavior references.
- Gate: `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm test:integration && pnpm test:web`.

### P1 Topology migration
- Move backend to `server/`, web shell to `frontend/web`, add `frontend/mobile`, add `games/`.
- Create compatibility aliases.
- Gate: `pnpm build && pnpm test:unit && pnpm test:integration && pnpm test:web`.

### P2 Contracts/metadata
- Extend shared game metadata and schemas; extend `/games` payload.
- Add validation and version checks.
- Gate: contract unit tests + `/games` integration tests.

### P3 Allowlist registry + adapter loader
- Implement backend allowlist registry and adapter loading from `games/*/backend-adapter`.
- Add diagnostics endpoint.
- Reject unallowlisted games.
- Gate: allowlisted success + blocked-game tests.

### P4 Security hardening
- Implement app identity verification + delegated user-game token flow.
- Enforce audience/scope/game/client claims.
- Gate: auth matrix integration tests (user-only fail, app-only fail, dual pass).

### P5 Web dynamic routing
- Remove hardcoded game routes from shell.
- Launch via metadata-driven registry.
- Gate: web/e2e approved launch + disabled/unsupported blocked tests.

### P6 Mobile readiness
- Wire `frontend/mobile` to same metadata model.
- Enforce per-game mobile module contract/conformance tests.
- Gate: mobile module conformance tests pass.

### P7 Flashcards full migration
- Migrate flashcards entirely to `games/flashcards/{contracts,web,mobile,backend-adapter}`.
- Route backend integration through allowlist adapter path only.
- Gate: flashcards parity suite + `pnpm test:full`.

### P8 Full test sweep
- Update all impacted existing tests.
- Add new tests: allowlist, adapter contract, dual identity, scope/aud mismatch, metadata routing.
- Gate: `pnpm test:full` + `pnpm test:e2e:stack`.

### P9 Full docs sweep
- Update: `ARCHITECTURE.md`, `IMPLEMENTATION_STATUS.md`, `README.md`, `USAGE.md`, `WORKLOG.md`.
- Add: game module spec, allowlist security, migration guide, add-game checklist.
- Gate: doc consistency check complete.

### P10 Cleanup
- Remove compatibility aliases/flags and deprecated code paths.
- Gate: `pnpm build && pnpm test:full && pnpm test:e2e:stack` green without compatibility mode.

## Done criteria
1. Backend independent and allowlist-controlled.
2. No hardcoded per-game core routing.
3. Privileged APIs require dual identity.
4. Flashcards migrated to reference module shape.
5. Existing tests updated + new tests added and passing.
6. Docs fully aligned with final architecture.
