# Backend Allowlist and Security Model

## Allowlist
1. Backend loads game access policy from `config.allowedGameIds`.
2. Non-allowlisted game IDs are rejected for protected game flows.
3. Registry diagnostics endpoint: `GET /internal/games/health`.

## Dual identity model (implemented core slice)
1. User identity: standard access token (`Authorization: Bearer ...`).
2. App identity: validated during `POST /auth/game-session` via game client credentials.
3. Delegated token: `gameSessionToken` issued by backend with game-bound audience and scopes.

## Privileged route enforcement
For `POST /points/add`:
1. User must be authenticated.
2. `x-game-session-token` must be valid.
3. Session token user must match authenticated user.
4. Session token game must match payload `gameId`.
5. Session token must include required scope (`points:add`).
