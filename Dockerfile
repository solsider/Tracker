FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# ── Frontend ────────────────────────────────────────────────────────────────
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --include=dev
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ── Backend ─────────────────────────────────────────────────────────────────
COPY backend/package*.json ./backend/
RUN cd backend && npm install --include=dev
COPY backend/ ./backend/
RUN cd backend && npx prisma generate
RUN cd backend && npm run build

# Verify the compiled entry point exists (fail fast if build is broken)
RUN ls -la /app/backend/dist/ 2>/dev/null || echo "dist/ directory does not exist"
RUN test -f /app/backend/dist/main.js && echo "dist/main.js OK" || (echo "dist/main.js MISSING" && exit 1)

WORKDIR /app/backend
EXPOSE 3001

# main.ts resolves frontend/dist as join(__dirname, '..', '..', 'frontend', 'dist')
# __dirname = /app/backend/dist  →  /app/frontend/dist  ✓
CMD ["sh", "-c", "(npx prisma migrate resolve --rolled-back 20260517000001_production_hardening_indexes || true) && npx prisma migrate deploy && node dist/main.js"]
