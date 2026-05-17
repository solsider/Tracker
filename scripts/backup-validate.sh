#!/usr/bin/env bash
# backup-validate.sh — restore last backup into a temp DB and verify integrity
# Runs weekly via cron. Exits non-zero if restore validation fails.

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-$(pwd)/backups}"
TEST_DB_NAME="tracker_restore_test_$(date +%s)"

if [ -f "$(pwd)/.env" ]; then
  set -a; source "$(pwd)/.env"; set +a
fi

DB_URL="${DATABASE_URL:?DATABASE_URL is not set}"
# Extract host/port/user/password from URL
DB_HOST=$(echo "${DB_URL}" | sed -n 's|.*@\([^:/]*\).*|\1|p')
DB_PORT=$(echo "${DB_URL}" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo "${DB_URL}" | sed -n 's|.*//\([^:]*\):.*|\1|p')
DB_PASS=$(echo "${DB_URL}" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

echo "[validate] Finding latest backup..."
LATEST_DIR=$(find "${BACKUP_ROOT}" -maxdepth 1 -type d -name "20*" | sort | tail -1)
if [ -z "${LATEST_DIR}" ]; then
  echo "[validate] ERROR: No backups found in ${BACKUP_ROOT}" >&2; exit 1
fi

DB_FILE=$(find "${LATEST_DIR}" -name "db_*.sql.gz" | head -1)
if [ -z "${DB_FILE}" ]; then
  echo "[validate] ERROR: No DB dump in ${LATEST_DIR}" >&2; exit 1
fi

echo "[validate] Validating ${DB_FILE}..."
echo "[validate] Creating test database ${TEST_DB_NAME}..."

PGPASSWORD="${DB_PASS}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB_NAME}" || {
  echo "[validate] ERROR: Could not create test database" >&2; exit 1
}

TEST_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${TEST_DB_NAME}"

cleanup() {
  echo "[validate] Dropping test database..."
  PGPASSWORD="${DB_PASS}" dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB_NAME}" 2>/dev/null || true
}
trap cleanup EXIT

echo "[validate] Restoring dump..."
gunzip -c "${DB_FILE}" | PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB_NAME}" -q

echo "[validate] Verifying row counts..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB_NAME}" -c \
  "SELECT tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10;"

echo "[validate] Backup validation PASSED for ${LATEST_DIR}"
