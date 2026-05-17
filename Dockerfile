### Stage 1: build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --include=dev
COPY frontend/ .
RUN npm run build

### Stage 2: build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --include=dev
COPY backend/ .
RUN npx prisma generate
RUN npm run build

### Stage 3: production runtime
FROM node:20-alpine
WORKDIR /app/backend

# Production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Prisma client binaries (generated in builder)
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma

# Compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Prisma schema + migrations (needed for migrate deploy)
COPY backend/prisma ./prisma

# Built React SPA — served by NestJS at /app/frontend/dist
# main.ts: join(__dirname, '..', '..', 'frontend', 'dist')
# __dirname = /app/backend/dist → /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 3001
CMD ["sh", "-c", "(npx prisma migrate resolve --rolled-back 20260517000001_production_hardening_indexes || true) && npx prisma migrate deploy && node dist/main.js"]
