# Tracker

A full-featured project management system (like Linear / Jira) built with NestJS, React, PostgreSQL, and Socket.io.

## One-command startup

**Prerequisites:** [Node.js 18+](https://nodejs.org) · [Docker Desktop](https://www.docker.com/get-started)

```bash
git clone <repo-url>
cd Tracker
npm install
npm run dev
```

That's it. Open **http://localhost:5173**.

What `npm run dev` does automatically:
- Creates `backend/.env` from `.env.example` if missing
- Starts a PostgreSQL container via Docker (no manual DB setup)
- Waits for the database to be ready
- Runs `prisma generate` + `prisma migrate deploy`
- Launches backend (port 3001) and frontend (port 5173) with hot-reload

## Developer profiles

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start with empty DB |
| `npm run demo` | Start + seed demo data and accounts |
| `npm run prod` | Build and run via Docker Compose (all services) |
| `npm run stop` | Stop the dev database container |

## Demo credentials (after `npm run demo`)

| Role | Email | Password |
|------|-------|----------|
| System Admin | admin@tracker.dev | Admin1234! |
| Developer | dev@tracker.dev | Dev1234! |

## Project structure

```
Tracker/
├── backend/          # NestJS API (port 3001)
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── .env.example
├── frontend/         # React + Vite (port 5173)
│   └── .env.example
├── dev.js            # One-command dev launcher
├── docker-compose.yml          # Full production stack
├── docker-compose.dev.yml      # Dev: DB only
└── package.json      # Root scripts
```

## Available scripts (root)

```bash
npm run dev          # Start development (Docker DB + native backend + frontend)
npm run demo         # Same + seed demo data
npm run prod         # docker compose up --build (full stack in Docker)
npm run stop         # Stop Docker DB container
npm run build        # Build both backend and frontend
npm run test         # Run all tests
npm run typecheck    # TypeScript check (both)
npm run db:seed      # Seed demo data (DB must be running)
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (DESTROYS ALL DATA)
```

## Manual / advanced setup

If you prefer not to use Docker for the database:

```bash
# Start an existing PostgreSQL and set DATABASE_URL in backend/.env, then:
npm run dev --skip-db
# or:
node dev.js --skip-db
```

## Environment variables

Copy `backend/.env.example` → `backend/.env` and adjust if needed (auto-done by `npm run dev`).

Key variables:

| Variable | Default (dev) | Notes |
|----------|--------------|-------|
| `DATABASE_URL` | Docker postgres on 5432 | Auto-set from .env.example |
| `JWT_SECRET` | dev placeholder | **Change in production** |
| `JWT_REFRESH_SECRET` | dev placeholder | **Change in production** |
| `PORT` | 3001 | Backend port |
| `FRONTEND_URL` | http://localhost:5173 | CORS allow-list |

## Tech stack

**Backend:** NestJS · Prisma · PostgreSQL · Socket.io · Passport JWT · bcrypt

**Frontend:** React 18 · Vite · TanStack Query · Zustand · Tailwind CSS · Tiptap · @dnd-kit

**Infrastructure:** Docker · GitHub Actions CI
