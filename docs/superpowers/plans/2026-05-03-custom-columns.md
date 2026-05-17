# Custom Kanban Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Replace fixed IssueStatus enum with dynamic Column model per project, supporting full CRUD and drag-and-drop reordering of both columns and tasks.

**Architecture:** New Column model (id, title, color, order, projectId). Issue.status replaced by Issue.columnId FK. New columns/ module with CRUD + batch reorder. Frontend uses @dnd-kit/sortable for column reorder and @dnd-kit/core for task-to-column DnD.

**Tech Stack:** Same stack + @dnd-kit/sortable

---

## File Map

### Backend
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrate-to-columns.ts`
- Create: `src/columns/dto/create-column.dto.ts`
- Create: `src/columns/dto/update-column.dto.ts`
- Create: `src/columns/dto/reorder-columns.dto.ts`
- Create: `src/columns/columns.repository.ts`
- Create: `src/columns/columns.service.ts`
- Create: `src/columns/columns.controller.ts`
- Create: `src/columns/columns.module.ts`
- Modify: `src/issues/dto/create-issue.dto.ts`
- Modify: `src/issues/dto/update-issue.dto.ts`
- Create: `src/issues/dto/move-issue.dto.ts`
- Modify: `src/issues/issues.repository.ts`
- Modify: `src/issues/issues.service.ts`
- Create: `src/issues/issues-column.controller.ts`
- Modify: `src/issues/issues.module.ts`
- Delete: `src/issues/issues-status.controller.ts`
- Delete: `src/issues/dto/update-issue-status.dto.ts`
- Modify: `src/app.module.ts`

### Frontend
- Modify: `src/types/index.ts`
- Create: `src/api/columns.api.ts`
- Modify: `src/api/issues.api.ts`
- Create: `src/hooks/useColumns.ts`
- Modify: `src/hooks/useIssues.ts`
- Modify: `src/components/kanban/TaskCard.tsx`
- Modify: `src/components/kanban/KanbanColumn.tsx`
- Rewrite: `src/components/kanban/KanbanBoard.tsx`
- Create: `src/components/kanban/AddColumnButton.tsx`
- Modify: `src/pages/projects/KanbanPage.tsx`
- Modify: `src/pages/issues/IssuesPage.tsx`
- Modify: `package.json`
