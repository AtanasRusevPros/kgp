#!/usr/bin/env bash
# Starts a local Postgres 16 container for development and testing.
# Usage: ./scripts/dev-db.sh [start|stop|reset]
set -euo pipefail

CONTAINER_NAME="kids-games-postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_USER="postgres"
HOST_PORT="5432"

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
      if podman exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" &>/dev/null; then
        break
      fi
      tries=$((tries - 1))
      sleep 1
    done

    echo "→ Creating databases..."
    podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -tc \
      "SELECT 1 FROM pg_database WHERE datname='kids_games_dev'" | grep -q 1 || \
      podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE kids_games_dev;"

    podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -tc \
      "SELECT 1 FROM pg_database WHERE datname='kids_games_test'" | grep -q 1 || \
      podman exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE kids_games_test;"

    echo "✓ Postgres ready on port ${HOST_PORT}"
    echo "  DATABASE_URL=postgresql://postgres:postgres@localhost:${HOST_PORT}/kids_games_dev"
    echo "  TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:${HOST_PORT}/kids_games_test"
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
