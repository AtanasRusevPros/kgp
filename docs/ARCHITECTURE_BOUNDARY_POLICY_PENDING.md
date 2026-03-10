# Architecture Boundary Policy Pending

Updated: 2026-03-11 00:09 EET

This policy defines hard import/layer boundaries during modularity rework.

## Boundary rules
1. `apps/api` must not import from `apps/web` or `apps/mobile`.
2. `apps/web` and `apps/mobile` must not import from `apps/api` internals.
3. `frontend/*` must not import backend internals from `apps/api` or `server`.
4. `server/*` must not import frontend internals from `apps/*` or `frontend/*`.
5. `games/*/{web,mobile,contracts}` must not import backend internals.
6. `games/*/backend-adapter` must not import frontend internals.
7. `packages/*` must not import from `apps/*`, `frontend/*`, `server/*`, or `games/*` internals.
8. Cross-layer communication is allowed only through:
   - HTTP APIs
   - shared contracts in `packages/shared`
   - SDK contracts in `packages/game-sdk`

## Why
These constraints prevent accidental coupling while the repository is being restructured into `server/`, `frontend/*`, and `games/*`.

## Enforcement
`./scripts/check-boundaries.sh` runs in local checks and CI (`pnpm boundary:check`).

## Migration note
The repository is still in compatibility mode for the broader `server/` and `frontend/*` cutover, but the boundary script now scans those target topology roots as well so future movement is guarded rather than undocumented.

## What remains
1. The target runtime topology is not yet fully migrated away from `apps/*` compatibility paths.
2. Boundary policy is enforced, but it is still governing a mixed compatibility-mode repository rather than a fully completed cutover.
