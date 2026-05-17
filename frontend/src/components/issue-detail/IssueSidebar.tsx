import { useState } from 'react';
import { useColumns } from '../../hooks/useColumns';
import { useProject } from '../../hooks/useProjects';
import { useSprints } from '../../hooks/useSprints';
import { useProjectLabels, useAddLabelToIssue, useRemoveLabelFromIssue } from '../../hooks/useLabels';
import { WatchersPanel } from './panels/WatchersPanel';
import {
  PRIORITY_LABELS, PRIORITY_ICONS,
  TYPE_LABELS, TYPE_ICONS,
} from './IssueDetailConstants';
import type { Issue, IssuePriority, IssueType, IssueLabel } from '../../types';

interface IssueSidebarProps {
  issue: Issue & {
    storyPoints?: number | null;
    sprintId?: string | null;
    labels?: IssueLabel[];
  };
  projectId: string;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function IssueSidebar({ issue, projectId, onUpdate }: IssueSidebarProps) {
  const { data: columns } = useColumns(projectId);
  const { data: project } = useProject(projectId);
  const { data: sprints } = useSprints(projectId);
  const { data: labels } = useProjectLabels(projectId);
  const addLabel = useAddLabelToIssue(projectId, issue.id);
  const removeLabel = useRemoveLabelFromIssue(projectId, issue.id);

  const [editingPoints, setEditingPoints] = useState(false);
  const [pointsValue, setPointsValue] = useState(String(issue.storyPoints ?? ''));

  const currentLabelIds = new Set((issue.labels ?? []).map((l) => l.label.id));

  const toggleLabel = (labelId: string) => {
    if (currentLabelIds.has(labelId)) {
      removeLabel.mutate(labelId);
    } else {
      addLabel.mutate(labelId);
    }
  };

  return (
    <div className="w-56 shrink-0 space-y-5 text-sm">
      {/* Status */}
      <SidebarField label="Статус">
        <select
          value={issue.columnId}
          onChange={(e) => onUpdate({ columnId: e.target.value })}
          className="w-full text-xs bg-dash-bg border border-dash-border rounded px-2 py-1.5 text-dash-text focus:outline-none focus:border-dash-accent/50"
        >
          {(columns ?? []).map((col) => (
            <option key={col.id} value={col.id}>{col.title}</option>
          ))}
        </select>
      </SidebarField>

      {/* Priority */}
      <SidebarField label="Приоритет">
        <select
          value={issue.priority}
          onChange={(e) => onUpdate({ priority: e.target.value as IssuePriority })}
          className="w-full text-xs bg-dash-bg border border-dash-border rounded px-2 py-1.5 text-dash-text focus:outline-none focus:border-dash-accent/50"
        >
          {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_ICONS[p]} {PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </SidebarField>

      {/* Type */}
      <SidebarField label="Тип">
        <select
          value={issue.type}
          onChange={(e) => onUpdate({ type: e.target.value as IssueType })}
          className="w-full text-xs bg-dash-bg border border-dash-border rounded px-2 py-1.5 text-dash-text focus:outline-none focus:border-dash-accent/50"
        >
          {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => (
            <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>
          ))}
        </select>
      </SidebarField>

      {/* Assignee */}
      <SidebarField label="Исполнитель">
        <select
          value={issue.assigneeId ?? ''}
          onChange={(e) => onUpdate({ assigneeId: e.target.value || null })}
          className="w-full text-xs bg-dash-bg border border-dash-border rounded px-2 py-1.5 text-dash-text focus:outline-none focus:border-dash-accent/50"
        >
          <option value="">Не назначен</option>
          {(project?.members ?? []).map((m) => (
            <option key={m.userId} value={m.userId}>{m.user.name}</option>
          ))}
        </select>
      </SidebarField>

      {/* Reporter */}
      <SidebarField label="Автор">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-5 h-5 rounded-full bg-dash-accent/20 flex items-center justify-center text-xs text-dash-accent font-semibold shrink-0">
            {issue.reporter.name.charAt(0)}
          </div>
          <span className="text-xs text-dash-text truncate">{issue.reporter.name}</span>
        </div>
      </SidebarField>

      {/* Sprint */}
      {sprints && sprints.length > 0 && (
        <SidebarField label="Спринт">
          <select
            value={issue.sprintId ?? ''}
            onChange={(e) => onUpdate({ sprintId: e.target.value || null })}
            className="w-full text-xs bg-dash-bg border border-dash-border rounded px-2 py-1.5 text-dash-text focus:outline-none focus:border-dash-accent/50"
          >
            <option value="">Без спринта</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </SidebarField>
      )}

      {/* Story Points */}
      <SidebarField label="Story Points">
        {editingPoints ? (
          <input
            autoFocus
            type="number"
            min="0"
            value={pointsValue}
            onChange={(e) => setPointsValue(e.target.value)}
            onBlur={() => {
              const val = parseInt(pointsValue);
              onUpdate({ storyPoints: isNaN(val) ? null : val });
              setEditingPoints(false);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingPoints(false); }}
            className="w-full px-2 py-1.5 text-xs bg-dash-bg border border-dash-accent/50 rounded text-dash-text focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingPoints(true)}
            className="w-full text-left px-2 py-1.5 text-xs text-dash-text hover:bg-dash-bg rounded"
          >
            {issue.storyPoints != null ? `${issue.storyPoints} pts` : <span className="text-dash-muted">Не задано</span>}
          </button>
        )}
      </SidebarField>

      {/* Due Date */}
      <SidebarField label="Срок">
        <input
          type="date"
          value={issue.dueDate ? issue.dueDate.split('T')[0] : ''}
          onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
          className="w-full px-2 py-1.5 text-xs bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
        />
      </SidebarField>

      {/* Start Date */}
      <SidebarField label="Начало">
        <input
          type="date"
          value={issue.startDate ? issue.startDate.split('T')[0] : ''}
          onChange={(e) => onUpdate({ startDate: e.target.value || null })}
          className="w-full px-2 py-1.5 text-xs bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
        />
      </SidebarField>

      {/* Labels */}
      {labels && labels.length > 0 && (
        <SidebarField label="Метки">
          <div className="space-y-1 px-1">
            {labels.map((label) => {
              const isActive = currentLabelIds.has(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
                    isActive ? 'bg-dash-border' : 'hover:bg-dash-bg'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                  <span className={isActive ? 'text-dash-text' : 'text-dash-muted'}>{label.name}</span>
                  {isActive && <span className="ml-auto text-dash-accent text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </SidebarField>
      )}

      {/* Watchers */}
      <div className="pt-1">
        <WatchersPanel issueId={issue.id} />
      </div>

      {/* Meta */}
      <div className="pt-2 border-t border-dash-border space-y-1">
        <p className="text-xs text-dash-muted/60">
          Создана {new Date(issue.createdAt).toLocaleDateString('ru-RU')}
        </p>
        <p className="text-xs text-dash-muted/60">
          Обновлена {new Date(issue.updatedAt).toLocaleDateString('ru-RU')}
        </p>
      </div>
    </div>
  );
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-dash-muted mb-1">{label}</p>
      {children}
    </div>
  );
}
