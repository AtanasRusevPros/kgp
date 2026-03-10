# Architecture Boundary Policy (P0 Guard Rail)

This policy defines hard import/layer boundaries during modularity rework.

## Boundary rules
1. `apps/api` must not import from `apps/web` or `apps/mobile`.
2. `apps/web` and `apps/mobile` must not import from `apps/api` internals.
3. `packages/*` must not import from `apps/*` internals.
4. Cross-layer communication is allowed only through:
   - HTTP APIs
   - shared contracts in `packages/shared`
   - SDK contracts in `packages/game-sdk`

## Why
These constraints prevent accidental coupling while the repository is being restructured into `server/`, `frontend/*`, and `games/*`.

## Enforcement
`./scripts/check-boundaries.sh` runs in local checks and CI (`pnpm boundary:check`).

## Migration note
This policy is intentionally strict and may be expanded when paths are migrated from `apps/*` to `server/`, `frontend/*`, and `games/*`.
