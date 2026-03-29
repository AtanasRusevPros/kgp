# Snake Classic Implementation Plan (Pending)

Status: PENDING  
Created: 2026-03-29 23:20 EET  
Owner: Autonomous agents + maintainers  
Reference: `docs/add-game-guide.md`

## Summary

Implement a new browser-local game module, `snake-classic`, inspired by old Nokia Snake with modern visuals and motion.
The game must integrate with KGP platform routing and standards while keeping context and scope tight.

## Decision Lock Update (timestamped)

Updated: 2026-03-29 23:35 EET

All remaining implementation ambiguities were resolved in an interactive planning pass.
The decisions below are authoritative for v1 and should be treated as final unless explicitly revised.

## Locked Product Decisions (Final)

### Identity and routing

1. Game ID: `snake-classic`
2. Web manifest values:
   - `id: 'snake-classic'`
   - `routeBase: '/snake-classic'`
   - route entry `path: '/snake-classic'`
   - route entry `routeId: 'snake-classic.board'`
   - route entry `requiresAuth: true`

### Scope and architecture

1. Game type: browser-local, no backend gameplay state in v1.
2. Points integration: points-ready only; no live points writes in v1.
3. Add one frontend no-op seam for future integration:
   - `emitRunSummary({ score, applesEaten, durationMs, difficulty, endedBy })`
   - call only on game over
   - default implementation performs no backend calls

### Dependency boundary

1. Allowed new dependencies for snake v1:
   - `motion`
   - `lucide-react`
2. Explicitly not allowed for this feature:
   - `canvas-confetti`
   - large UI framework imports from the Figma export stack (radix/shadcn/MUI/Tailwind-v4 migration)

### Engine, controls, and rules

1. Board model: logical `50x50`.
2. Initial state:
   - snake length `4`
   - heading `right`
   - start position centered on board
3. Collision rules: classic Nokia behavior (wall/self collision = immediate game over).
4. Apple/scoring:
   - exactly one apple active
   - apple spawns only on random empty cell not occupied by snake
   - score increments by `+1` per eaten apple
5. Difficulty tick rates:
   - `slow: 180ms`
   - `normal: 140ms`
   - `fast: 110ms`
6. Progressive speedup:
   - every `5 apples`, reduce tick interval by `5ms`
   - hard minimum tick interval: `70ms`
7. Mouse hold-to-follow behavior (active only while pointer button is pressed):
   - compute vector from snake head to cursor (`dx`, `dy`)
   - choose movement axis by larger absolute delta (`|dx|` vs `|dy|`)
   - if equal, preserve current axis preference
   - enforce anti-reverse rule (never directly reverse into self)
8. Additional controls:
   - desktop keyboard fallback (arrow/WASD)
   - mobile swipe controls (with anti-reverse rule)

### View and accessibility

1. Visual direction: mostly modern with light retro references.
2. Reduced motion:
   - respect system reduced-motion preference
   - tone down/remove high-intensity animation when reduced motion is active
3. Adaptive camera/view:
   - desktop: full board visible (`50x50`)
   - mobile/tablet: zoomed viewport (`22x22` logical cells) centered on snake head
   - camera smoothing factor: `0.18` linear interpolation
   - clamp camera to world bounds

### Persistence schema

1. High score key: `kgp.snakeClassic.highScore`
2. Settings key: `kgp.snakeClassic.settings.v1`
3. Settings payload shape:
   - `difficulty: 'slow' | 'normal' | 'fast'`
   - `reducedMotionOverride: 'system' | 'on' | 'off'`
   - `lastControlHint: 'mouse' | 'keyboard' | 'touch'`

## Phase Plan and Acceptance Criteria

### P0 — Module Scaffolding and Registry Wiring

Tasks:
1. Create `games/snake-classic/` with required structure (`contracts`, `web`, `mobile`, `backend-adapter`, `README.md`).
2. Add manifest in `games/snake-classic/web/src/module.ts` using locked route values.
3. Register route in `frontend/web/src/games/registry.tsx` and map `snake-classic.board` to snake page element.
4. Add minimal backend adapter entry required by current loader model.
5. Add DB metadata/seed + allowlist integration where required by platform path.

Acceptance criteria:
1. Route is reachable at `/snake-classic` and protected by auth.
2. Manifest and registry IDs are consistent with `snake-classic`.
3. Game appears in platform exposure path when enabled/allowlisted.
4. No conformance/boundary break is introduced.

