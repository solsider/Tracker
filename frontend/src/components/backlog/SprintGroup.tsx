import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BacklogIssueRow } from './BacklogIssueRow';
import { SprintFormModal } from './SprintFormModal';
import { CompleteSprintModal } from './CompleteSprintModal';
import { useCreateIssue } from '../../hooks/useIssues';
import type { Sprint, Issue } from '../../types';

interface Props {
  sprint: Sprint;
  issues: Issue[];
  projectId: string;
  onUpdateSP: (issueNumber: number, sp: number | null) => void;
  onStartSprint: (sprintId: string) => void;
  onCompleteSprint: (sprintId: string) => void;
  onDeleteSprint: (sprintId: string) => void;
  onUpdateSprint: (sprintId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }) => void;
}

export function SprintGroup({
  sprint, issues, projectId, onUpdateSP,
  onStartSprint, onCompleteSprint, onDeleteSprint, onUpdateSprint,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineOpen, setInlineOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: sprint.id });
  const createIssue = useCreateIssue(projectId);

  const totalSP = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  const statusBadge =
    sprint.status === 'ACTIVE'
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

  const statusLabel =
    sprint.status === 'ACTIVE' ? 'Активный' : 'Планирование';

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : null;

  const datesLabel = (() => {
    const s = formatDate(sprint.startDate);
    const e = formatDate(sprint.endDate);
    if (s && e) return `${s} — ${e}`;
    if (e) return `до ${e}`;
    return null;
  })();

  const handleInlineCreate = () => {
    if (!inlineTitle.trim()) return;
    createIssue.mutate(
      { title: inlineTitle.trim(), sprintId: sprint.id } as any,
      { onSuccess: () => { setInlineTitle(''); setInlineOpen(false); } },
    );
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isOver ? 'border-dash-accent/60 bg-dash-accent/5' : 'border-dash-border bg-dash-panel'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-dash-muted hover:text-dash-text text-xs shrink-0 transition-colors w-3"
        >
          {collapsed ? '▶' : '▼'}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-dash-text">{sprint.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusBadge}`}>
              {statusLabel}
            </span>
            <span className="text-xs text-dash-muted">
              {issues.length} задач{issues.length % 10 === 1 && issues.length !== 11 ? 'а' : issues.length % 10 >= 2 && issues.length % 10 <= 4 && (issues.length < 10 || issues.length > 20) ? 'и' : ''}
              {totalSP > 0 && ` · ${totalSP} SP`}
            </span>
            {datesLabel && (
              <span className="text-xs text-dash-muted/60">{datesLabel}</span>
            )}
          </div>
          {sprint.goal && (
            <p className="text-xs text-dash-muted mt-0.5 truncate">{sprint.goal}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {sprint.status === 'PLANNING' && (
            <>
              <button
                onClick={() => setShowEdit(true)}
                className="text-xs text-dash-muted hover:text-dash-text px-2 py-1 rounded hover:bg-dash-bg transition-colors"
              >
                Изменить
              </button>
              <button
                onClick={() => onStartSprint(sprint.id)}
                className="text-xs bg-dash-accent text-white px-3 py-1 rounded-lg hover:bg-dash-accent/80 font-medium transition-colors"
              >
                Начать
              </button>
              <button
                onClick={() => onDeleteSprint(sprint.id)}
                className="text-xs text-red-400/50 hover:text-red-400 px-1 py-1 rounded hover:bg-dash-bg transition-colors"
                title="Удалить спринт"
              >
                ✕
              </button>
            </>
          )}
          {sprint.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => setShowEdit(true)}
                className="text-xs text-dash-muted hover:text-dash-text px-2 py-1 rounded hover:bg-dash-bg transition-colors"
              >
                Изменить
              </button>
              <button
                onClick={() => setShowComplete(true)}
                className="text-xs border border-dash-border text-dash-muted hover:text-dash-text px-3 py-1 rounded-lg hover:bg-dash-bg font-medium transition-colors"
              >
                Завершить спринт
              </button>
            </>
          )}
        </div>
      </div>

      {/* Issue list */}
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
                placeholder="Название задачи..."
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
            <p className="text-xs text-dash-muted/40 text-center py-3">
              Перетащите задачи в этот спринт
            </p>
          )}

          <button
            onClick={() => setInlineOpen(true)}
            className="w-full text-left text-xs text-dash-muted/50 hover:text-dash-muted px-2 py-1.5 rounded hover:bg-dash-bg/50 transition-colors mt-1"
          >
            + Создать задачу
          </button>
        </div>
      )}

      {showEdit && (
        <SprintFormModal
          sprint={sprint}
          onSave={(data) => { onUpdateSprint(sprint.id, data); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showComplete && (
        <CompleteSprintModal
          sprint={sprint}
          issues={issues}
          onConfirm={() => { onCompleteSprint(sprint.id); setShowComplete(false); }}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  );
}
