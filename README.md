# Kids Games Platform

Free/open-source kids games platform MVP. Initial game: Flash Cards.
Single-server deployment via Podman rootless containers, localhost-first.

> Full developer guide: [`USAGE.md`](project_docs/RnD_docs/USAGE.md)

## Architecture Update (2026-03)
The platform is now on a phased modularity rework path:
1. Closed allowlist model for games (`ALLOWED_GAME_IDS`).
2. Extended game metadata contracts from `/games`.
3. Registry-driven web game routing (`frontend/web/src/games/registry.tsx`).
4. Delegated game session token flow for privileged routes (`POST /auth/game-session`).
5. Game/module conformance and boundary checks in quality gates (`pnpm boundary:check`, `pnpm games:conformance`).

Execution tracking:
- [`GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md`](project_docs/ongoing/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md)
- [`GAME_MODULARITY_ITERATION_PLAN_SHORT.md`](project_docs/ongoing/GAME_MODULARITY_ITERATION_PLAN_SHORT.md)
- [`PHASE_EXECUTION_TRACKER_2_PENDING.md`](project_docs/ongoing/PHASE_EXECUTION_TRACKER_2_PENDING.md)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Developer Script (dev.sh)](#developer-script-devsh)
3. [First-time Setup](#first-time-setup)
4. [Running the Stack](#running-the-stack)
   - [Option A — Direct (dev mode)](#option-a--direct-dev-mode)
   - [Option B — Containers (Podman)](#option-b--containers-podman)
5. [Database Commands](#database-commands)
6. [Running Tests](#running-tests)
7. [Building for Production](#building-for-production)
8. [Environment Variables](#environment-variables)
9. [Ports & URLs Reference](#ports--urls-reference)
10. [Troubleshooting](#troubleshooting)

---

## Developer Script (dev.sh)

A single convenience script at the repo root wraps every common task:

```bash
./dev.sh <target>
```

Print the full command reference at any time:

```bash
./dev.sh help
```

```
Usage: ./dev.sh <target>

Setup
  init                Full first-time setup: install + .env + db start + migrate + seed

Development
  server              Start API dev server  (http://localhost:3000)
  web                 Start web dev client  (http://localhost:5173)
  build               Build all TypeScript packages

Quality
  lint                Run ESLint
  typecheck           Run TypeScript type check
  check               Run lint + typecheck together

Tests
  test:unit           Unit tests (no DB required)
  test:web            Web component tests — vitest + jsdom (no DB required)
  test:int            API integration tests (owns an isolated test DB container)
  test:e2e            Playwright e2e tests (owns an isolated test DB container + API)
  test:e2e:stack      Playwright e2e tests against container stack (http://localhost:8080)
  test:full           Full local suite with one shared isolated test DB for DB-backed steps

Database (local dev container)
  db:start            Start Postgres container
  db:stop             Stop Postgres container
  db:container:reset  Stop + remove container (wipes volume)
  db:migrate          Apply pending migrations
  db:migrate:down     Roll back last migration
  db:seed             Insert seed data (idempotent)
  db:wipe             Drop all tables, re-migrate, re-seed (destructive)

Container stack (Podman full stack — http://localhost:8080)
  stack:init          First-time: build images + up + wait + migrate + seed
  stack:build         Build container images only (api + web)
  stack:up            Start stack (uses existing images)
  stack:rebuild       Rebuild images and restart stack  (after code changes)
  stack:restart       Restart stack without rebuilding  (after config changes)
  stack:down          Stop and remove stack containers
  stack:migrate       Apply DB migrations inside the running API container
  stack:seed          Seed DB inside the running API container
  stack:logs [svc]    Follow logs — all services or one (e.g. api, web, db, caddy)
  stack:smoke         Run smoke test (waits for health, checks web + API)
  stack:verify        Rebuild stack, smoke, migrate, seed, restart, smoke again, then tear down
  stack:ps            Show status of stack containers

Backup / Restore
  backup              Dump DB to infra/podman/backups/
  restore <file>      Restore DB from a backup file

Misc
  status              Show all container status and .env presence
  help                Show this help
```

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 20.x | LTS recommended |
| pnpm | 9.x | `npm install -g pnpm@9` |
| PostgreSQL | 16.x | Or use Podman (no local install needed) |
| Podman | 4.x | Only for container-based stack |
| podman-compose | 1.x | `pip install podman-compose` |

> **No PostgreSQL locally?** Use Option B (Podman) which spins up the DB in a container, or run just the DB container with `./scripts/dev-db.sh`.

---

## First-time Setup

### Quick path (recommended)

From the repo root, one command does everything:

```bash
git clone <repo-url>
cd <repo-name>
./dev.sh init
```

`init` runs: `pnpm install` → copies `.env.example` → starts the DB container → migrates → seeds.

### Manual steps

```bash
# 1. Clone and enter the repo
git clone <repo-url>
cd <repo-name>

# 2. Install all dependencies (all workspaces)
pnpm install

# 3. Copy the API environment file
cp server/.env.example server/.env
# Edit server/.env if you need non-default values

# 4. Start the database (Podman, rootless)
./scripts/dev-db.sh start

# 5. Run migrations to create all tables
pnpm db:migrate

# 6. Seed the database with the flashcard deck
pnpm db:seed
```

After setup the database has:
- 1 game record (`flashcards`)
- 1 English deck ("English Basics")
- 20 vocabulary cards with embedded SVG images

---

## Running the Stack

### Option A — Direct (dev mode)

Run the API and web app in two separate terminals. Hot-reload is active in both.

**Terminal 1 — API server:**
```bash
./dev.sh server
# Listens on http://localhost:3000
```

**Terminal 2 — Web app:**
```bash
./dev.sh web
# Listens on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> **Database must be running** — start it with `./scripts/dev-db.sh start` if you haven't already.

---

### Option B — Containers (Podman)

Runs the full stack (DB + API + Web + Caddy reverse proxy) as rootless containers.

```bash
# First-time: build images, start, and seed in one step
./dev.sh stack:init

# Subsequent starts (images already built)
./dev.sh stack:up

# Rebuild + verify the container basics end-to-end
./dev.sh stack:verify

# Stop
./dev.sh stack:down
```

Open **http://localhost:8080** (Caddy serves on port 8080).

`stack:verify` is the recommended basic container validation path after container-related changes. It starts from a clean Podman volume state, rebuilds the stack, checks compose status, verifies HTTP reachability, runs the in-container migration and seed paths, restarts the stack without rebuilding, verifies HTTP reachability again, and tears the stack down when finished.

---

## Database Commands

| Command | What it does |
|---------|-------------|
| `pnpm db:migrate` | Apply all pending SQL migrations |
| `pnpm db:migrate:down` | Roll back the last migration |
| `pnpm db:seed` | Insert seed data (idempotent — safe to run multiple times) |
| `pnpm db:reset` | **Destructive** — drops all tables, re-migrates, re-seeds |
| `./scripts/dev-db.sh start` | Start local Podman DB container |
| `./scripts/dev-db.sh stop` | Stop local Podman DB container |
| `./scripts/dev-db.sh reset` | Stop container, wipe volume, restart (fresh DB) |

---

## Running Tests

| Command | What it runs | Needs DB? |
|---------|-------------|-----------|
| `pnpm test:unit` | Shared schemas, SDK, API unit tests | No |
| `pnpm test:web` | React component tests (vitest + jsdom) | No |
| `pnpm test:integration` | API integration tests against test DB | Yes |
| `pnpm test:e2e` | Playwright end-to-end browser tests via `./dev.sh test:e2e` | Yes |
| `pnpm test:full` | Full local suite via `./dev.sh test:full` | Yes |
| `pnpm typecheck` | TypeScript type check (all packages) | No |
| `pnpm lint` | ESLint (all packages) | No |

Prefer `./dev.sh test:int`, `./dev.sh test:e2e`, and `./dev.sh test:full` for local/server runs because they own DB-backed test setup directly. `test:int` and `test:e2e` create isolated Postgres test containers, and `test:full` reuses one prepared isolated test DB across its DB-backed steps before cleaning it up.
They now also prebuild the internal workspace packages that intentionally export built artifacts for runtime/container use, so clean local runs and clean CI checkouts resolve internal package imports deterministically.
For stack validation, the Podman stack Postgres service now binds to host port `55434` so it can coexist with the local dev/test DB on `5432`.

`pnpm prebuild:internal` is the canonical narrow preflight for this. It builds only:
- `@kids-games/shared`
- `@kids-games/game-sdk`
- `@kids-games/flashcards-backend-adapter`

See [USAGE.md → Running Tests](project_docs/RnD_docs/USAGE.md#running-tests) for details.

---

## Building for Production

```bash
# Build all packages
pnpm build

# Build container images
podman build -f infra/podman/Dockerfile.api -t kids-games-api .
podman build -f infra/podman/Dockerfile.web -t kids-games-web .
```

---

## Environment Variables

**File:** `server/.env` (copy from `server/.env.example`)

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kids_games_dev
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kids_games_test

JWT_SECRET=change-me-in-production-jwt-secret-min-32-chars
REFRESH_SECRET=change-me-in-production-refresh-secret-min-32-chars

# Closed-game allowlist / seeded integration client
ALLOWED_GAME_IDS=flashcards
FLASHCARDS_CLIENT_SECRET=flashcards-dev-secret

# Valkey / Redis (optional — in-memory fallback used if absent)
# VALKEY_URL=redis://localhost:6379
```

Notes:
- `ALLOWED_GAME_IDS` controls which enabled games can be returned by `/games` and used in protected game flows.
- `FLASHCARDS_CLIENT_SECRET` sets the seeded secret for the default `flashcards-web-dev` integration client used by `POST /auth/game-session`.
- Change the JWT secrets and integration client secret for anything beyond localhost.

---

## Ports & URLs Reference

| Service | URL | Notes |
|---------|-----|-------|
| Web (dev) | http://localhost:5173 | Vite dev server |
| API (dev) | http://localhost:3000 | Fastify direct |
| API health | http://localhost:3000/health | Returns `{ status: "ok", db: "ok" }` |
| PostgreSQL | localhost:5432 | `kids_games_dev` database |
| Caddy proxy (containers) | http://localhost:8080 | Routes `/api/*` to API, rest to web |

**Quick curl tests:**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/games
curl http://localhost:3000/flashcards/decks
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED localhost:3000` | API not running | `./dev.sh server` |
| `ECONNREFUSED localhost:5432` | DB not running | `./scripts/dev-db.sh start` |
| `relation already exists` on migrate | Already applied | Safe to ignore, or `pnpm db:reset` |
| `Cannot find module` in web tests | Shared packages not built | `pnpm --filter @kids-games/shared build` |
| 502 Bad Gateway from Caddy | API container not healthy | `./dev.sh stack:logs api` |
| `pnpm install` fails | Cache corruption | `pnpm store prune && rm -rf node_modules **/node_modules && pnpm install` |

For full troubleshooting scenarios and playbooks, see [USAGE.md](project_docs/RnD_docs/USAGE.md).
