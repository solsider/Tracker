#!/usr/bin/env bash
# backup.sh — full backup: PostgreSQL dump + uploads directory
# Usage: ./scripts/backup.sh [backup-dir]
# Default backup dir: ./backups
# Requires: pg_dump (or runs via docker exec), aws cli (optional for S3 push)

set -euo pipefail

BACKUP_ROOT="${1:-$(pwd)/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

# Load .env if present (production uses env vars from systemd/docker)
if [ -f "$(pwd)/.env" ]; then
  set -a; source "$(pwd)/.env"; set +a
fi

DB_URL="${DATABASE_URL:?DATABASE_URL is not set}"
UPLOADS_DIR="${UPLOADS_DIR:-$(pwd)/backend/uploads}"

mkdir -p "${BACKUP_DIR}"

echo "[backup] Starting backup to ${BACKUP_DIR}"

# ── PostgreSQL dump ───────────────────────────────────────────────────────────
echo "[backup] Dumping PostgreSQL..."
DB_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

if command -v pg_dump &>/dev/null; then
  pg_dump "${DB_URL}" | gzip > "${DB_FILE}"
else
  # Fallback: use docker exec if postgres container is running
  CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
  if [ -n "${CONTAINER}" ]; then
    docker exec "${CONTAINER}" sh -c 'pg_dump "$DATABASE_URL"' | gzip > "${DB_FILE}"
  else
    echo "[backup] ERROR: pg_dump not found and no postgres container running" >&2
    exit 1
  fi
fi

DB_SIZE=$(du -sh "${DB_FILE}" | cut -f1)
echo "[backup] DB dump complete: ${DB_FILE} (${DB_SIZE})"

# ── Uploads directory ─────────────────────────────────────────────────────────
if [ -d "${UPLOADS_DIR}" ]; then
  echo "[backup] Archiving uploads..."
  UPLOADS_FILE="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
  tar -czf "${UPLOADS_FILE}" -C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"
  UPLOADS_SIZE=$(du -sh "${UPLOADS_FILE}" | cut -f1)
  echo "[backup] Uploads archive complete: ${UPLOADS_FILE} (${UPLOADS_SIZE})"
else
  echo "[backup] No uploads directory found at ${UPLOADS_DIR}, skipping"
fi

# ── Manifest ─────────────────────────────────────────────────────────────────
cat > "${BACKUP_DIR}/manifest.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "db": "${DB_FILE}",
  "uploads": "${UPLOADS_FILE:-null}",
  "hostname": "$(hostname)",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# ── Optional S3 push ──────────────────────────────────────────────────────────
if [ -n "${S3_BACKUP_BUCKET:-}" ] && command -v aws &>/dev/null; then
  echo "[backup] Uploading to s3://${S3_BACKUP_BUCKET}/backups/${TIMESTAMP}/"
  aws s3 cp "${BACKUP_DIR}" "s3://${S3_BACKUP_BUCKET}/backups/${TIMESTAMP}/" --recursive --quiet
  echo "[backup] S3 upload complete"
fi

# ── Prune old local backups ───────────────────────────────────────────────────
echo "[backup] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_ROOT}" -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true

echo "[backup] Done. Backup stored in ${BACKUP_DIR}"
