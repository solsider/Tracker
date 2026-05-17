# Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kanban board with drag-and-drop issue status updates, integrated with existing NestJS backend and React frontend.

**Architecture:** Backend gets a new flat `PATCH /issues/:id/status` endpoint with access control via ProjectsRepository. Frontend gets dnd-kit Kanban with optimistic React Query updates and rollback on error.

**Tech Stack:** @dnd-kit/core, @dnd-kit/utilities, existing NestJS/Prisma/React Query stack.

---

## File Map

### Backend (new/modified)
- Create: `backend/src/issues/dto/update-issue-status.dto.ts`
- Modify: `backend/src/issues/issues.repository.ts` — add `findById`, `updateById`
- Modify: `backend/src/issues/issues.service.ts` — add `updateStatus`
- Create: `backend/src/issues/issues-status.controller.ts`
- Modify: `backend/src/issues/issues.module.ts` — register new controller

### Frontend (new/modified)
- Modify: `frontend/package.json` — add @dnd-kit deps
- Modify: `frontend/src/api/issues.api.ts` — add `updateStatus`
- Modify: `frontend/src/hooks/useIssues.ts` — add `useUpdateIssueStatus`
- Create: `frontend/src/components/kanban/TaskCard.tsx`
- Create: `frontend/src/components/kanban/KanbanColumn.tsx`
- Create: `frontend/src/components/kanban/KanbanBoard.tsx`
- Create: `frontend/src/pages/projects/KanbanPage.tsx`
- Modify: `frontend/src/pages/projects/ProjectDetailPage.tsx` — add board link
- Modify: `frontend/src/App.tsx` — add /projects/:id/board route

---

### Task 1: Backend — status DTO + repository methods

- [ ] Create `backend/src/issues/dto/update-issue-status.dto.ts`
- [ ] Add `findById` and `updateById` to `issues.repository.ts`

### Task 2: Backend — service method + controller + module

- [ ] Add `updateStatus` to `issues.service.ts`
- [ ] Create `issues-status.controller.ts`
- [ ] Register controller in `issues.module.ts`

### Task 3: Frontend — API + hook

- [ ] Add `updateStatus` to `issues.api.ts`
- [ ] Add `useUpdateIssueStatus` to `useIssues.ts`

### Task 4: Frontend — Kanban components

- [ ] Create `TaskCard.tsx`
- [ ] Create `KanbanColumn.tsx`
- [ ] Create `KanbanBoard.tsx`

### Task 5: Frontend — page + routing

- [ ] Create `KanbanPage.tsx`
- [ ] Add board link in `ProjectDetailPage.tsx`
- [ ] Add route in `App.tsx`
- [ ] Add @dnd-kit to `package.json`
