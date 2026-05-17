#!/usr/bin/env bash
# restore.sh — restore PostgreSQL + uploads from a backup directory
# Usage: ./scripts/restore.sh <backup-dir>
# Example: ./scripts/restore.sh ./backups/20260517_120000
# WARNING: This will DROP and recreate the target database. Run only on an empty/test DB
#          or with explicit --confirm flag.

set -euo pipefail

BACKUP_DIR="${1:?Usage: restore.sh <backup-dir>}"
CONFIRM="${2:-}"

if [ ! -d "${BACKUP_DIR}" ]; then
  echo "ERROR: Backup directory not found: ${BACKUP_DIR}" >&2
  exit 1
fi

# Load .env if present
if [ -f "$(pwd)/.env" ]; then
  set -a; source "$(pwd)/.env"; set +a
fi

DB_URL="${DATABASE_URL:?DATABASE_URL is not set}"
UPLOADS_DIR="${UPLOADS_DIR:-$(pwd)/backend/uploads}"

# Safety gate
if [ "${CONFIRM}" != "--confirm" ]; then
  echo "⚠️  WARNING: This will overwrite the database at:"
  echo "   ${DB_URL}"
  echo ""
  echo "To proceed, run:"
  echo "   ./scripts/restore.sh ${BACKUP_DIR} --confirm"
  exit 0
fi

# ── Restore DB ────────────────────────────────────────────────────────────────
DB_FILE=$(find "${BACKUP_DIR}" -name "db_*.sql.gz" | head -1)
if [ -z "${DB_FILE}" ]; then
  echo "ERROR: No DB dump found in ${BACKUP_DIR}" >&2
  exit 1
fi

echo "[restore] Restoring database from ${DB_FILE}..."

if command -v psql &>/dev/null; then
  gunzip -c "${DB_FILE}" | psql "${DB_URL}"
else
  CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
  if [ -n "${CONTAINER}" ]; then
    gunzip -c "${DB_FILE}" | docker exec -i "${CONTAINER}" psql "${DB_URL}"
  else
    echo "ERROR: psql not found and no postgres container running" >&2
    exit 1
  fi
fi

echo "[restore] Database restored."

# ── Restore uploads ───────────────────────────────────────────────────────────
UPLOADS_FILE=$(find "${BACKUP_DIR}" -name "uploads_*.tar.gz" | head -1)
if [ -n "${UPLOADS_FILE}" ]; then
  echo "[restore] Restoring uploads from ${UPLOADS_FILE}..."
  UPLOADS_PARENT="$(dirname "${UPLOADS_DIR}")"
  tar -xzf "${UPLOADS_FILE}" -C "${UPLOADS_PARENT}"
  echo "[restore] Uploads restored to ${UPLOADS_DIR}"
fi

echo "[restore] Restore complete from ${BACKUP_DIR}"
