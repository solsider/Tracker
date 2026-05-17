import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { AddColumnButton } from './AddColumnButton';
import { useMoveIssue } from '../../hooks/useIssues';
import { useReorderColumns } from '../../hooks/useColumns';
import type { Column, Issue } from '../../types';

interface KanbanBoardProps {
  projectId: string;
  columns: Column[];
  issues: Issue[];
}

export function KanbanBoard({ projectId, columns, issues }: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const queryClient = useQueryClient();
  const moveIssue = useMoveIssue(projectId);
  const reorderColumns = useReorderColumns(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const sortedIssues = [...issues].sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!data) return;
    if (data.type === 'task') {
      setActiveIssue(data.issue as Issue);
    } else if (data.type === 'column') {
      setActiveColumn(data.column as Column);
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveIssue(null);
    setActiveColumn(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    setActiveColumn(null);

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Read live cache data to avoid stale closure race condition
    const liveColumns = (queryClient.getQueryData<Column[]>(['columns', projectId]) ?? columns)
      .slice()
      .sort((a, b) => a.order - b.order);
    const liveIssues = (queryClient.getQueryData<Issue[]>(['issues', projectId]) ?? issues)
      .slice()
      .sort((a, b) => a.order - b.order);

    // ── Column reorder ──────────────────────────────────────────────────────
    if (activeType === 'column' && overType === 'column' && active.id !== over.id) {
      const oldIndex = liveColumns.findIndex((c) => c.id === active.id);
      const newIndex = liveColumns.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(liveColumns, oldIndex, newIndex);
      reorderColumns.mutate({
        orders: reordered.map((col, i) => ({ id: col.id, order: i })),
      });
      return;
    }

    if (activeType !== 'task') return;

    // ── Task dropped onto a column (empty column or column header) ──────────
    if (overType === 'column') {
      const targetColumnId = over.id as string;
      const issue = liveIssues.find((i) => i.id === active.id);
      if (!issue || issue.columnId === targetColumnId) return;
      moveIssue.mutate({ id: active.id as string, columnId: targetColumnId });
      return;
    }

    // ── Task dropped onto another task ──────────────────────────────────────
    if (overType === 'task' && active.id !== over.id) {
      const activeIssueItem = liveIssues.find((i) => i.id === active.id);
      const overIssueItem = liveIssues.find((i) => i.id === over.id);
      if (!activeIssueItem || !overIssueItem) return;

      if (activeIssueItem.columnId === overIssueItem.columnId) {
        // ── Within-column reorder ───────────────────────────────────────────
        const columnIssues = liveIssues.filter(
          (i) => i.columnId === activeIssueItem.columnId,
        );
        const oldIndex = columnIssues.findIndex((i) => i.id === active.id);
        const newIndex = columnIssues.findIndex((i) => i.id === over.id);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const reordered = arrayMove(columnIssues, oldIndex, newIndex);
        const afterId = reordered[newIndex - 1]?.id;
        const beforeId = reordered[newIndex + 1]?.id;

        moveIssue.mutate({
          id: active.id as string,
          columnId: activeIssueItem.columnId,
          afterId,
          beforeId,
        });
      } else {
        // ── Cross-column drop onto a task → insert before that task ────────
        const targetColumnIssues = liveIssues.filter(
          (i) => i.columnId === overIssueItem.columnId,
        );
        const overIndex = targetColumnIssues.findIndex((i) => i.id === over.id);
        const afterId = overIndex > 0 ? targetColumnIssues[overIndex - 1].id : undefined;
        const beforeId = overIssueItem.id;

        moveIssue.mutate({
          id: active.id as string,
          columnId: overIssueItem.columnId,
          afterId,
          beforeId,
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={sortedColumns.map((c) => c.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4 items-start">
          {sortedColumns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              projectId={projectId}
              issues={sortedIssues.filter((i) => i.columnId === col.id)}
              isTaskBeingDragged={!!activeIssue}
            />
          ))}
          <AddColumnButton projectId={projectId} />
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeIssue ? (
          <TaskCard issue={activeIssue} isDragging />
        ) : activeColumn ? (
          <div className="w-72 bg-dash-panel rounded-xl border-2 border-dash-accent/40 shadow-xl p-3 opacity-90">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeColumn.color }}
              />
              <span className="font-semibold text-dash-text text-sm">
                {activeColumn.title}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
