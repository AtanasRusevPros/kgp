#!/usr/bin/env bash
# Root-level developer convenience script for Kids Games Platform.
# Run from the repo root: ./dev.sh <target>

set -euo pipefail

PROJ="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="infra/podman/compose.yml"
TEST_DB_CONTAINER_NAME=""
TEST_DB_HOST_PORT=""
TEST_DB_CONTAINER_CREATED="0"

# ── helpers ──────────────────────────────────────────────────────────────────

ok()   { echo "✓ $*"; }
info() { echo "→ $*"; }
die()  { echo "✗ $*" >&2; exit 1; }

ensure_internal_package_artifacts() {
  if [[ "${KG_INTERNAL_PACKAGES_READY:-}" == "1" ]]; then
    return 0
  fi

  info "Building internal workspace package artifacts required by clean verification..."
  (cd "$PROJ" && pnpm prebuild:internal)
  export KG_INTERNAL_PACKAGES_READY=1
}

require_env() {
  [[ -f "$PROJ/server/.env" ]] || die "server/.env not found. Run: ./dev.sh init"
}

port_in_use() {
  local port="$1"
  ss -tlnH 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)$port$"
}

stack_container_exists() {
  local name="$1"
  podman container exists "$name" 2>/dev/null
}

find_rootlessport_pid_for_port() {
  local port="$1"
  ss -ltnp 2>/dev/null | awk -v port=":$port" '
    index($4, port) {
      if (match($0, /pid=[0-9]+/)) {
        value = substr($0, RSTART + 4, RLENGTH - 4)
        print value
      }
    }
  ' | head -n1
}

kill_stale_stack_port_helper() {
  local port="$1"
  local owner_container="$2"
  local pid=""
  local command=""

  if stack_container_exists "$owner_container"; then
    return 0
  fi

  pid="$(find_rootlessport_pid_for_port "$port")"
  if [[ -z "$pid" ]]; then
    return 0
  fi

  command="$(ps -p "$pid" -o comm= 2>/dev/null | tr -d '[:space:]')"
  if [[ "$command" != "rootlessport" ]]; then
    return 0
  fi

  info "Cleaning stale rootlessport helper on port ${port} (PID ${pid})..."
  kill "$pid" 2>/dev/null || true
  sleep 1

  if port_in_use "$port"; then
    kill -9 "$pid" 2>/dev/null || true
    sleep 1
  fi
}

cleanup_stale_stack_port_helpers() {
  kill_stale_stack_port_helper 55434 kids-games-db
  kill_stale_stack_port_helper 8080 kids-games-caddy
  kill_stale_stack_port_helper 8443 kids-games-caddy
}

force_remove_stack_containers() {
  local stack_names=(
    kids-games-caddy
    kids-games-web
    kids-games-api
    kids-games-db
  )
  local name

  for name in "${stack_names[@]}"; do
    podman stop "$name" >/dev/null 2>&1 || true
  done

  for name in "${stack_names[@]}"; do
    podman rm -f "$name" >/dev/null 2>&1 || true
  done
}

pick_test_db_port() {
  local port
  for port in $(seq 55432 55462); do
    if ! port_in_use "$port"; then
      echo "$port"
      return 0
    fi
  done

  die "Could not find a free port for an isolated test Postgres container."
}

cleanup_owned_test_db() {
  if [[ "${TEST_DB_CONTAINER_CREATED}" != "1" ]]; then
    return 0
  fi

  if [[ "${KG_KEEP_TEST_DB:-0}" == "1" ]]; then
    info "Keeping managed test DB container '${TEST_DB_CONTAINER_NAME}' because KG_KEEP_TEST_DB=1."
    return 0
  fi

  if [[ -n "${TEST_DB_CONTAINER_NAME}" ]]; then
    info "Cleaning up managed test DB container '${TEST_DB_CONTAINER_NAME}'..."
    (
      cd "$PROJ" && \
      KG_DB_CONTAINER_NAME="$TEST_DB_CONTAINER_NAME" \
      KG_DB_HOST_PORT="$TEST_DB_HOST_PORT" \
      ./scripts/dev-db.sh reset
    ) >/dev/null 2>&1 || true
  fi
}

