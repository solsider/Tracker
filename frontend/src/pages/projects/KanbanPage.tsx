import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIssues } from '../../hooks/useIssues';
import { useColumns } from '../../hooks/useColumns';
import { useSprints } from '../../hooks/useSprints';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import { useProjectRealtime } from '../../hooks/useRealtime';

export function KanbanPage() {
  const { id: projectId } = useParams<{ id: string }>();
  useProjectRealtime(projectId);
  const { data: columns, isLoading: columnsLoading } = useColumns(projectId!);
  const { data: issues, isLoading: issuesLoading } = useIssues(projectId!);
  const { data: sprints = [] } = useSprints(projectId!);

  const [sprintFilter, setSprintFilter] = useState<'all' | 'active'>('all');

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');

  const filteredIssues =
    sprintFilter === 'active' && activeSprint
      ? (issues ?? []).filter((i) => i.sprintId === activeSprint.id)
      : (issues ?? []);

  if (columnsLoading || issuesLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="h-7 w-24 bg-dash-border/60 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col w-72 shrink-0 animate-pulse">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-3 h-3 rounded-full bg-dash-border/60" />
                <div className="h-4 w-20 bg-dash-border/60 rounded" />
                <div className="h-4 w-6 bg-dash-border/40 rounded-full ml-auto" />
              </div>
              <div className="flex flex-col flex-1 rounded-xl p-2 bg-dash-bg/40 border-t-4 border-dash-border/40 gap-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-dash-panel rounded-lg border border-dash-border p-3 space-y-2">
                    <div className="h-3.5 w-5/6 bg-dash-border/60 rounded" />
                    <div className="h-3 w-3/4 bg-dash-border/40 rounded" />
                    <div className="flex justify-between mt-1">
                      <div className="h-3 w-10 bg-dash-border/40 rounded" />
                      <div className="w-6 h-6 rounded-full bg-dash-border/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-dash-text">Доска</h1>
        {activeSprint && (
          <div className="flex items-center gap-1 bg-dash-bg border border-dash-border rounded-lg p-0.5">
            <button
              onClick={() => setSprintFilter('all')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                sprintFilter === 'all'
                  ? 'bg-dash-panel text-dash-text shadow-sm'
                  : 'text-dash-muted hover:text-dash-text'
              }`}
            >
              Все задачи
            </button>
            <button
              onClick={() => setSprintFilter('active')}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                sprintFilter === 'active'
                  ? 'bg-dash-panel text-dash-text shadow-sm'
                  : 'text-dash-muted hover:text-dash-text'
              }`}
            >
              {activeSprint.name}
            </button>
          </div>
        )}
      </div>

      {activeSprint && sprintFilter === 'active' && (
        <div className="flex items-center gap-3 mb-4 px-1 text-xs text-dash-muted shrink-0">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400">{activeSprint.name}</span>
          {activeSprint.goal && <span>· {activeSprint.goal}</span>}
          {activeSprint.endDate && (
            <span>
              · до{' '}
              {new Date(activeSprint.endDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
          <span>· {filteredIssues.length} задач</span>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          projectId={projectId!}
          columns={columns ?? []}
          issues={filteredIssues}
        />
      </div>
    </div>
  );
}
