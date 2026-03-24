# Architecture Boundary Policy Pending

Updated: 2026-03-25 00:23 EET

This policy defines hard import/layer boundaries during modularity rework.

## Boundary rules
1. `server` must not import from `frontend/*`.
2. `frontend/*` must not import from backend internals in `server`.
3. `games/*/{web,mobile,contracts}` must not import backend internals.
4. `games/*/backend-adapter` must not import frontend internals.
5. `packages/*` must not import from `frontend/*`, `server/*`, or `games/*` internals.
6. Cross-layer communication is allowed only through:
   - HTTP APIs
   - shared contracts in `packages/shared`
   - SDK contracts in `packages/game-sdk`

## Why
These constraints prevent accidental coupling now that the canonical runtime lives in `server/`, `frontend/*`, and `games/*`.

## Enforcement
`./scripts/check-boundaries.sh` runs in local checks and CI (`pnpm boundary:check`).

## What remains
1. Expand the policy docs so they describe how additional games should preserve these boundaries.
2. Keep the boundary script aligned with future mobile and multi-game additions.
