# Add Game Guide

Canonical guide for adding any additional game to the platform.

Use this as the single source of truth for:
1. required game structure
2. backend and web integration rules
3. allowlist and security expectations
4. future mobile-readiness constraints
5. required tests and docs updates

## Current platform reality

The canonical runtime roots are:
1. `server/`
2. `frontend/web/`
3. `frontend/mobile/` (placeholder only)
4. `games/<gameId>/...`

Current limits you must respect:
1. backend adapters are loaded from a strict built-in set, not by automatic workspace discovery
2. web routes are assembled in the central registry, not discovered automatically
3. mobile structure is enforced, but there is no live mobile runtime yet
4. flashcards is the richer backend-backed reference, while tic-tac-toe is the simpler browser-local reference that still needs a minimal adapter because of the current loader rules

## Fast path for an additional game

For any new game, do all of the following:
1. choose one stable game ID in lowercase kebab-case
2. create the full `games/<gameId>/...` layout
3. at task provision, explicitly decide whether the game should be enabled in the active runtime when implementation is complete
4. add DB seed metadata for the game
5. add the game ID to `ALLOWED_GAME_IDS` only in environments where it should be reachable
6. add the web manifest at `games/<gameId>/web/src/module.ts`
7. register the game in `frontend/web/src/games/registry.tsx`
8. add or extend the backend adapter path as required by the game type
9. add the required tests, including e2e or another applicable end-to-end path for every real user-facing game route
10. update the required docs

## Exposure decision required

Updated: 2026-03-30 12:32 EEST

Treat implementation and runtime exposure as separate decisions.

At task provision, ask whether the new game should be enabled in the active runtime when implementation is complete.
Lock that answer into the plan before coding.

If the user wants the game enabled immediately:
1. ensure the game is seeded and enabled in `server/src/db/seed.ts`
2. add the game ID to `server/.env.example`
3. update the active runtime env (`server/.env` or deployment env) so `ALLOWED_GAME_IDS` includes the new game ID
4. re-seed the database so the new game metadata exists in the running DB
5. restart the API or stack so the updated env is actually loaded
6. treat this as part of the same implementation task whenever the agent has access to the active runtime env

If the user does not want immediate exposure:
1. complete the game code, tests, and docs normally
2. leave the active runtime env allowlist unchanged
3. state clearly in the handoff that the game will remain hidden from `/games` and the homepage until allowlist + seed + restart are performed

## Completion criteria

A game is correctly integrated only when all of the following are true:
1. it has the complete required module layout
2. its IDs, route base, metadata, and manifests are internally consistent
3. it is seeded and enabled in the `games` table if it should be exposed
4. it is allowlisted if it should be reachable
5. it has the correct adapter shape for its game type
6. it is registered in the web registry
7. unsupported or blocked runtime paths fail safely
8. required tests pass
9. required docs are updated

## Required directory layout

Every game must live under:

```text
games/<gameId>/
├── README.md
├── contracts/
├── web/
│   └── src/
│       └── module.ts
├── mobile/
└── backend-adapter/
    └── src/
        └── index.ts
```

Current conformance enforcement from `scripts/check-game-structure.sh` requires:
1. `contracts/`
2. `web/`
3. `mobile/`
4. `backend-adapter/`
5. `README.md`
6. `web/src/module.ts`
7. `backend-adapter/src/index.ts`

Important notes:
1. `mobile/` must exist even though mobile runtime is not live yet
2. `backend-adapter/src/index.ts` must exist even for a browser-local game
3. do not put game-owned code into `server/` or `frontend/web/` unless the platform layer truly owns that bridge point

## Naming and identity rules

Use one stable game ID everywhere.

The same game ID must match across:
1. `games/<gameId>/...`
2. DB seed metadata
3. backend adapter `gameId`
4. web manifest `id`
5. `ALLOWED_GAME_IDS`

Route rules:
1. `routeBase` must be unique
2. `routeBase` must begin with `/`
3. all game-owned routes must stay under that route base
4. route IDs should be prefixed by the game ID, for example `tic-tac-toe.board`

## Game types

### 1. Browser-local game

Use this when gameplay lives in the browser and does not need backend-owned game state.

Required:
1. full `games/<gameId>/...` layout
2. DB metadata and seed record
3. allowlist entry if the game should be reachable
4. web manifest and registry entry
5. a minimal adapter package so the current loader rules are satisfied
6. web tests
7. e2e or another applicable routed end-to-end test for the real user path

### 2. Backend-backed game

Use this when the game owns API routes, reads, writes, or DB-backed game state.

Required:
1. everything from browser-local game
2. a real backend adapter
3. loader registration through the current startup path
4. integration tests for backend behavior and allowlist behavior
5. e2e or another applicable routed end-to-end test for the real user path

### 3. Privileged/backend-integrated game

Use this when the game performs protected writes such as points or delegated game actions.

Required:
1. everything from backend-backed game
2. app client seed/config
3. delegated game-session flow through `POST /auth/game-session`
4. tests for wrong scope, wrong game, wrong user, and allowlist enforcement
5. e2e or another applicable routed end-to-end test for the real user path

### 4. Mobile-planned game

Use this when the game is web-first now but should remain portable to a future mobile client.

Required:
1. everything from one of the above game types
2. contracts and game metadata that do not assume a web-only future
3. a clean `games/<gameId>/mobile/` ownership placeholder

