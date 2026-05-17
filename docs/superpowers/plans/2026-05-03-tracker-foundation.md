# Tracker Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational scaffold of a Yandex Tracker-like task management system.

**Architecture:** NestJS layered backend (Controller → Service → Repository → Prisma), JWT auth, nested REST routing under projects. React frontend with React Query for server state, Zustand for auth, TailwindCSS for UI.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL, React 18, TypeScript 5, Vite 5, React Router 6, Axios, Zustand, TanStack Query v5, TailwindCSS 3

---

## File Map

### Backend (`backend/`)
- `package.json` — NestJS deps
- `tsconfig.json` — TS config with decorators
- `nest-cli.json` — NestJS CLI config
- `.env.example` — env template
- `prisma/schema.prisma` — User, Project, ProjectMember, Issue, Comment models
- `src/main.ts` — bootstrap, CORS, ValidationPipe
- `src/app.module.ts` — root module
- `src/prisma/prisma.module.ts` — global PrismaModule
- `src/prisma/prisma.service.ts` — PrismaClient lifecycle
- `src/auth/` — JWT register/login/me
- `src/users/` — UsersService + UsersRepository
- `src/projects/` — CRUD + members management
- `src/issues/` — nested under projects, auto-numbered
- `src/comments/` — nested under issues

### Frontend (`frontend/`)
- `package.json`, `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts` — proxy /api → localhost:3001
- `index.html`, `src/index.css` — entry + tailwind
- `src/types/index.ts` — shared TS interfaces
- `src/api/` — axios client + per-resource API modules
- `src/store/auth.store.ts` — Zustand persisted auth
- `src/hooks/` — React Query wrappers
- `src/components/ui/` — Button, Input, Modal
- `src/components/layout/` — Layout, Header, Sidebar
- `src/pages/` — Login, Register, Projects, ProjectDetail, Issues
- `src/App.tsx` — routing with PrivateRoute

---

### Task 1: Backend config files

- [ ] Create `backend/package.json`
- [ ] Create `backend/tsconfig.json`
- [ ] Create `backend/nest-cli.json`
- [ ] Create `backend/.env.example`
- [ ] Create `backend/prisma/schema.prisma`

### Task 2: Prisma + core modules

- [ ] Create `src/prisma/prisma.service.ts`
- [ ] Create `src/prisma/prisma.module.ts`
- [ ] Create `src/app.module.ts`
- [ ] Create `src/main.ts`

### Task 3: Auth + Users modules

- [ ] Create all auth DTOs, strategy, guard, service, controller, module
- [ ] Create users repository, service, module

### Task 4: Projects module

- [ ] Create projects DTOs, repository, service, controller, module

### Task 5: Issues module

- [ ] Create issues DTOs, repository, service, controller, module

### Task 6: Comments module

- [ ] Create comments DTO, service, controller, module

### Task 7: Frontend config

- [ ] Create `frontend/package.json`, tsconfig files, vite.config.ts
- [ ] Create `index.html`, `src/index.css`, tailwind/postcss configs

### Task 8: Frontend types + API

- [ ] Create `src/types/index.ts`
- [ ] Create `src/api/client.ts`, auth.api.ts, projects.api.ts, issues.api.ts

### Task 9: Frontend state + hooks

- [ ] Create `src/store/auth.store.ts`
- [ ] Create `src/hooks/useAuth.ts`, useProjects.ts, useIssues.ts

### Task 10: Frontend components + pages

- [ ] Create UI components (Button, Input, Modal)
- [ ] Create layout (Layout, Header, Sidebar)
- [ ] Create pages (LoginPage, RegisterPage, ProjectsPage, ProjectDetailPage, IssuesPage)
- [ ] Create `src/App.tsx` + `src/main.tsx`
