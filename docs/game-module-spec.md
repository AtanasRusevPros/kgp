# Game Module Spec

## Required game directory shape
Each game under `games/<gameId>/` must include:
1. `contracts/`
2. `web/`
3. `mobile/`
4. `backend-adapter/`

Enforced by: `pnpm games:conformance`.

Current conformance checks require:
1. `README.md`
2. `web/src/module.ts`
3. `backend-adapter/src/index.ts`

## Backend integration requirements
1. Game must be allowlisted (`ALLOWED_GAME_IDS`).
2. Game must exist and be enabled in `games` DB table.
3. Privileged write flows must use delegated game-session token and scope checks.

## Web integration requirements
1. Game manifest/metadata must provide route base and targets.
2. App shell routes are composed from registry entries, not hardcoded per-game in `App.tsx`.
