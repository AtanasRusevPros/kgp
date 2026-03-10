#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d games ]]; then
  echo "Missing games/ directory" >&2
  exit 1
fi

FAIL=0

for game_dir in games/*; do
  [[ -d "$game_dir" ]] || continue
  game_id="$(basename "$game_dir")"

  for required in contracts web mobile backend-adapter; do
    if [[ ! -d "$game_dir/$required" ]]; then
      echo "Game module '$game_id' is missing required directory: $required" >&2
      FAIL=1
    fi
  done

done

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi

echo "Game module structure checks passed."
