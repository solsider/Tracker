import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { useDeleteColumn, useUpdateColumn } from '../../hooks/useColumns';
import type { Column, Issue } from '../../types';

interface KanbanColumnProps {
  column: Column;
  issues: Issue[];
  projectId: string;
  isTaskBeingDragged: boolean;
}

export function KanbanColumn({ column, issues, projectId, isTaskBeingDragged }: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [editColor, setEditColor] = useState(column.color);

  const deleteColumn = useDeleteColumn(projectId);
  const updateColumn = useUpdateColumn(projectId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isColumnDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateColumn.mutate({ id: column.id, data: { title: editTitle.trim(), color: editColor } });
    }
    setIsEditing(false);
  };

  const sortedIssues = [...issues].sort((a, b) => a.order - b.order);
  const isTaskOver = isOver && isTaskBeingDragged;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col w-64 sm:w-72 shrink-0 transition-opacity ${isColumnDragging ? 'opacity-25 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between mb-3 px-1 gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="flex-1 text-sm font-semibold bg-dash-bg border border-dash-border rounded px-2 py-0.5 text-dash-text focus:outline-none focus:border-dash-accent"
              autoFocus
            />
            <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300 transition-colors flex items-center px-1 focus-visible:outline-none" aria-label="Сохранить">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="2,7 5.5,10.5 12,3.5" /></svg>
            </button>
            <button onClick={() => setIsEditing(false)} className="text-dash-muted hover:text-dash-text transition-colors flex items-center px-1 focus-visible:outline-none" aria-label="Отмена">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-3.5 h-3.5"><line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" /></svg>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-dash-muted hover:text-dash-text shrink-0 select-none flex items-center"
                title="Перетащить колонку"
              >
                <svg viewBox="0 0 10 16" fill="currentColor" className="w-2.5 h-4 opacity-50">
                  <circle cx="3" cy="2" r="1.5" /><circle cx="7" cy="2" r="1.5" />
                  <circle cx="3" cy="6" r="1.5" /><circle cx="7" cy="6" r="1.5" />
                  <circle cx="3" cy="10" r="1.5" /><circle cx="7" cy="10" r="1.5" />
                  <circle cx="3" cy="14" r="1.5" /><circle cx="7" cy="14" r="1.5" />
                </svg>
              </div>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
              <h3
                className="font-semibold text-dash-text text-sm truncate cursor-pointer hover:text-white"
                onClick={() => setIsEditing(true)}
                title="Нажми для редактирования"
              >
                {column.title}
              </h3>
              <span className="text-xs bg-dash-border text-dash-muted px-1.5 py-0.5 rounded-full font-medium shrink-0">
                {issues.length}
              </span>
            </div>
            <button
              onClick={() => deleteColumn.mutate(column.id)}
              className="text-dash-muted hover:text-red-400 transition-colors shrink-0 flex items-center justify-center w-5 h-5 rounded hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent"
              title="Удалить колонку"
              disabled={deleteColumn.isPending}
              aria-label="Удалить колонку"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div
        className={`flex flex-col flex-1 min-h-48 rounded-xl p-2 border-t-4 transition-colors ${
          isTaskOver
            ? 'bg-dash-accent/5 outline outline-2 outline-dash-accent/30 outline-dashed'
            : 'bg-dash-bg/40'
        }`}
        style={{ borderTopColor: column.color }}
      >
        <SortableContext
          items={sortedIssues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedIssues.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-dash-muted text-xs">
              Перетащи задачу сюда
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedIssues.map((issue) => (
                <TaskCard key={issue.id} issue={issue} projectId={projectId} />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
