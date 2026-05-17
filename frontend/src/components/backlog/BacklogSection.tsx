import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BacklogIssueRow } from './BacklogIssueRow';
import { useCreateIssue } from '../../hooks/useIssues';
import type { Issue } from '../../types';

interface Props {
  issues: Issue[];
  projectId: string;
  onUpdateSP: (issueNumber: number, sp: number | null) => void;
}

export function BacklogSection({ issues, projectId, onUpdateSP }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' });
  const [collapsed, setCollapsed] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineOpen, setInlineOpen] = useState(false);
  const createIssue = useCreateIssue(projectId);

  const handleInlineCreate = () => {
    if (!inlineTitle.trim()) return;
    createIssue.mutate(
      { title: inlineTitle.trim() },
      { onSuccess: () => { setInlineTitle(''); setInlineOpen(false); } },
    );
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isOver ? 'border-dash-accent/60 bg-dash-accent/5' : 'border-dash-border bg-dash-panel'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-dash-muted hover:text-dash-text text-xs shrink-0 transition-colors w-3"
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="text-sm font-semibold text-dash-text">Бэклог</span>
        <span className="text-xs text-dash-muted">
          {issues.length} задач{issues.length % 10 === 1 && issues.length !== 11 ? 'а' : ''}
        </span>
        <div className="ml-auto">
          <button
            onClick={() => { setInlineOpen(true); setCollapsed(false); }}
            className="text-xs text-dash-muted hover:text-dash-accent transition-colors"
          >
            + Создать задачу
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`min-h-[36px] px-3 pb-3 space-y-0.5 ${
            isOver ? 'ring-1 ring-inset ring-dash-accent/30 rounded-b-xl' : ''
          }`}
        >
          {issues.map((issue) => (
            <BacklogIssueRow
              key={issue.id}
              issue={issue}
              projectId={projectId}
              onUpdateSP={onUpdateSP}
            />
          ))}

          {inlineOpen && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="w-4 shrink-0" />
              <span className="w-4 shrink-0" />
              <span className="w-8 shrink-0" />
              <input
                autoFocus
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineCreate();
                  if (e.key === 'Escape') { setInlineOpen(false); setInlineTitle(''); }
                }}
                placeholder="Название задачи (Enter — создать)"
                className="flex-1 text-sm bg-transparent border-b border-dash-accent/50 text-dash-text focus:outline-none pb-0.5 placeholder-dash-muted/40"
              />
              <button onClick={handleInlineCreate} className="text-xs text-dash-accent hover:text-dash-accent/80 shrink-0">
                Создать
              </button>
              <button onClick={() => { setInlineOpen(false); setInlineTitle(''); }} className="text-xs text-dash-muted hover:text-dash-text shrink-0">
                Отмена
              </button>
            </div>
          )}

          {issues.length === 0 && !inlineOpen && (
            <p className="text-xs text-dash-muted/40 text-center py-4">
              Бэклог пуст — все задачи распределены по спринтам
            </p>
          )}
        </div>
      )}
    </div>
  );
}
