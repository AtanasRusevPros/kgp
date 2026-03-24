#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAIL=0

check_no_match() {
  local description="$1"
  local target_glob="$2"
  shift 2

  if rg -n --glob "$target_glob" "$@" apps packages games frontend server >/tmp/boundary-check.out 2>/dev/null; then
    echo "Boundary violation: ${description}" >&2
    cat /tmp/boundary-check.out >&2
    FAIL=1
  fi
}

# Server must not import frontend/mobile internals.
check_no_match "server importing frontend/web or apps/mobile internals" "server/src/**/*.{ts,tsx,js,jsx}" "frontend/|apps/(web|mobile)/"
check_no_match "server importing @kids-games/web package" "server/src/**/*.{ts,tsx,js,jsx}" "@kids-games/web"

# Web/mobile must not import backend internals.
check_no_match "frontend/web importing server internals" "frontend/web/src/**/*.{ts,tsx,js,jsx}" "apps/api/|server/"
check_no_match "frontend/web importing @kids-games/api package" "frontend/web/src/**/*.{ts,tsx,js,jsx}" "@kids-games/api"
check_no_match "apps/mobile importing backend internals" "apps/mobile/**/*.{ts,tsx,js,jsx}" "apps/api/|server/"
check_no_match "apps/mobile importing @kids-games/api package" "apps/mobile/**/*.{ts,tsx,js,jsx}" "@kids-games/api"

# Target topology boundaries.
check_no_match "frontend importing backend internals" "frontend/**/*.{ts,tsx,js,jsx}" "apps/api/|server/"
check_no_match "server importing frontend internals" "server/**/*.{ts,tsx,js,jsx}" "apps/web/|apps/mobile/|frontend/"
check_no_match "game web/mobile/contracts importing backend internals" "games/*/{web,mobile,contracts}/**/*.{ts,tsx,js,jsx}" "apps/api/|server/"
check_no_match "game backend adapters importing frontend internals" "games/*/backend-adapter/**/*.{ts,tsx,js,jsx}" "apps/web/|apps/mobile/|frontend/"

# Shared packages must stay app-agnostic.
check_no_match "packages importing app internals" "packages/**/*.{ts,tsx,js,jsx}" "apps/(api|web|mobile)/"
check_no_match "packages importing target topology internals" "packages/**/*.{ts,tsx,js,jsx}" "from ['\"][^'\"]*(frontend/|server/|games/)|import\\(['\"][^'\"]*(frontend/|server/|games/)"

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi

echo "Boundary checks passed."
