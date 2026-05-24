# Railway Deployment Guide

## Architecture

Single service monolith on Railway:
- **Backend** (NestJS) + **Frontend** (React SPA, served by NestJS in production)
- **PostgreSQL** via Railway plugin
- One Dockerfile at repo root builds both

```
railway project
├── tracker (web service)  ← root Dockerfile
└── postgres (plugin)      ← Railway managed
```

---

## 1. Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select your repository
4. Railway auto-detects `Dockerfile` at root

---

## 2. Add PostgreSQL

In your Railway project dashboard:
1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically injects `DATABASE_URL` into your service ✓

---

## 3. Set Environment Variables

In the service **Variables** tab, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `JWT_SECRET` | `<run: openssl rand -hex 32>` | Must be 32+ chars |
| `JWT_REFRESH_SECRET` | `<run: openssl rand -hex 32>` | Different from JWT_SECRET |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `FRONTEND_URL` | `https://<your-app>.up.railway.app` | Your Railway service URL |
| `LOG_LEVEL` | `info` | |
| `STORAGE_PROVIDER` | `local` | Or `s3` for file uploads |

> `DATABASE_URL` and `PORT` are injected automatically by Railway — do not set them manually.

### Generate secrets (run in your terminal):
```bash
openssl rand -hex 32   # → JWT_SECRET
openssl rand -hex 32   # → JWT_REFRESH_SECRET
```

### For S3 file uploads (optional):
```
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=tracker-uploads-prod
```

---

## 4. Set FRONTEND_URL After First Deploy

After Railway assigns a URL (`https://xxx.up.railway.app`):
1. Copy the URL
2. Set `FRONTEND_URL=https://xxx.up.railway.app` in Variables
3. Redeploy (Railway auto-redeploys on variable changes)

Or add a custom domain first, then use that.

---

## 5. Deploy

Railway auto-deploys on every push to `main`. To trigger manually:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from local branch
railway up
```

---

## 6. Verify Deployment

```bash
# Health check
curl https://your-app.up.railway.app/health
# → {"status":"ok"}

# Readiness (DB connected)
curl https://your-app.up.railway.app/health/ready
# → {"status":"ready","db":"connected"}

# Frontend loads
open https://your-app.up.railway.app
```

---

## 7. Custom Domain (optional)

In Railway service → **Settings** → **Domains** → **Custom Domain**:
1. Add your domain (e.g., `tracker.yourdomain.com`)
2. Update `FRONTEND_URL` to `https://tracker.yourdomain.com`
3. Update CORS in Railway env: `FRONTEND_URL=https://tracker.yourdomain.com`

---

## Database Schema Management

On first deploy, `prisma db push` creates all tables from `schema.prisma`.

**For schema changes between deploys:**
- Non-destructive (add columns, add tables): `prisma db push` handles automatically ✓
- Destructive (drop columns, rename): run manually via Railway shell:
  ```bash
  railway run --service tracker npx prisma db push --accept-data-loss
  ```
- **Recommended long-term**: create Prisma migrations for production:
  ```bash
  # Local, with DB running:
  npx prisma migrate dev --name <migration-name>
  # Then update CMD in Dockerfile: prisma migrate deploy
  ```

---

## Logs

```bash
railway logs             # stream live logs
railway logs --tail 100  # last 100 lines
```

Or in Railway dashboard → service → **Logs** tab.

---

## Rollback

In Railway dashboard → **Deployments** → click any previous deployment → **Redeploy**.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails: `npm ci` error | Root Dockerfile uses `npm install` (fixed) ✓ |
| `prisma generate` error | `openssl` installed in both stages ✓ |
| `dist/main.js MISSING` | `npm run build` calls `tsc -p tsconfig.build.json` ✓ |
| 401 on all requests | Check `FRONTEND_URL` matches actual origin (CORS) |
| WebSocket disconnects | Ensure no timeout on Railway proxy (Railway default: 60s idle) |
| DB connection refused | Check PostgreSQL plugin is running and `DATABASE_URL` is set |
