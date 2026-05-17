#!/usr/bin/env bash
# health-check.sh — post-deploy verification suite
# Exits 0 only if all checks pass. Used by deploy.sh.

set -euo pipefail

API="${API_URL:-http://localhost:3001}"
FRONTEND="${FRONTEND_URL:-http://localhost}"
PASS=0
FAIL=0

check() {
  local name="$1" url="$2" expected_status="${3:-200}"
  local status
  status=$(curl -sf -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "000")
  if [ "${status}" = "${expected_status}" ]; then
    echo "  ✓ ${name} (${status})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${name} — expected ${expected_status}, got ${status}"
    FAIL=$((FAIL + 1))
  fi
}

echo "[health-check] Running post-deploy checks..."

# ── API checks ────────────────────────────────────────────────────────────────
check "API liveness"        "${API}/health"
check "API readiness"       "${API}/health/ready"
check "API 404 handling"    "${API}/nonexistent-route-xyz" "404"

# ── Frontend check ────────────────────────────────────────────────────────────
check "Frontend index"      "${FRONTEND}/" "200"

echo ""
echo "[health-check] Results: ${PASS} passed, ${FAIL} failed"

if [ "${FAIL}" -gt 0 ]; then
  echo "[health-check] FAIL"
  exit 1
fi

echo "[health-check] PASS"
