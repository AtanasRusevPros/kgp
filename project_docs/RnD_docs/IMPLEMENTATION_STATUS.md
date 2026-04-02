# Kids Games Platform — Implementation Status

Single source of truth for what is implemented, what is partial, and what is deferred.
Every entry is evidence-backed with file paths, script names, or endpoint references.

> **See also:** [`WORKLOG_initial.md`](WORKLOG_initial.md) for phase-by-phase narrative and rationale.
> **Roadmap context:** [`USAGE.md`](USAGE.md) for executable workflows.
> **Modularity execution tracker:** [`PHASE_EXECUTION_TRACKER_2_PENDING.md`](../ongoing/PHASE_EXECUTION_TRACKER_2_PENDING.md).
> **In-progress test-orchestration follow-up:** [`TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`](../ongoing/TESTS_IMPROVEMENTS_IN_PROGRESS_4.md).

Updated: 2026-04-02 10:05 EEST

## 2026 Modularity Rework Snapshot
Current effective state:
1. `P0`, `P2`, `P4`, `P5`, and the flashcards game-module slice of `P7` are implemented.
2. `P3` and `P6` remain partial, while the remaining doc/cleanup follow-up has been narrowed to future-game agent readiness and test-orchestration work.

Implemented highlights:
1. Backend allowlist registry and health endpoint.
2. Expanded game metadata contracts and schema migration.
3. Delegated game-session token issuance now enforces scope subset checks against the integration client and the game's declared required scopes for points writes.
4. Registry-driven game routing in web shell.
5. Game module structure and architecture boundary checks wired into CI, including target topology roots.
6. Tic-tac-toe now uses a Figma-inspired responsive motion UI with animated marks, local scorekeeping, and confetti celebration while preserving browser-local gameplay.
7. Tic-tac-toe now also includes a user-facing effects toggle that overrides reduced-motion for celebratory effects when enabled, so motion, hover feedback, and confetti can be turned on or off without leaving the game.
8. Snake Classic is now implemented as a third browser-local game with a 50x50 canvas board, keyboard + hold-follow mouse + swipe controls, adaptive camera behavior, persistent high score/settings, and routed/e2e verification through the current KGP game registry model.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Status Matrix](#feature-status-matrix)
3. [Non-Functional Status Matrix](#non-functional-status-matrix)
4. [Test Status Matrix](#test-status-matrix)
5. [Known Gaps & Debt Register](#known-gaps--debt-register)
6. [Milestone-Oriented Next Steps](#milestone-oriented-next-steps)

---

## Executive Summary

The MVP remains usable and the automated suite is green, and the canonical runtime now lives under `server/` and `frontend/web/`; the platform now exposes three shipped games (`flashcards`, `tic-tac-toe`, and `snake-classic`) while the main remaining platform work stays focused on future-game guidance, mobile readiness, and the remaining test-orchestration follow-up.

| Dimension | Status |
|-----------|--------|
| Core gameplay (flashcards) | Complete |
| Auth (register/login/refresh/logout) | Complete |
| Podman container stack | Complete |
| CI pipeline (GitHub Actions) | Complete |
| Test suite | 228 tests passing (unit + integration + web + E2E) |
| Ops tooling (backup/restore, stack E2E) | Complete (added post-MVP) |
| Documentation | Implemented, with canonical `server/` and `frontend/*` runtime docs aligned plus active performance standards/tracker docs |

Deferred items (audio, points server-authority, mobile app, observability) are explicitly documented below.

---

## Feature Status Matrix

### Auth

| Feature | Status | Evidence |
|---------|--------|----------|
| Register (`POST /auth/register`) | Implemented | `server/src/routes/auth.ts`, integration tests pass |
| Login (`POST /auth/login`) | Implemented | `server/src/routes/auth.ts`, 9 auth unit tests |
| Refresh token (`POST /auth/refresh`) | Implemented | `server/src/services/auth.service.ts` |
| Logout (`POST /auth/logout`) | Implemented | Deletes refresh token from DB |
| JWT access tokens (15 min) | Implemented | `server/src/plugins/auth.ts` |
| Refresh tokens (7 days, rotated) | Implemented | `server/src/repositories/token.repository.ts` |
| Rate limiting on auth endpoints | Implemented | `server/src/plugins/rateLimit.ts` (Valkey or in-memory) |
| Account deletion | Deferred | No `DELETE /auth/me` endpoint; see gap #6 |
| Web login UI | Implemented | `frontend/web/src/pages/LoginPage.tsx` |
| Web register UI | Implemented | `frontend/web/src/pages/RegisterPage.tsx` |
| Protected route wrapper | Implemented | `frontend/web/src/components/ProtectedRoute.tsx` |
| Auto token refresh in client | Implemented | `frontend/web/src/services/api.ts` |

### Flashcards Gameplay

| Feature | Status | Evidence |
|---------|--------|----------|
| List all decks (`GET /flashcards/decks`) | Implemented | `server/src/routes/flashcards.ts` |
| Get deck by ID | Implemented | `GET /flashcards/decks/:deckId` |
| List cards in deck | Implemented | `GET /flashcards/decks/:deckId/cards` (all cards, no pagination) |
| Card progress (known list) | Implemented | `GET /flashcards/decks/:deckId/progress` |
| Mark card known/unknown | Implemented | `POST /flashcards/decks/:deckId/progress/known` |
| Save card position | Implemented | `POST /flashcards/decks/:deckId/progress/position` |
| Idempotency keys on writes | Implemented | `Idempotency-Key` header, 24h cache in `idempotency_keys` table |
| Deck picker UI with progress | Implemented | `frontend/web/src/pages/flashcards/DeckPickerPage.tsx` |
| Flashcard game UI | Implemented | `frontend/web/src/pages/flashcards/FlashcardGamePage.tsx` |
| Card flip animation | Implemented | `frontend/web/src/components/flashcards/FlashCard.tsx` |
| Known/unknown toggle | Implemented | `FlashCard.tsx` + progress service |
| Progress bar | Implemented | `frontend/web/src/components/flashcards/ProgressBar.tsx` |
| Shuffle (Fisher-Yates) | Implemented | `FlashcardGamePage.tsx` |
| Audio playback | Partial | `AudioButton` renders; disabled when `audioPath` is null; all seed cards have null audio |
| Card images | Implemented (SVG) | Inline base64 SVG data URIs in `image_path` column (see gap #3) |
| Cards pagination | Deferred | Returns all cards; `page`/`limit` params accepted but not implemented |

### Points

| Feature | Status | Evidence |
|---------|--------|----------|
| Points schema | Implemented | `user_points`, `user_game_points` tables in migration |
| `GET /points` | Implemented | `server/src/routes/points.ts` |
| `POST /points/add` | Partial | Requires delegated game-session token with game/user/scope checks, but the endpoint is still client-callable rather than server-authoritative |
| Points award on game completion | Deferred | No server-side game completion event triggers |
| Achievements/badges | Deferred | Not in scope for MVP |
| Leaderboard | Deferred | Not in scope for MVP |

### Game Catalog

| Feature | Status | Evidence |
|---------|--------|----------|
| `GET /games` | Implemented | `server/src/routes/games.ts` |
| `GET /games/:gameId` | Implemented | Returns 404 for unknown ID |
| Game menu UI | Implemented | `frontend/web/src/pages/MenuPage.tsx` |
| Game plugin registry | Partial | Web shell uses a registry-driven route build, and backend now registers allowlisted enabled adapters through a stricter loader path for flashcards, tic-tac-toe, and snake-classic, but the system is still limited to the current built-in adapter set rather than a fuller dynamic module ecosystem |
| Additional browser-local games | Implemented | `tic-tac-toe` and `snake-classic` are both seeded, allowlisted, registered in the web shell, and covered by routed tests |

### Rate Limiting

| Feature | Status | Evidence |
|---------|--------|----------|
| Auth endpoint rate limit (10/min) | Implemented | `server/src/plugins/rateLimit.ts` |
| Valkey backend | Implemented | Used when `VALKEY_URL` env is set |
| In-memory fallback | Implemented | Used when `VALKEY_URL` is absent (localhost-only) |
| Per-route limits (non-auth) | Deferred | Only auth endpoints limited in MVP |

### Observability

| Feature | Status | Evidence |
|---------|--------|----------|
| Health endpoint | Implemented | `GET /health` returns `{status:"ok",db:"ok"}` |
| Container logs | Implemented | `podman-compose logs -f [service]` |
| Structured logging (Pino) | Deferred | Fastify's default logger is present; not forwarded to aggregator |
| Prometheus metrics | Deferred | Phase 8 (optional), not implemented |
| Grafana dashboard | Deferred | Depends on metrics endpoint |
| Sentry / error tracking | Deferred | Not in scope for MVP |

### Mobile

| Feature | Status | Evidence |
|---------|--------|----------|
| Mobile app | Deferred (stub) | `frontend/mobile/README.md` only; no React Native/Expo code |

### Additional Games

| Feature | Status | Evidence |
|---------|--------|----------|
| Flashcards | Implemented | Full API + UI |
| Tic-Tac-Toe | Implemented | Web-only local-state second game integrated through seed metadata, allowlist exposure, web manifest, minimal backend adapter, and a Figma-inspired motion UI with local scorekeeping |
| Snake Classic | Implemented | Web-only local-state third game integrated through seed metadata, allowlist exposure, web manifest, minimal backend adapter, adaptive canvas rendering, persistent settings/high score, and routed e2e coverage |
| Any other game | Deferred | Architecture supports more games beyond the current three |

---

## Non-Functional Status Matrix

| Concern | Status | Notes |
|---------|--------|-------|
| TypeScript strict mode | Implemented | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` across all packages |
| ESLint passing | Implemented | Enforced as phase gate; `pnpm lint` passes clean |
| Type checking passing | Implemented | `pnpm typecheck` passes across all 5 workspace packages |
| Local test orchestration | Partial | `./dev.sh test:int`, `test:e2e`, and `test:full` now own isolated local DB-backed setup with managed test containers, but CI/stack alignment and fully zero-setup local bootstrap remain follow-up work; see `../ongoing/TESTS_IMPROVEMENTS_IN_PROGRESS_4.md` |
| HTTPS (production) | Ready | Caddy auto-provisions TLS when given a real domain in Caddyfile |
| HTTPS (localhost) | Optional | `ignoreHTTPSErrors: true` in playwright stack config |
| Rootless containers | Implemented | Podman rootless via `infra/podman/compose.yml` |
| Frozen lockfile in CI | Implemented | `pnpm install --frozen-lockfile` in `.github/workflows/ci.yml` |
| Offline progress queueing | Implemented | `frontend/web/src/services/offlineQueue.ts` |
| Idempotent writes | Implemented | `Idempotency-Key` header + `idempotency_keys` DB table |
| DB backup/restore | Implemented | `infra/podman/scripts/backup.sh`, `restore.sh`, `pnpm stack:backup/restore` |
| Account deletion (store compliance) | Deferred | Required for Apple/Google store; not needed for web-only localhost |
| Performance tuning | In progress | Toolkit, standards, active tracker, baseline/current reports, and capacity model are now in place; initial Tic-Tac-Toe/auth optimizations are measured, while further bottlenecks remain documented for follow-up |
| Scalability | Single-server MVP | Architecture supports horizontal scaling (stateless API, external DB); not tested |

---

## Test Status Matrix

| Suite | Runner | Test count | DB required | CI job | Notes |
|-------|--------|-----------|-------------|--------|-------|
| Shared schemas | vitest | 10 | No | `unit-tests` | Zod schema validation |
| Game SDK | vitest | 1 | No | `unit-tests` | Type export check |
| API unit | vitest | 30 | No | `unit-tests` | Auth service logic, health route, mappers, server lifecycle, adapter-loader validation, app startup adapter registration |
| Web components | vitest + jsdom | 94 | No | `web-tests` | All pages, services, hooks, unsupported-game route blocking, tic-tac-toe gameplay UI, snake engine/page/route wiring |
| API integration | vitest + pg | 83 | Yes (test DB) | `integration-tests` | All routes, repos, schema, seed, points, internal health, allowlist blocking, and snake metadata/allowlist exposure |
| E2E (dev mode) | Playwright | 5 | Yes (test DB + API runtime) | `e2e` (manual) | Use `./dev.sh test:e2e` to create an isolated test DB, start API, and run flashcards, blocked-route, tic-tac-toe, and snake-classic browser flows via Vite dev server |
| E2E (stack mode) | Playwright | 5 | Yes (full stack) | Manual (`pnpm test:e2e:stack`) | Same suite against Podman+Caddy stack via Caddy `/api` proxy |
| **Total automated** | | **228** | | | |

**Config files:**
- Dev E2E: `frontend/web/playwright.config.ts`
- Stack E2E: `frontend/web/playwright.stack.config.ts`
- Web component: `frontend/web/vitest.config.ts`
- API unit/integration: `server/vitest.unit.config.ts` / `server/vitest.integration.config.ts`

---

## Known Gaps & Debt Register

| # | Gap | Impact | Severity | Proposed Action |
|---|-----|--------|----------|-----------------|
| 1 | `POST /points/add` is client-callable | Users can self-award points | Medium | Move award logic to server-side game completion events (V2) |
| 2 | Audio files absent (`audio_path` is null) | AudioButton renders but is silent | Low | Source CC audio files, store as static assets or S3 URLs |
| 3 | Card images are inline base64 SVG in DB | Large text column values; slower than file serving | Low | Move to static file path or object storage URL |
| 4 | No cards pagination | Slow for decks > 200 cards | Low | Add `?page=1&limit=50` and cursor-based pagination |
| 5 | `user_known_cards.deck_id` is denormalized | Minor schema redundancy | Very Low | Evaluate JOIN performance at scale; remove if adequate |
| 6 | No account deletion | Store compliance risk (Apple/Google) | Medium (if going to store) | Add `DELETE /auth/me` with CASCADE |
| 7 | `sessions` table is unused | Dead schema weight | Very Low | Implement when multiplayer planned; table does no harm |
| 8 | Mobile app is a stub | No mobile experience | N/A for localhost | Implement React Native / Expo app as separate effort |
| 9 | Adding a second real game will still exercise the current manually assembled registry and adapter-extension path rather than a fuller discovery model | Future game work remains more explicit and hands-on than a fully pluggable architecture would allow | Medium | Use `../../docs/add-game-guide.md` for the current integration contract and continue `P3` only if multi-game expansion exposes gaps |
| 10 | No observability beyond health endpoint | Can't diagnose production issues | Medium (if going to production) | Add Pino log forwarding, prom-client metrics, Grafana |
| 11 | Stack E2E not in CI | Deployment-only regressions not automatically caught | Low | Add optional CI job triggered on release branch |

---

## Milestone-Oriented Next Steps

Ordered by product value and risk reduction.

### Milestone 1 — Audio support (Low risk, medium value)

- Source Creative Commons audio clips for the 20 seed vocabulary words
- Store as static files in `server/public/audio/` or an S3-compatible bucket
- Update `english-deck.json` with audio paths
- Re-seed: `pnpm db:reset`
- Verify AudioButton plays audio in the flashcard UI

### Milestone 2 — Second game (Medium risk, high value)

- Choose a game type (e.g., Spelling Bee, Word Match)
- Follow the canonical add-game guide in [`../../docs/add-game-guide.md`](../../docs/add-game-guide.md)
- Implement the game module under `games/<id>/...`, add any required backend adapter, add web pages/tests, and verify allowlist exposure through the current registry/loader flow

### Milestone 3 — Account deletion (Medium risk, store compliance)

- Add `DELETE /auth/me` route in `server/src/routes/auth.ts`
- Repository: `DELETE FROM users WHERE id = $1` (CASCADE handles all related data)
- Add confirmation dialog in web UI settings page
- Integration test: verify all related rows deleted

### Milestone 4 — Points server-authority (Medium risk, security)

- Remove `POST /points/add` public endpoint (or gate behind admin role)
- Trigger point awards from game completion event handlers server-side
- Update integration tests

### Milestone 5 — Observability (Low risk, production readiness)

- Configure Pino JSON logging and ship to a log aggregator (Loki, Datadog, etc.)
- Add `prom-client` metrics endpoint (`GET /metrics`)
- Provision Grafana dashboard for API latency, error rates, DB pool usage
- Add frontend Sentry integration for JS error tracking

### Milestone 6 — Real domain + TLS (Config-only, high visibility)

- Update `infra/podman/caddy/Caddyfile` with your domain name
- Caddy provisions TLS automatically via Let's Encrypt
- Set `NODE_ENV=production`, rotate JWT secrets
- Point DNS to server IP

### Milestone 7 — Stack E2E in CI (Low risk, quality gate)

- Add a `stack-e2e` CI job triggered manually or on `release/*` branches
- Use `podman-compose up -d` + smoke test + `test:e2e:stack`
- Fails the release gate if Caddy proxy routes or TLS are broken

## 2026-03-11 Session Summary

This session completed the second commit review/fix cycle and the follow-up container/documentation hardening.

Completed in this session:
1. Review findings were implemented and the closed review was preserved as [`COMMIT_CODE_REVIEW_2_DONE-2026-03-11.md`](../history/COMMIT_CODE_REVIEW_2_DONE-2026-03-11.md).
2. Delegated game-session scope issuance was hardened and aligned with game metadata enforcement.
3. Flashcards metadata, tests, env docs, and guard-rail scripts were corrected to match the implemented security and modularity behavior.
4. The flashcards backend adapter was extracted into a dedicated workspace package under `games/flashcards/backend-adapter`.
5. Podman API/web container builds and runtime layout were corrected for the workspace-package architecture.
6. `stack:verify` was added and expanded into a full rebuild/smoke/migrate/seed/restart/smoke/teardown validation path.
7. Container-only issues discovered during execution were fixed, including Caddy HTTP routing, seed-data runtime assets, migration sequencing, and API graceful shutdown.
8. The graceful-shutdown cleanup issue was resolved by adding explicit `SIGINT`/`SIGTERM` handling in the API runtime.

Pending after this session:
1. Broader modularity execution still has open follow-up in `P3` and `P6`; see [`PHASE_EXECUTION_TRACKER_2_PENDING.md`](../ongoing/PHASE_EXECUTION_TRACKER_2_PENDING.md).
2. Architecture boundary policy remains active and should stay aligned with future mobile and additional-game work; see [`ARCHITECTURE_BOUNDARY_POLICY_PENDING.md`](../../docs/ARCHITECTURE_BOUNDARY_POLICY_PENDING.md).
3. Test cold-start/self-owned orchestration still needs follow-up; see [`TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`](../ongoing/TESTS_IMPROVEMENTS_IN_PROGRESS_4.md).
4. AI-optimized documentation/rules/check workflow and mandatory cheap local verification rules remain pending; see [`TESTS_IMPROVEMENTS_IN_PROGRESS_4.md`](../ongoing/TESTS_IMPROVEMENTS_IN_PROGRESS_4.md).