## Backend contract

### When a real backend adapter is required

Use a real backend adapter when the game:
1. exposes backend-owned HTTP routes
2. reads game data from the API
3. writes game state through the backend
4. participates in delegated game-session flows

### Current adapter shape

The current server-side adapter contract is:
1. `gameId: string`
2. `register(app: FastifyInstance): Promise<void>`

The adapter must:
1. use the same `gameId` as the DB record, manifest, and allowlist
2. register only that game's backend surface
3. fail clearly if its configuration is invalid

Current loader behavior:
1. only allowlisted and enabled games are candidates for loading
2. duplicate adapter IDs fail startup
3. missing adapters for allowlisted enabled games fail startup
4. adapter registration failures fail startup

Implications:
1. every enabled and allowlisted live game still needs an adapter entry today
2. browser-local games may use a minimal no-op adapter
3. new backend-backed games require extending the current built-in adapter set in server code

### Allowlist and exposure rules

A game is reachable only when the relevant gates agree:
1. the game exists in DB metadata
2. the game is enabled in the `games` table
3. the game ID is in `ALLOWED_GAME_IDS`
4. if backend-backed, its adapter loads successfully

Blocked behavior expectations:
1. unallowlisted games must not appear in `/games`
2. unallowlisted games must not be reachable via `/games/:gameId`
3. missing adapters for allowlisted enabled games must fail safely and visibly
4. diagnostics must remain available via `GET /internal/games/health`

### Privileged-flow rules

If the game performs protected writes, use the delegated game-session model.

The privileged route must validate:
1. authenticated user
2. valid game-session token
3. matching game ID
4. matching user ID
5. required scopes

Do not add client-writable privileged behavior that bypasses this model.

## Web contract

Every game must provide `games/<gameId>/web/src/module.ts`.

The current manifest must provide:
1. `id`
2. `routeBase`
3. `routes`

Each route entry must provide:
1. `path`
2. `routeId`
3. `requiresAuth`

Current web integration is two-step:
1. the game-owned manifest describes route metadata
2. `frontend/web/src/games/registry.tsx` maps route IDs to actual React elements

Required behavior:
1. keep game-owned routes under the game route base
2. mark protected routes with `requiresAuth: true`
3. ensure unsupported or unavailable routes fail into blocked-game behavior instead of uncaught router errors

## Platform-owned vs game-owned responsibilities

Platform-owned:
1. auth shell and protected-route wrapper
2. allowlist enforcement
3. `/games` exposure rules
4. delegated game-session issuance and validation
5. boundary and conformance checks
6. top-level routing shell and blocked-game fallback behavior

Game-owned:
1. game-specific contracts
2. manifest and route IDs
3. game pages/components
4. game-specific backend behavior
5. game-specific tests

## Mobile-readiness rules

The repo is only scaffold-ready for mobile today. Treat mobile as a future compatibility constraint, not a live runtime target.

Preserve these now:
1. keep reusable game rules and metadata out of web-only UI code when possible
2. avoid web-only assumptions in reusable game data
3. keep `games/<gameId>/mobile/` ready for future ownership
4. keep route and game identity stable across platforms

Do not assume:
1. a live Expo or React Native client
2. mobile-specific runtime wiring
3. mobile-specific adapters

## Required tests for every new game

These are mandatory. A new game is not complete without the applicable checks.

Always run:
1. `pnpm games:conformance`
2. `pnpm boundary:check`
3. `pnpm build`

Run when shared logic or contracts changed:
1. `pnpm test:unit`

Run when backend behavior or DB-backed routes changed:
1. `./dev.sh test:int`

Run when web pages, routing, menus, or blocked-game behavior changed:
1. `pnpm test:web`

Run for every new live game route or changed real user path:
1. `./dev.sh test:e2e`
2. if Playwright is not the right fit, add another equivalent end-to-end or app-shell route test and explain why

Rule:
1. every new user-launchable game must have at least one meaningful routed end-to-end test that proves the real app path works, not only isolated component tests

## Required docs updates

At minimum, update:
1. `README.md` if the project-level game list or local run expectations changed
2. `project_docs/RnD_docs/IMPLEMENTATION_STATUS.md`
3. `project_docs/RnD_docs/WORKLOG_curr.md` with a timestamped append
4. any relevant ongoing tracker if the new game changes phase or readiness status

If architecture assumptions change, also update:
1. `project_docs/RnD_docs/ARCHITECTURE.md`
2. `docs/ARCHITECTURE_BOUNDARY_POLICY_PENDING.md` if boundary expectations changed

## Reference games

Use flashcards to study:
1. backend-backed route shape
2. delegated flow pattern
3. DB-backed test placement

Use tic-tac-toe to study:
1. minimal second-game structure
2. browser-local gameplay pattern
3. minimal adapter pattern required by the current loader
4. routed game verification with web and e2e coverage

Do not assume either reference game defines the only valid shape for future games unless this guide explicitly says so.

## Agent execution instruction

If you are an AI agent adding a game:
1. read this guide fully before editing
2. identify the target game type
3. create a concrete implementation and verification plan based on this guide
4. only after the plan is complete, execute the game-creation task from that plan
5. finish by running the applicable checks, reviewing affected docs, and updating the worklog with a timestamped append
