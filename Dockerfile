# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Frontend ──────────────────────────────────────────────────────────────────
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --include=dev

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ── Backend ───────────────────────────────────────────────────────────────────
COPY backend/package*.json ./backend/
RUN cd backend && npm install --include=dev

COPY backend/ ./backend/
RUN cd backend && npx prisma generate
RUN cd backend && npm run build

# ── Stage 2: Runtime ───────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend production deps only
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Compiled backend
COPY --from=builder /app/backend/dist ./backend/dist

# Prisma: schema + generated client from builder
COPY backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma  ./backend/node_modules/@prisma

# Built frontend — served by NestJS static assets in production
# backend/main.ts: join(__dirname, '..', '..', 'frontend', 'dist')
# __dirname = /app/backend/dist  →  resolves to /app/frontend/dist ✓
COPY --from=builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 3001

# prisma db push: applies schema to fresh DB on first deploy; no-op on subsequent
# deploys when schema is unchanged. For destructive schema changes, run
# `npx prisma db push --accept-data-loss` manually via Railway shell.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]
