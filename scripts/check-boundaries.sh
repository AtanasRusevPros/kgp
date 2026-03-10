#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAIL=0

check_no_match() {
  local description="$1"
  local target_glob="$2"
  shift 2

  if rg -n --glob "$target_glob" "$@" apps packages >/tmp/boundary-check.out 2>/dev/null; then
    echo "Boundary violation: ${description}" >&2
    cat /tmp/boundary-check.out >&2
    FAIL=1
  fi
}

# API must not import web/mobile internals.
check_no_match "apps/api importing apps/web or apps/mobile internals" "apps/api/src/**/*.{ts,tsx,js,jsx}" "apps/(web|mobile)/"
check_no_match "apps/api importing @kids-games/web package" "apps/api/src/**/*.{ts,tsx,js,jsx}" "@kids-games/web"

# Web/mobile must not import API internals.
check_no_match "apps/web importing apps/api internals" "apps/web/src/**/*.{ts,tsx,js,jsx}" "apps/api/"
check_no_match "apps/web importing @kids-games/api package" "apps/web/src/**/*.{ts,tsx,js,jsx}" "@kids-games/api"
check_no_match "apps/mobile importing apps/api internals" "apps/mobile/**/*.{ts,tsx,js,jsx}" "apps/api/"
check_no_match "apps/mobile importing @kids-games/api package" "apps/mobile/**/*.{ts,tsx,js,jsx}" "@kids-games/api"

# Shared packages must stay app-agnostic.
check_no_match "packages importing app internals" "packages/**/*.{ts,tsx,js,jsx}" "apps/(api|web|mobile)/"

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi

echo "Boundary checks passed."
