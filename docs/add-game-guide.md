# Add Game Guide

Canonical guide for adding any additional game to the platform.

This is the single source of truth for:
1. required game module structure
2. backend and web integration contracts
3. allowlist and security expectations
4. future mobile-readiness constraints
5. verification and documentation updates

## Current platform reality

The current canonical runtime roots are:
1. `server/`
2. `frontend/web/`
3. `frontend/mobile/` (placeholder only)
4. `games/<gameId>/...`

Important current limits:
1. The backend adapter loader is strict and allowlist-driven, but it still loads from the current built-in adapter set rather than dynamic discovery.
2. The web shell builds routes from a registry, but registry entries are still assembled in code rather than discovered automatically.
3. Mobile structure is enforced at the directory level, but there is no live mobile runtime yet.
4. Flashcards is the only live game today and should be used as a reference example, not as a special-case rule.

## Completion criteria for a new game

A new game is correctly integrated only when all of the following are true:
1. It has a complete `games/<gameId>/...` module layout.
2. Its IDs, routes, metadata, and manifests are internally consistent.
3. It is present in seed data and enabled in the `games` table if it should be exposed.
4. It is allowlisted through `ALLOWED_GAME_IDS` if it should be reachable.
5. Its backend adapter exists when the game needs backend-owned routes.
6. Its web module is registered in the current web registry path.
7. Unsupported or blocked runtime paths fail safely.
8. Required tests and docs updates have been added.

## Required directory and file layout

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

Current conformance enforcement comes from `scripts/check-game-structure.sh` and requires:
1. `contracts/`
2. `web/`
3. `mobile/`
4. `backend-adapter/`
5. `README.md`
6. `web/src/module.ts`
7. `backend-adapter/src/index.ts`

Notes:
1. Even if mobile is not implemented yet, the `mobile/` directory must exist.
2. Even if the backend adapter is minimal, `backend-adapter/src/index.ts` must exist because the current conformance rules require it.
3. Do not place game-owned UI or backend code directly in `frontend/web/` or `server/` unless the platform layer truly owns it.

## Naming and identity rules

Use one stable game ID everywhere.

The game ID must match across:
1. `games/<gameId>/...`
2. DB seed metadata in the `games` table
3. backend adapter `gameId`
4. web module `id`
5. allowlist entry in `ALLOWED_GAME_IDS`

Route rules:
1. `routeBase` must be unique across games.
2. `routeBase` must begin with `/`.
3. Web route paths should stay under that game's route base.
4. Route IDs should be prefixed by the game ID, for example `tic-tac-toe.board`.

Recommended naming:
1. game ID: lowercase kebab-case
2. route IDs: `<gameId>.<page-or-flow>`
3. app client IDs for privileged games: `<gameId>-web-dev` or an equivalent environment-specific form

## Game types and requirements

### Web-only game

Use this when the game needs no backend-owned routes and no privileged server write flow.

Required:
1. full `games/<gameId>/...` layout
2. DB game metadata and seed record
3. allowlist entry if it should appear in live runtime
4. web manifest and registry entry
5. web tests and any shared-logic unit tests

Backend-adapter expectation:
1. keep `backend-adapter/src/index.ts` present for conformance
2. the adapter can remain minimal only if the game is not enabled and allowlisted in a way that requires backend route registration

### Backend-backed game

Use this when the game needs backend-owned HTTP routes, reads, or writes.

Required:
1. everything from web-only game
2. a real backend adapter
3. adapter registration through the current loader-backed server startup path
4. integration tests for the backend routes and allowlist behavior

### Privileged/backend-integrated game

Use this when the game needs protected writes such as points or any server-owned action that must be scoped to both the user and the game.

Required:
1. everything from backend-backed game
2. app client credentials in seed/config
3. delegated game-session flow through `POST /auth/game-session`
4. tests covering missing scope, wrong game, wrong user, and allowlist enforcement

### Mobile-planned game

Use this when the game is web-first today but must remain portable to a future mobile client.

Required:
1. everything from one of the above game types
2. avoid web-specific assumptions in game-owned contracts
3. keep the `mobile/` area ready for future shared game assets and flow ownership

## Backend integration contract

### When a backend adapter is required

A game needs a real backend adapter when any of the following is true:
1. it exposes backend-owned HTTP routes
2. it reads game data from the database through the API
3. it writes protected progress or other game state through backend-owned endpoints
4. it participates in privileged delegated game-session flows

### Adapter contract

The current server-side adapter contract is effectively:
1. `gameId: string`
2. `register(app: FastifyInstance): Promise<void>`

The adapter must:
1. use the same `gameId` as the DB/game manifest/allowlist
2. register only that game's backend surface
3. fail clearly if its configuration is invalid

The current loader behavior is strict:
1. only allowlisted and enabled games are candidates for loading
2. duplicate adapter IDs fail startup
3. missing adapters for allowlisted enabled games fail startup
4. adapter registration failures propagate and fail startup

Current limitation:
1. adapters are still resolved from the built-in adapter set in server code, not by scanning the workspace dynamically

Implication for new games:
1. adding a new backend-backed game currently requires extending the active adapter set used by the loader
2. do not document or assume automatic adapter discovery that does not exist yet

### DB and allowlist exposure rules