ensure_owned_test_db_session() {
  if [[ "${KG_TEST_DB_SESSION_ACTIVE:-0}" == "1" ]] && [[ -n "${TEST_DATABASE_URL:-}" ]]; then
    return 0
  fi

  command -v podman >/dev/null 2>&1 || die "podman is required for self-owned DB-backed test runs."

  local container_name="kids-games-test-postgres-$$"
  local host_port
  host_port="$(pick_test_db_port)"

  info "Starting isolated test DB container '${container_name}' on port ${host_port}..."
  (
    cd "$PROJ" && \
    KG_DB_CONTAINER_NAME="$container_name" \
    KG_DB_HOST_PORT="$host_port" \
    ./scripts/dev-db.sh start
  )

  TEST_DB_CONTAINER_NAME="$container_name"
  TEST_DB_HOST_PORT="$host_port"
  TEST_DB_CONTAINER_CREATED="1"
  export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:${host_port}/kids_games_test"
  export KG_TEST_DB_SESSION_ACTIVE="1"
  trap cleanup_owned_test_db EXIT
}

get_test_database_url() {
  local test_db_url="${TEST_DATABASE_URL:-}"
  if [[ -n "$test_db_url" ]]; then
    echo "$test_db_url"
    return 0
  fi

  local env_file="$PROJ/server/.env"
  if [[ -f "$env_file" ]]; then
    test_db_url="$(grep -E '^TEST_DATABASE_URL=' "$env_file" | tail -n1 | cut -d '=' -f2- || true)"
  fi

  test_db_url="${test_db_url%\"}"
  test_db_url="${test_db_url#\"}"
  test_db_url="${test_db_url%\'}"
  test_db_url="${test_db_url#\'}"

  if [[ -z "$test_db_url" ]]; then
    die "TEST_DATABASE_URL is missing. Add it to server/.env"
  fi

  echo "$test_db_url"
}

prepare_test_db() {
  if [[ "${KG_TEST_DB_PREPARED:-0}" == "1" ]]; then
    return 0
  fi

  local test_db_url
  test_db_url="$(get_test_database_url)"

  info "Applying migrations to test database..."
  if ! (cd "$PROJ/server" && DATABASE_URL="$test_db_url" pnpm db:migrate); then
    die "Could not apply test DB migrations.
Managed test DB URL: ${test_db_url}
Retry: ./dev.sh test:int"
  fi

  info "Seeding test database..."
  if ! (cd "$PROJ/server" && DATABASE_URL="$test_db_url" pnpm db:seed); then
    die "Could not seed test DB.
Managed test DB URL: ${test_db_url}
Retry: ./dev.sh test:int"
  fi

  export KG_TEST_DB_PREPARED="1"
}

