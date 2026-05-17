#!/usr/bin/env bash
# backup-cron-setup.sh — install a daily backup cron job
# Run once on the production server: sudo bash scripts/backup-cron-setup.sh
# Creates: /etc/cron.d/tracker-backup

set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRON_FILE="/etc/cron.d/tracker-backup"
LOG_FILE="/var/log/tracker-backup.log"

cat > "${CRON_FILE}" <<EOF
# Tracker — daily backup at 02:00 UTC
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 2 * * * root cd ${INSTALL_DIR} && bash scripts/backup.sh >> ${LOG_FILE} 2>&1

# Weekly backup validation at 03:00 UTC on Sundays
0 3 * * 0 root cd ${INSTALL_DIR} && bash scripts/backup-validate.sh >> ${LOG_FILE} 2>&1
EOF

chmod 644 "${CRON_FILE}"
echo "Cron job installed at ${CRON_FILE}"
echo "Logs will be written to ${LOG_FILE}"
