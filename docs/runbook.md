# Operations Runbook

**System:** Tracker — Project Management Platform  
**Version:** 1.0  
**Updated:** 2026-05-17

---

## Quick Reference

| Task | Command |
|------|---------|
| Deploy | `bash scripts/deploy.sh` |
| Rollback | `bash scripts/rollback.sh` |
| Backup now | `bash scripts/backup.sh` |
| Restore | `bash scripts/restore.sh ./backups/TIMESTAMP --confirm` |
| Validate backup | `bash scripts/backup-validate.sh` |
| Health check | `bash scripts/health-check.sh` |
| View logs | `docker compose logs -f backend` |
| DB console | `docker compose exec postgres psql -U tracker_user tracker` |
| Restart backend | `docker compose restart backend` |

---

## 1. Initial Server Setup

### Prerequisites
- Ubuntu 22.04+ / Debian 12+
- Docker 25+ and Docker Compose v2
- 2 vCPU, 4 GB RAM minimum
- 20 GB disk (more if storing file uploads locally)

### Steps
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone repository
git clone https://github.com/your-org/tracker.git /opt/tracker
cd /opt/tracker

# Create production env file
cp .env.production.example .env
# Edit .env with real values — MUST change all CHANGE_ME placeholders
nano .env

# Install backup cron
sudo bash scripts/backup-cron-setup.sh

# Deploy
bash scripts/deploy.sh
```

---

## 2. Routine Operations

### Deploy a new version
```bash
cd /opt/tracker
git pull origin main
bash scripts/deploy.sh
```

Deploy with skip-backup (CI already backed up):
```bash
bash scripts/deploy.sh --skip-backup
```

### View live logs
```bash
# Backend (structured JSON)
docker compose logs -f backend | jq '.'

# Frontend (nginx access log)
docker compose logs -f frontend

# All services
docker compose logs -f
```

### Manual health check
```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
bash scripts/health-check.sh
```

---

## 3. Backup & Recovery

### Manual backup
```bash
cd /opt/tracker && bash scripts/backup.sh
# Creates: ./backups/TIMESTAMP/db_TIMESTAMP.sql.gz + uploads_TIMESTAMP.tar.gz
```

### Restore from backup
```bash
# List available backups
ls -lh backups/

# Dry run (shows what would be restored, no changes)
bash scripts/restore.sh ./backups/20260517_020000

# Actually restore (DESTRUCTIVE — overwrites DB)
bash scripts/restore.sh ./backups/20260517_020000 --confirm
```

### Backup validation (weekly via cron)
```bash
bash scripts/backup-validate.sh
```
Validation creates a temporary DB, restores the latest backup into it, checks row counts, then drops the temp DB.

---

## 4. Incident Response

### Service down (backend not responding)

1. Check container status:
   ```bash
   docker compose ps
   docker compose logs backend --tail=100
   ```

2. Check DB connectivity:
   ```bash
   curl http://localhost:3001/health/ready
   ```

3. If DB disconnected — check postgres container:
   ```bash
   docker compose ps postgres
   docker compose restart postgres
   ```

4. If backend OOM — increase memory limit in `docker-compose.yml` and redeploy.

5. If still failing — rollback:
   ```bash
   bash scripts/rollback.sh
   ```

### Database corruption / data loss

1. **Stop the backend immediately** to prevent further writes:
   ```bash
   docker compose stop backend
   ```

2. Identify last known good backup:
   ```bash
   ls -lh backups/ | tail -10
   ```

3. Restore:
   ```bash
   bash scripts/restore.sh ./backups/LAST_GOOD_TIMESTAMP --confirm
   ```

4. Restart and verify:
   ```bash
   docker compose start backend
   bash scripts/health-check.sh
   ```

### WebSocket disruption (all users lose real-time)

- Likely cause: backend restart or memory pressure
- Frontend shows `ReconnectingBanner` automatically
- Action: check backend logs, restart if needed: `docker compose restart backend`
- WebSocket connections auto-reconnect within 5s on client side

### High error rate (from metrics endpoint or logs)

1. Check metrics:
   ```bash
   curl -H "Authorization: Bearer TOKEN" http://localhost:3001/metrics | jq '.routes'
   ```

2. Identify high-error routes.

3. Check structured error logs:
   ```bash
   docker compose logs backend | jq 'select(.level == "error")'
   ```

---

## 5. Secret Rotation

### Rotate JWT secrets

```bash
# 1. Generate new secrets
NEW_JWT=$(openssl rand -hex 32)
NEW_REFRESH=$(openssl rand -hex 32)

# 2. Update .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${NEW_JWT}|" .env
sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${NEW_REFRESH}|" .env

# 3. Redeploy (all active sessions invalidated — users must log in again)
bash scripts/deploy.sh --skip-backup
```

### Rotate DB password

```bash
# 1. Generate new password
NEW_PASS=$(openssl rand -base64 32)

# 2. Change in postgres
docker compose exec postgres psql -U tracker_user -c \
  "ALTER USER tracker_user WITH PASSWORD '${NEW_PASS}';"

# 3. Update .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${NEW_PASS}|" .env

# 4. Restart backend
docker compose restart backend
```

---

## 6. Scaling

### Vertical scaling (single server)
Edit `docker-compose.yml` and add resource limits:
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
```

### Before horizontal scaling
1. Move session/throttle state to Redis (required)
2. Use S3 for file uploads (required)
3. Add a load balancer (nginx/HAProxy)
4. Ensure `FRONTEND_URL` and CORS support multiple origins

---

## 7. Monitoring Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | None | Liveness: process alive |
| `GET /health/ready` | None | Readiness: DB connected |
| `GET /metrics` | JWT | Route latency, error rates |
| `POST /telemetry/crash` | None | Frontend crash reports (write-only) |
