#!/usr/bin/env bash
# deploy.sh — zero-downtime production deployment with automatic rollback on failure
# Usage: ./scripts/deploy.sh [--skip-backup] [--skip-tests]
# Requires: docker, docker compose, jq

set -euo pipefail

SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3001/health}"
HEALTH_TIMEOUT=120
LOG_FILE="/tmp/tracker-deploy-$(date +%Y%m%d_%H%M%S).log"

for arg in "$@"; do
  case $arg in
    --skip-backup) SKIP_BACKUP=true ;;
    --skip-tests)  SKIP_TESTS=true ;;
  esac
done

log() { echo "[deploy] $(date +%H:%M:%S) $*" | tee -a "${LOG_FILE}"; }
err() { echo "[deploy] ERROR: $*" | tee -a "${LOG_FILE}" >&2; }

log "=== Tracker Production Deploy ==="
log "Compose: ${COMPOSE_FILE}"
log "Log: ${LOG_FILE}"

# ── Pre-deploy backup ─────────────────────────────────────────────────────────
if [ "${SKIP_BACKUP}" != "true" ]; then
  log "Running pre-deploy backup..."
  bash "$(dirname "$0")/backup.sh" || { err "Backup failed — aborting deploy"; exit 1; }
  log "Backup complete."
fi

# ── Record current image digests for rollback ─────────────────────────────────
PREV_BACKEND=$(docker inspect --format='{{.Image}}' tracker-backend-1 2>/dev/null || echo "")
PREV_FRONTEND=$(docker inspect --format='{{.Image}}' tracker-frontend-1 2>/dev/null || echo "")
log "Previous backend:  ${PREV_BACKEND:-none}"
log "Previous frontend: ${PREV_FRONTEND:-none}"

# ── Pull / build new images ───────────────────────────────────────────────────
log "Building new images..."
docker compose -f "${COMPOSE_FILE}" build --pull 2>&1 | tee -a "${LOG_FILE}"

# ── Database migration (run before switching traffic) ────────────────────────
log "Running database migrations..."
docker compose -f "${COMPOSE_FILE}" run --rm backend sh -c "npx prisma migrate deploy" 2>&1 | tee -a "${LOG_FILE}" || {
  err "Migration failed — rolling back"
  bash "$(dirname "$0")/rollback.sh" "${PREV_BACKEND}" "${PREV_FRONTEND}"
  exit 1
}

# ── Rolling restart — backend first, then frontend ───────────────────────────
log "Restarting backend..."
docker compose -f "${COMPOSE_FILE}" up -d --no-deps backend 2>&1 | tee -a "${LOG_FILE}"

log "Waiting for health check (${HEALTH_TIMEOUT}s)..."
ELAPSED=0
until curl -sf "${HEALTH_URL}" &>/dev/null; do
  if [ "${ELAPSED}" -ge "${HEALTH_TIMEOUT}" ]; then
    err "Health check timed out after ${HEALTH_TIMEOUT}s — rolling back"
    bash "$(dirname "$0")/rollback.sh" "${PREV_BACKEND}" "${PREV_FRONTEND}"
    exit 1
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done
log "Backend healthy (${ELAPSED}s)."

log "Restarting frontend..."
docker compose -f "${COMPOSE_FILE}" up -d --no-deps frontend 2>&1 | tee -a "${LOG_FILE}"

# ── Post-deploy health check ─────────────────────────────────────────────────
log "Post-deploy health check..."
bash "$(dirname "$0")/health-check.sh" || {
  err "Post-deploy checks failed — rolling back"
  bash "$(dirname "$0")/rollback.sh" "${PREV_BACKEND}" "${PREV_FRONTEND}"
  exit 1
}

log "=== Deploy complete ==="
log "Log saved to ${LOG_FILE}"