wait_for_http_ok() {
  local url="$1"
  local seconds="${2:-30}"
  while (( seconds > 0 )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    seconds=$((seconds - 1))
    sleep 1
  done
  return 1
}

wait_for_stack_db_ready() {
  local attempts="${1:-30}"
  while (( attempts > 0 )); do
    if podman exec kids-games-db pg_isready -U postgres >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 2
  done
  return 1
}

start_local_api_for_e2e() {
  local test_db_url="$1"
  local api_log="$2"
  local api_port="$3"
  STARTED_API_PID=""

  # Reuse an already running compatible API.
  if curl -fsS "http://localhost:${api_port}/health" >/dev/null 2>&1; then
    info "Detected API already running on http://localhost:${api_port} — reusing it."
    return 0
  fi

  info "Starting API for e2e on http://localhost:${api_port}..."
  (
    cd "$PROJ/server" && \
    PORT="$api_port" NODE_ENV=test DATABASE_URL="$test_db_url" \
      pnpm exec tsx --env-file=.env src/index.ts
  ) >"$api_log" 2>&1 &
  STARTED_API_PID="$!"

  if wait_for_http_ok "http://localhost:${api_port}/health" 30; then
    return 0
  fi

  # If process died or never became healthy, fail with actionable guidance.
  if kill -0 "$STARTED_API_PID" 2>/dev/null; then
    kill "$STARTED_API_PID" 2>/dev/null || true
  fi

  echo "----- API startup log (tail) -----" >&2
  tail -n 40 "$api_log" >&2 || true
  echo "----------------------------------" >&2
  die "Could not start API for e2e on port ${api_port}.
If another service is on that port, stop it first.
Then run:
  ./dev.sh db:start
  ./dev.sh test:e2e"
}

compose() {
  (cd "$PROJ" && podman-compose -f "$COMPOSE_FILE" "$@")
}

compose_api_job() {
  local command=("$@")
  compose run --rm api "${command[@]}"
}

stop_dev_db_if_running() {
  local running
  running="$(podman inspect --format '{{.State.Running}}' kids-games-postgres 2>/dev/null || true)"
  if [[ "$running" == "true" ]]; then
    info "Stopping local dev DB container to free port 5432 for stack DB..."
    podman stop kids-games-postgres >/dev/null
    ok "Stopped kids-games-postgres"
  fi
}

# ── targets ──────────────────────────────────────────────────────────────────

cmd_init() {
  info "Installing dependencies..."
  (cd "$PROJ" && pnpm install)

  info "Preparing server/.env (skipped if it already exists)..."
  if [[ -f "$PROJ/server/.env" ]]; then
    ok "server/.env already exists, skipping"
  else
    cp "$PROJ/server/.env.example" "$PROJ/server/.env"
    ok ".env created — review server/.env and adjust secrets if needed"
  fi

  info "Starting database container..."
  (cd "$PROJ" && ./scripts/dev-db.sh start)

  info "Running migrations..."
  (cd "$PROJ" && pnpm db:migrate)

  info "Seeding database..."
  (cd "$PROJ" && pnpm db:seed)

  ok "Init complete. Start developing:"
  echo "  ./dev.sh server   — API on http://localhost:3000"
  echo "  ./dev.sh web      — Web on http://localhost:5173"
}

cmd_build() {
  info "Building all packages..."
  (cd "$PROJ" && pnpm build)
  ok "Build complete."
}

cmd_server() {
  require_env
  info "Starting API dev server (http://localhost:3000)..."
  (cd "$PROJ" && pnpm --filter @kids-games/api dev)
}

cmd_web() {
  info "Starting web dev client (http://localhost:5173)..."
  (cd "$PROJ" && pnpm --filter @kids-games/web dev)
}

# ── tests ─────────────────────────────────────────────────────────────────────

cmd_test_unit() {
  ensure_internal_package_artifacts
  info "Running unit tests..."
  (cd "$PROJ" && pnpm test:unit)
}

cmd_test_web() {
  ensure_internal_package_artifacts
  info "Running web component tests..."
  (cd "$PROJ" && pnpm test:web)
}

cmd_test_integration() {
  require_env
  ensure_internal_package_artifacts
  ensure_owned_test_db_session
  prepare_test_db
  info "Running integration tests (requires DB)..."
  (cd "$PROJ" && pnpm test:integration)
}

cmd_test_e2e() {
  require_env
  ensure_internal_package_artifacts
  local test_db_url api_pid api_log api_port api_url
  ensure_owned_test_db_session
  test_db_url="$(get_test_database_url)"
  api_log="$(mktemp /tmp/kg-api-e2e.XXXX.log)"
  api_pid=""
  api_port="${E2E_API_PORT:-3300}"
  api_url="http://localhost:${api_port}"

  prepare_test_db
  start_local_api_for_e2e "$test_db_url" "$api_log" "$api_port"
  api_pid="$STARTED_API_PID"

  info "Running Playwright e2e tests (API: ${api_url}, web dev server auto-starts)..."
  set +e
  (cd "$PROJ" && E2E_API_URL="$api_url" VITE_API_PROXY_TARGET="$api_url" pnpm test:e2e:direct)
  local status=$?
  set -e

  if [[ -n "$api_pid" ]]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi

  rm -f "$api_log" 2>/dev/null || true
  if [[ $status -ne 0 ]]; then
    die "E2E tests failed. Re-run with: ./dev.sh test:e2e"
  fi
}

cmd_test_e2e_stack() {
  info "Running Playwright e2e tests against container stack (http://localhost:8080)..."
  (cd "$PROJ" && pnpm test:e2e:stack)
}

cmd_test_full() {
  require_env
  ensure_internal_package_artifacts
  info "Running full test suite..."
  cmd_check
  cmd_test_unit
  ensure_owned_test_db_session
  prepare_test_db
  cmd_test_integration
  cmd_test_web
  cmd_test_e2e
  ok "Full test suite passed."
}

# ── quality ───────────────────────────────────────────────────────────────────

cmd_lint() {
  info "Running ESLint..."
  (cd "$PROJ" && pnpm lint)
  ok "Lint passed."
}

cmd_typecheck() {
  ensure_internal_package_artifacts
  info "Running TypeScript type check..."
  (cd "$PROJ" && pnpm typecheck)
  ok "Typecheck passed."
}

cmd_check() {
  ensure_internal_package_artifacts
  info "Running lint + typecheck..."
  (cd "$PROJ" && pnpm lint && pnpm typecheck)
  ok "All checks passed."
}

# ── database (local dev container) ───────────────────────────────────────────

cmd_db_start() {
  info "Starting database container..."
  (cd "$PROJ" && ./scripts/dev-db.sh start)
}

cmd_db_stop() {
  info "Stopping database container..."
  (cd "$PROJ" && ./scripts/dev-db.sh stop)
}

cmd_db_reset_container() {
  info "Resetting database container (wipes volume)..."
  (cd "$PROJ" && ./scripts/dev-db.sh reset)
}

cmd_db_migrate() {
  require_env
  info "Running migrations..."
  (cd "$PROJ" && pnpm db:migrate)
  ok "Migrations applied."
}

cmd_db_migrate_down() {
  require_env
  info "Rolling back last migration..."
  (cd "$PROJ" && pnpm db:migrate:down)
  ok "Last migration rolled back."
}

cmd_db_seed() {
  require_env
  info "Seeding database..."
  (cd "$PROJ" && pnpm db:seed)
  ok "Seed complete."
}

cmd_db_wipe() {
  require_env
  info "Wiping and rebuilding dev DB (drop + migrate + seed)..."
  (cd "$PROJ" && pnpm db:reset)
  ok "DB reset complete."
}

# ── container stack (Podman) ──────────────────────────────────────────────────

cmd_stack_init() {
  require_env
  info "First-time container stack setup: compose rebuild -> db up -> migrate -> seed -> full stack up -> wait..."

  cleanup_stale_stack_port_helpers

  info "Starting stack database first..."
  stop_dev_db_if_running
  compose up -d --build db

  info "Waiting for stack database to accept connections..."
  wait_for_stack_db_ready || die "Stack Postgres did not become ready in time."

  info "Applying database migrations through a one-off API job..."
  compose_api_job node server/dist/db/migrate.js

  info "Seeding database through a one-off API job..."
  compose_api_job node server/dist/db/seed.js

  info "Starting remaining stack services..."
  compose up -d api web caddy

  info "Waiting for stack to become healthy..."
  (cd "$PROJ" && ./infra/podman/smoke-test.sh)

  ok "Stack init complete. Open http://localhost:8080"
}

cmd_stack_build() {
  info "Building compose-managed container images (api + web)..."
  compose build
  ok "Compose-managed images built."
}

cmd_stack_up() {
  require_env
  info "Starting full Podman stack..."
  stop_dev_db_if_running
  compose up -d
  ok "Stack up. Open http://localhost:8080"
}

cmd_stack_rebuild() {
  require_env
  info "Rebuilding images and restarting stack..."
  cleanup_stale_stack_port_helpers
  stop_dev_db_if_running
  compose up -d --build
  ok "Stack rebuilt and running. Open http://localhost:8080"
}

cmd_stack_restart() {
  require_env
  info "Restarting stack (down + up, no rebuild)..."
  stop_dev_db_if_running
  compose down
  force_remove_stack_containers
  cleanup_stale_stack_port_helpers
  compose up -d
  ok "Stack restarted. Open http://localhost:8080"
}

cmd_stack_down() {
  info "Stopping Podman stack..."
  compose down
  force_remove_stack_containers
  cleanup_stale_stack_port_helpers
  ok "Stack down."
}

cmd_stack_logs() {
  local svc="${2:-}"
  if [[ -n "$svc" ]]; then
    compose logs -f "$svc"
  else
    compose logs -f
  fi
}

cmd_stack_seed() {
  info "Seeding database through a one-off API job..."
  compose_api_job node server/dist/db/seed.js
  ok "Seed complete."
}

cmd_stack_migrate() {
  info "Applying database migrations through a one-off API job..."
  compose_api_job node server/dist/db/migrate.js
  ok "Migrations complete."
}

cmd_stack_smoke() {
  info "Running smoke test against stack (http://localhost:8080)..."
  (cd "$PROJ" && ./infra/podman/smoke-test.sh)
}

cmd_stack_verify() {
  require_env
  info "Running container basic-actions verification (rebuild -> ps -> smoke -> migrate -> seed -> restart -> smoke -> teardown)..."
  stop_dev_db_if_running
  (cd "$PROJ" && ./infra/podman/basic-actions-test.sh)
}

cmd_stack_ps() {
  podman ps --filter "name=kids-games" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# ── backup / restore ──────────────────────────────────────────────────────────

cmd_backup() {
  require_env
  info "Creating database backup..."
  (cd "$PROJ" && pnpm stack:backup)
}

cmd_restore() {
  local file="${2:-}"
  [[ -z "$file" ]] && die "Usage: ./dev.sh restore <backup-file>"
  require_env
  info "Restoring from $file..."
  (cd "$PROJ" && pnpm stack:restore "$file")
}

# ── misc ──────────────────────────────────────────────────────────────────────

cmd_status() {
  echo "=== Stack containers ==="
  podman ps --filter "name=kids-games" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
    || echo "(podman not available)"
  echo
  echo "=== Dev DB container ==="
  podman ps --filter "name=kids-games-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
    || true
  echo
  echo "=== .env file ==="
  if [[ -f "$PROJ/server/.env" ]]; then
    ok "server/.env exists"
  else
    echo "✗ server/.env MISSING — run ./dev.sh init"
  fi
}

cmd_help() {
  cat <<'EOF'
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

EOF
}

# ── dispatch ─────────────────────────────────────────────────────────────────

target="${1:-help}"

case "$target" in
  init)                  cmd_init ;;
  build)                 cmd_build ;;
  server)                cmd_server ;;
  web)                   cmd_web ;;
  test:unit)             cmd_test_unit ;;
  test:web)              cmd_test_web ;;
  test:int|test:integration) cmd_test_integration ;;
  test:e2e)              cmd_test_e2e ;;
  test:e2e:stack)        cmd_test_e2e_stack ;;
  test:full|test:all)    cmd_test_full ;;
  lint)                  cmd_lint ;;
  typecheck)             cmd_typecheck ;;
  check)                 cmd_check ;;
  db:start)              cmd_db_start ;;
  db:stop)               cmd_db_stop ;;
  db:container:reset)    cmd_db_reset_container ;;
  db:migrate)            cmd_db_migrate ;;
  db:migrate:down)       cmd_db_migrate_down ;;
  db:seed)               cmd_db_seed ;;
  db:wipe)               cmd_db_wipe ;;
  stack:init)            cmd_stack_init ;;
  stack:build)           cmd_stack_build ;;
  stack:up)              cmd_stack_up ;;
  stack:rebuild)         cmd_stack_rebuild ;;
  stack:restart)         cmd_stack_restart ;;
  stack:down)            cmd_stack_down ;;
  stack:migrate)         cmd_stack_migrate ;;
  stack:seed)            cmd_stack_seed ;;
  stack:logs)            cmd_stack_logs "$@" ;;
  stack:smoke)           cmd_stack_smoke ;;
  stack:verify)          cmd_stack_verify ;;
  stack:ps)              cmd_stack_ps ;;
  backup)                cmd_backup ;;
  restore)               cmd_restore "$@" ;;
  status)                cmd_status ;;
  help|--help|-h)        cmd_help ;;
  *) die "Unknown target: '$target'. Run ./dev.sh help for usage." ;;
esac
