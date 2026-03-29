# Snake Classic Implementation Plan (Pending)

Status: PENDING  
Created: 2026-03-29 23:20 EET  
Owner: Autonomous agents + maintainers  
Reference: `docs/add-game-guide.md`

## Summary

Implement a new browser-local game module, `snake-classic`, inspired by old Nokia Snake with modern visuals and motion.
The game must integrate with KGP platform routing and standards while keeping context and scope tight.

## Locked Product Decisions

1. Game ID: `snake-classic`
2. Route auth: required (`requiresAuth: true`)
3. Game type: browser-local, no backend gameplay state in v1
4. Board model: logical `50x50`
5. Renderer: canvas board renderer, DOM overlays for HUD/controls
6. Mouse control: hold-to-follow cursor while button pressed
7. Touch control: swipe input + hold-follow fallback behavior in v1
8. Collision rules: classic Nokia (wall or self-collision = game over)
9. Apple/scoring: one apple at a time, random empty-cell spawn, `+1` score per apple
10. Speed model: selectable difficulty (`slow`, `normal`, `fast`) + progressive speedup during run
11. Session persistence: persist high score and last selected settings in browser local storage
12. Visual direction: mostly modern effects with light retro references
13. Motion accessibility: reduced-motion-aware transitions/effects and toned-down or disabled confetti/effect intensity
14. View mode: adaptive presentation (desktop shows broader board area, mobile uses stronger camera-follow/zoom)
15. Points integration: points-ready architecture only (no live platform points awarding in v1)

## Phase Plan and Acceptance Criteria

### P0 — Module Scaffolding and Registry Wiring

Tasks:
1. Create `games/snake-classic/` with required structure (`contracts`, `web`, `mobile`, `backend-adapter`, `README.md`).
2. Add web manifest in `games/snake-classic/web/src/module.ts`.
3. Register route in `frontend/web/src/games/registry.tsx`.
4. Add minimal backend adapter entry required by current loader model.
5. Add DB metadata/seed + allowlist integration where required by platform path.

Acceptance criteria:
1. Route is reachable under a stable snake route base.
2. Manifest ID/route base/route IDs match game ID conventions.
3. Game appears correctly in platform game exposure path when enabled/allowlisted.
4. No conformance/boundary break is introduced.

### P1 — Core Engine (50x50 Logic)

Tasks:
1. Implement deterministic game loop tick model.
2. Implement snake state updates, direction queueing, and legal-turn rules.
3. Implement collision detection for wall and self.
4. Implement apple spawn constrained to empty cells.
5. Implement score increment and game-over state.

Acceptance criteria:
1. Engine behavior is deterministic for the same input sequence.
2. Wall/self collisions end run immediately.
3. Apple never spawns inside snake body.
4. Score increments exactly once per eaten apple.

### P2 — Input Systems (Desktop + Mobile)

Tasks:
1. Desktop keyboard fallback (arrow/WASD) plus hold-to-follow mouse control.
2. Mouse-follow logic chooses valid next direction toward cursor intent without illegal reverse into self.
3. Mobile swipe controls with safe direction constraints.
4. Input arbitration rules when multiple input types occur in the same interval.

Acceptance criteria:
1. Hold-to-follow works only while pointer is actively pressed.
2. Releasing pointer reverts to last valid direction continuity.
3. Swipe input is responsive and consistent on mobile viewport.
4. No illegal reverse direction transition occurs.

### P3 — Rendering, Animation, and Accessibility

Tasks:
1. Render board/snake/apple on canvas with modern visual effects.
2. Add animation cues for movement, apple consumption, and game-over transitions.
3. Add reduced-motion handling for user preference.
4. Ensure adaptive viewport/camera behavior for 50x50 board.

Acceptance criteria:
1. Animations are smooth at playable tick rates on standard desktop browsers.
2. Reduced-motion mode removes or tones down high-intensity effects.
3. Board remains legible and playable on desktop and mobile.
4. Visual state always matches engine state.

### P4 — HUD, Difficulty, Persistence

Tasks:
1. Add score, high score, and difficulty selector UI.
2. Persist high score + last difficulty/settings in local storage.
3. Add reset/new game controls and game-over summary UI.

Acceptance criteria:
1. High score survives refresh.
2. Last settings restore on next load.
3. Reset/new game starts clean state without stale artifacts.

### P5 — Platform Compliance and Integration

Tasks:
1. Ensure protected route behavior and shell compatibility.
2. Validate compatibility with current game registry and route build process.
3. Keep points-ready structure (clear future insertion point) without enabling points writes.

Acceptance criteria:
1. Auth protection remains consistent with platform game routes.
2. No API/contract drift is introduced for existing games.
3. Game integration follows add-game guide constraints.

### P6 — Verification, Tests, and Docs Sync

Tasks:
1. Add/extend unit and web tests for engine, input, and UI state transitions.
2. Add routed integration/e2e coverage for real user path.
3. Update required docs after implementation.

Acceptance criteria:
1. Required test suites pass.
2. New game route is validated through at least one end-to-end routed scenario.
3. Docs reflect actual implemented behavior and verification scope.

## Verification Matrix (for implementation task)

Before edits (baseline):
1. Run the narrowest meaningful baseline for affected area (`pnpm test:web` minimum).
2. Note pre-existing failures before making changes.

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
2. Avoid large dependency expansion; prefer focused additions only when justified by rendering/input needs.
3. Keep route/ID/allowlist consistency strict across all integration points.
