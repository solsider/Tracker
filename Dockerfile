FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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

# Show what src files exist
RUN find /app/backend/src -name "*.ts" | wc -l && echo "ts files found"

RUN cd backend && npx prisma generate

# Compile: run tsc directly to surface any errors clearly
RUN cd backend && node_modules/.bin/tsc -p tsconfig.build.json

# Show what was produced
RUN find /app/backend -name "*.js" -not -path "*/node_modules/*" | head -20

RUN test -f /app/backend/dist/main.js && echo "dist/main.js OK" || (echo "dist/main.js MISSING" && exit 1)

WORKDIR /app/backend
EXPOSE 3001

CMD ["sh", "-c", "(npx prisma migrate resolve --rolled-back 20260517000001_production_hardening_indexes || true) && npx prisma migrate deploy && node dist/main.js"]
