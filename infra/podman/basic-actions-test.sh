#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/podman/compose.yml"

info() { echo "-> $*"; }
ok() { echo "OK: $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }

wait_for_db() {
  local attempts=30
  while (( attempts > 0 )); do
    if podman exec kids-games-db pg_isready -U postgres >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 2
  done
  return 1
}

cleanup() {
  info "Stopping stack..."
  podman-compose -f "$COMPOSE_FILE" down -v >/dev/null || true
}

trap cleanup EXIT

info "Tearing down any existing stack state..."
podman-compose -f "$COMPOSE_FILE" down -v >/dev/null || true

info "Rebuilding and starting stack..."
podman-compose -f "$COMPOSE_FILE" up -d --build

info "Checking compose status..."
podman-compose -f "$COMPOSE_FILE" ps

info "Waiting for stack database to accept connections..."
wait_for_db || fail "Stack database was not ready in time"

info "Applying database migrations inside the running API container..."
podman exec kids-games-api node server/dist/db/migrate.js

info "Seeding the running API container..."
podman exec kids-games-api node server/dist/db/seed.js

info "Running HTTP smoke test..."
"$ROOT_DIR/infra/podman/smoke-test.sh" "http://localhost:8080"

info "Restarting stack without rebuilding..."
podman-compose -f "$COMPOSE_FILE" down
podman-compose -f "$COMPOSE_FILE" up -d

info "Checking compose status after restart..."
podman-compose -f "$COMPOSE_FILE" ps

info "Running HTTP smoke test after restart..."
"$ROOT_DIR/infra/podman/smoke-test.sh" "http://localhost:8080"

ok "Container basic-actions verification passed."
