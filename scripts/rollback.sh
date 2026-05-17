#!/usr/bin/env bash
# rollback.sh — revert backend and frontend to previous Docker image digests
# Usage: ./scripts/rollback.sh [prev-backend-digest] [prev-frontend-digest]
# Called automatically by deploy.sh on failure.

set -euo pipefail

PREV_BACKEND="${1:-}"
PREV_FRONTEND="${2:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3001/health}"

log() { echo "[rollback] $(date +%H:%M:%S) $*"; }
err() { echo "[rollback] ERROR: $*" >&2; }

log "=== Initiating rollback ==="

if [ -z "${PREV_BACKEND}" ] && [ -z "${PREV_FRONTEND}" ]; then
  err "No previous image digests provided. Cannot roll back automatically."
  err "Manual steps:"
  err "  1. docker compose -f ${COMPOSE_FILE} down"
  err "  2. git checkout HEAD~1"
  err "  3. docker compose -f ${COMPOSE_FILE} up -d --build"
  exit 1
fi

if [ -n "${PREV_BACKEND}" ]; then
  log "Reverting backend to ${PREV_BACKEND}..."
  docker tag "${PREV_BACKEND}" tracker-backend:rollback
  BACKEND_IMAGE=tracker-backend:rollback docker compose -f "${COMPOSE_FILE}" up -d --no-deps backend
fi

if [ -n "${PREV_FRONTEND}" ]; then
  log "Reverting frontend to ${PREV_FRONTEND}..."
  docker tag "${PREV_FRONTEND}" tracker-frontend:rollback
  FRONTEND_IMAGE=tracker-frontend:rollback docker compose -f "${COMPOSE_FILE}" up -d --no-deps frontend
fi

log "Waiting for health after rollback..."
ELAPSED=0
until curl -sf "${HEALTH_URL}" &>/dev/null; do
  if [ "${ELAPSED}" -ge 60 ]; then
    err "Health check failed after rollback! Manual intervention required."
    exit 1
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

log "Rollback successful. Service is healthy."