### P1 — Core Engine (50x50 Logic)

Tasks:
1. Implement deterministic tick loop and state transitions.
2. Implement movement queue + anti-reverse logic.
3. Implement collision handling and game-over transitions.
4. Implement single-apple spawn on empty cells and score increment.
5. Implement difficulty ticks + progressive speedup with floor.

Acceptance criteria:
1. Engine behavior is deterministic for identical input sequences.
2. Tick rates and speedup exactly match locked constants.
3. Collision, spawn, and score behaviors match locked rules.

### P2 — Input Systems (Desktop + Mobile)

Tasks:
1. Desktop keyboard controls plus hold-to-follow mouse mode.
2. Implement axis-selection/tie-break logic for follow mode.
3. Implement mobile swipe controls.
4. Define arbitration order when multiple inputs are present in one interval.

Acceptance criteria:
1. Follow mode is active only while pointer is pressed.
2. Cursor-follow chooses direction per locked axis/tie-break rules.
3. All controls obey anti-reverse constraints.

### P3 — Rendering, Animation, and Accessibility

Tasks:
1. Render board/snake/apple on canvas.
2. Add modern visual polish (movement/game-over/consumption effects) within dependency boundary.
3. Implement adaptive desktop/mobile view behavior and camera smoothing.
4. Implement reduced-motion handling and override setting.

Acceptance criteria:
1. Visual output matches engine state at all times.
2. Desktop and mobile view modes behave per locked camera rules.
3. Reduced-motion behavior is verifiably toned down.

### P4 — HUD, Difficulty, Persistence

Tasks:
1. Add HUD for score/high score/difficulty/current state.
2. Persist high score and settings using locked keys/payload.
3. Add reset/new game flow and game-over summary.
4. Track and set `lastControlHint` based on latest meaningful control type.

Acceptance criteria:
1. High score and settings persist across refresh.
2. Difficulty restores from persisted value.
3. Reset flow clears run-state and starts cleanly.

### P5 — Platform Compliance and Integration

Tasks:
1. Ensure protected-route and KGP shell compatibility.
2. Keep points-ready seam isolated and no-op in v1.
3. Validate integration against add-game guide requirements.

Acceptance criteria:
1. Route remains auth-protected and stable.
2. No existing API/contracts are altered unintentionally.
3. No backend gameplay state or points writes are introduced.

### P6 — Verification, Tests, and Docs Sync

Tasks:
1. Add/extend tests across unit/web/routing/e2e layers.
2. Re-run required verification commands.
3. Update required documentation after implementation.

Acceptance criteria:
1. Minimum test contract is satisfied and passing.
2. Docs reflect actual behavior and verification outcomes.

## Minimum Test Contract (Required)

### Engine unit tests

1. movement tick update
2. anti-reverse direction rule
3. wall collision game-over
4. self-collision game-over
5. apple spawn excludes snake cells
6. score increment on apple
7. speedup cadence and minimum tick floor

### Web/component tests

1. start/restart flow
2. difficulty selection + persistence restore
3. high-score persistence
4. reduced-motion behavior
5. mouse hold-follow control transition
6. swipe control transition

### Routing/integration tests

1. snake route exists in registry wiring
2. snake route is auth-protected

### E2E (minimum one routed flow)

1. login
2. navigate to `/snake-classic`
3. play and consume at least one apple
4. trigger game-over
5. restart game

## Verification Matrix (for implementation task)

Before edits (baseline):
1. Run narrow baseline for affected area (`pnpm test:web` minimum).
2. Record pre-existing failures before code edits.

After edits (required):
1. Re-run baseline command.
2. Run `pnpm typecheck`.
3. Run additional checks implied by blast radius (including relevant e2e path for routed gameplay).

## Docs Update Checklist (during implementation task)

1. Update `project_docs/RnD_docs/IMPLEMENTATION_STATUS.md` with evidence-backed snake status.
2. Append timestamped summary to `project_docs/RnD_docs/WORKLOG_curr.md`.
3. Update `README.md` and/or usage docs if user-facing game availability/workflow changes.

## Out of Scope for V1

1. Backend-owned gameplay state.
2. Live platform points awarding.
3. Multiplayer/networked play.
4. Advanced power-ups/combo modes beyond single-apple classic flow.

## Execution Notes

1. Keep context minimal per task (ownership file + nearest tests + immediate integration points).
2. Avoid dependency expansion beyond allowed list.
3. Keep route/ID/allowlist consistency strict across all integration points.
