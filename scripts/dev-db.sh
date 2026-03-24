#!/usr/bin/env bash
# Starts a local Postgres 16 container for development and testing.
# Usage: ./scripts/dev-db.sh [start|stop|reset]
set -euo pipefail

CONTAINER_NAME="${KG_DB_CONTAINER_NAME:-kids-games-postgres}"
POSTGRES_PASSWORD="${KG_DB_POSTGRES_PASSWORD:-postgres}"
POSTGRES_USER="${KG_DB_POSTGRES_USER:-postgres}"
HOST_PORT="${KG_DB_HOST_PORT:-5432}"
DEV_DATABASE_NAME="${KG_DB_DEV_DATABASE_NAME:-kids_games_dev}"
TEST_DATABASE_NAME="${KG_DB_TEST_DATABASE_NAME:-kids_games_test}"

is_project_managed_conflict() {
  local name="$1"
  case "$name" in
    kids-games-db|podman_postgres_1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

resolve_port_conflicts() {
  local owners owner names

  owners=""
  names="$(podman ps --format '{{.Names}}' 2>/dev/null || true)"
  while IFS= read -r owner; do
    [[ -z "$owner" ]] && continue
    if podman port "$owner" 2>/dev/null | grep -Eq ":[[:space:]]*${HOST_PORT}$|:${HOST_PORT}$"; then
      owners+="${owner}"$'\n'
    fi
  done <<< "$names"

  [[ -z "$owners" ]] && return 0

  while IFS= read -r owner; do
    [[ -z "$owner" ]] && continue
    [[ "$owner" == "$CONTAINER_NAME" ]] && continue

    if is_project_managed_conflict "$owner"; then
      echo "→ Port ${HOST_PORT} is held by project container '${owner}', stopping it..."
      podman stop "$owner" >/dev/null
      echo "✓ Stopped '${owner}'"
    else
      echo "✗ Port ${HOST_PORT} is already in use by container '${owner}'."
      echo "  Refusing to stop non-project container automatically."
      echo "  Stop it manually, then retry."
      exit 1
    fi
  done <<< "$owners"

  if ss -tlnp 2>/dev/null | grep -q ":${HOST_PORT} "; then
    echo "✗ Port ${HOST_PORT} is still in use by a non-container process."
    echo "  Stop that process and retry."
    exit 1
  fi
}

cmd="${1:-start}"

case "$cmd" in
  start)
    _running=$(podman inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || true)
    if [[ "$_running" == "true" ]]; then
      echo "✓ Postgres container already running."
      exit 0
    fi

    _exists=$(podman inspect --format '{{.Id}}' "$CONTAINER_NAME" 2>/dev/null || true)
    resolve_port_conflicts

    if [[ -n "$_exists" ]]; then
      echo "→ Starting existing container..."
      podman start "$CONTAINER_NAME"
    else
      echo "→ Creating and starting Postgres container..."
      podman run -d \
        --name "$CONTAINER_NAME" \
        -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -e POSTGRES_USER="$POSTGRES_USER" \
        -p "${HOST_PORT}:5432" \
        docker.io/library/postgres:16-alpine
    fi

    echo "→ Waiting for Postgres to be ready..."
    tries=30
    while (( tries > 0 )); do
      if podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c "SELECT 1" &>/dev/null; then
        break
      fi
      tries=$((tries - 1))
      sleep 1
    done

    echo "→ Creating databases..."
    podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -tc \
      "SELECT 1 FROM pg_database WHERE datname='${DEV_DATABASE_NAME}'" | grep -q 1 || \
      podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE ${DEV_DATABASE_NAME};"

    podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -tc \
      "SELECT 1 FROM pg_database WHERE datname='${TEST_DATABASE_NAME}'" | grep -q 1 || \
      podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE ${TEST_DATABASE_NAME};"

    echo "✓ Postgres ready on port ${HOST_PORT}"
    echo "  DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${HOST_PORT}/${DEV_DATABASE_NAME}"
    echo "  TEST_DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${HOST_PORT}/${TEST_DATABASE_NAME}"
    ;;

  stop)
    podman stop "$CONTAINER_NAME" 2>/dev/null && echo "✓ Stopped" || echo "Not running"
    ;;

  reset)
    podman stop "$CONTAINER_NAME" 2>/dev/null || true
    podman rm "$CONTAINER_NAME" 2>/dev/null || true
    echo "✓ Removed. Run './scripts/dev-db.sh start' to recreate."
    ;;

  *)
    echo "Usage: $0 [start|stop|reset]"
    exit 1
    ;;
esac