A game is reachable only when all of the relevant gates agree:
1. the game exists in seed/DB metadata
2. the game is enabled in the `games` table
3. the game ID is present in `ALLOWED_GAME_IDS`
4. if backend-backed, its adapter is present and loads successfully

Blocked behavior expectations:
1. unallowlisted games must not appear in `/games`
2. unallowlisted games must not be reachable via `/games/:gameId`
3. missing allowlisted adapter IDs must be surfaced by startup failure or diagnostics
4. diagnostics must remain visible via `GET /internal/games/health`

### Privileged-flow rules

If a game performs privileged writes, use the delegated game-session model.

Required behavior:
1. user identity comes from the normal authenticated user token
2. app identity is validated when requesting `POST /auth/game-session`
3. delegated scopes must be a subset of the app client's allowed scopes
4. if scopes are omitted, the backend defaults to the game's required scopes
5. the privileged route must validate:
   - authenticated user
   - valid game-session token
   - matching game ID
   - matching user ID
   - required scopes

Do not add privileged client-writable behavior that bypasses this model.

## Web integration contract

Every game must provide `games/<gameId>/web/src/module.ts`.

The current web manifest must provide:
1. `id`
2. `routeBase`
3. `routes`

Each route entry must provide:
1. `path`
2. `routeId`
3. `requiresAuth`

The current web shell contract is two-step:
1. the game-owned manifest describes route metadata
2. `frontend/web/src/games/registry.tsx` maps route IDs to actual React elements and exports a `WebGameModule`

Current limitation:
1. route elements are still assembled in the central web registry
2. a new game therefore requires a new registry entry and element mapping, not only a manifest file

Required behavior:
1. keep all game-owned routes under the game's route base
2. mark protected routes with `requiresAuth: true`
3. ensure unsupported or unavailable routes fail into the existing blocked-game behavior rather than an uncaught router error

## Platform-owned vs game-owned responsibilities

Platform-owned:
1. auth shell and protected-route wrapper
2. allowlist enforcement
3. `/games` exposure rules
4. delegated game-session issuance and validation
5. boundary and conformance checks
6. top-level routing shell and unsupported-game fallback behavior

Game-owned:
1. game-specific contracts
2. game manifest and route IDs
3. game pages/components
4. game-specific backend adapter behavior
5. game-specific tests

Do not move platform policy into a game module, and do not hardcode game-specific behavior in platform layers unless the current architecture explicitly requires that bridge point.

## Future mobile-readiness rules

The repo is only scaffold-ready for mobile today. Treat mobile as a future compatibility constraint, not as a live runtime target.

What to preserve now:
1. keep game-specific rules and metadata out of web-only UI components when they can live in game-owned contracts
2. avoid web-only naming or assumptions in reusable game data
3. keep `games/<gameId>/mobile/` available for future ownership
4. keep route and game identity stable across platforms

What is optional now:
1. real mobile screens
2. mobile-specific navigation
3. mobile runtime packaging

What should not be assumed:
1. a live Expo or React Native client
2. mobile-specific adapters or runtime wiring

## Required workflow for adding a new game

1. Choose the game ID, route base, and game type.
2. Create the full `games/<gameId>/...` layout.
3. Add or update the game `README.md` with module purpose and ownership.
4. Add game metadata to the DB seed and ensure the game can be enabled.
5. Update `ALLOWED_GAME_IDS` for environments where the game should be exposed.
6. Add the web manifest in `games/<gameId>/web/src/module.ts`.
7. Add the web registry entry and route element mapping in the current `frontend/web` registry path.
8. If the game is backend-backed, add the backend adapter and extend the current active adapter set.
9. If the game is privileged, add app-client seed/config and delegated game-session coverage.
10. Add tests for the game type you chose.
11. Update user-facing and architecture docs where the available game list or platform capabilities changed.

## Verification checklist

Always run:
1. `pnpm games:conformance`
2. `pnpm boundary:check`
3. `pnpm build`

Run when shared logic or backend contracts changed:
1. `pnpm test:unit`

Run when backend behavior or DB-backed routes changed:
1. `./dev.sh test:int`

Run when web routing, pages, or blocked-game behavior changed:
1. `pnpm test:web`

Run when browser launch flow or real user path changed:
1. `./dev.sh test:e2e`

Run when stack or container behavior changed:
1. `./dev.sh stack:verify`

## Required docs updates for a new game

At minimum, update:
1. `README.md` if the project-level game list or local run expectations changed
2. `project_docs/RnD_docs/IMPLEMENTATION_STATUS.md`
3. `project_docs/RnD_docs/WORKLOG_curr.md` with a timestamped append
4. any relevant ongoing tracker if the new game changes phase status

If the game changes architecture assumptions, also update:
1. `project_docs/RnD_docs/ARCHITECTURE.md`
2. `docs/ARCHITECTURE_BOUNDARY_POLICY_PENDING.md` if new boundary expectations are introduced

## Flashcards as example, not special rule

Flashcards is the current reference implementation because it is the only live game.

Use it to study:
1. game README structure
2. web manifest shape
3. backend adapter pattern
4. seed metadata pattern
5. existing test placement

Do not assume:
1. future games must expose the same exact route structure
2. future games must reuse flashcards-specific page layout
3. flashcards-specific implementation details are platform requirements unless they are explicitly listed in this guide
