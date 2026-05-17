import { useParams } from 'react-router-dom';
import { useSprints } from '../../hooks/useSprints';
import { useIssues } from '../../hooks/useIssues';
import type { Sprint } from '../../types';

export function VelocityPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: sprints = [] } = useSprints(projectId!);
  const { data: allIssues = [] } = useIssues(projectId!);

  const completedSprints = [...sprints]
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getSprintSP = (sprint: Sprint) =>
    allIssues
      .filter((i) => i.sprintId === sprint.id)
      .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  const sprintVelocities = completedSprints.map((s) => ({ sprint: s, sp: getSprintSP(s) }));

  const avgVelocity =
    sprintVelocities.length > 0
      ? Math.round(
          sprintVelocities.reduce((sum, v) => sum + v.sp, 0) / sprintVelocities.length,
        )
      : 0;

  const last3Avg =
    sprintVelocities.length > 0
      ? Math.round(
          sprintVelocities
            .slice(-3)
            .reduce((sum, v) => sum + v.sp, 0) / Math.min(3, sprintVelocities.length),
        )
      : 0;

  const maxSP = Math.max(...sprintVelocities.map((v) => v.sp), 1);

  // Workload — group open issues by assignee
  const memberMap: Record<string, { user: NonNullable<typeof allIssues[0]['assignee']>; count: number; sp: number; overdue: number; priorities: Record<string, number> }> = {};

  for (const issue of allIssues) {
    if (!issue.assignee) continue;
    const uid = issue.assignee.id;
    if (!memberMap[uid]) {
      memberMap[uid] = { user: issue.assignee, count: 0, sp: 0, overdue: 0, priorities: {} };
    }
    memberMap[uid].count++;
    memberMap[uid].sp += issue.storyPoints ?? 0;
    if (issue.dueDate && new Date(issue.dueDate) < new Date()) {
      memberMap[uid].overdue++;
    }
    memberMap[uid].priorities[issue.priority] = (memberMap[uid].priorities[issue.priority] ?? 0) + 1;
  }

  const workload = Object.values(memberMap).sort((a, b) => b.count - a.count);

  const priorityConfig: { key: string; color: string }[] = [
    { key: 'CRITICAL', color: 'bg-red-500' },
    { key: 'HIGH', color: 'bg-orange-400' },
    { key: 'MEDIUM', color: 'bg-yellow-400' },
    { key: 'LOW', color: 'bg-green-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dash-text">Скорость и нагрузка</h1>

      {/* Velocity chart */}
      <div className="bg-dash-panel border border-dash-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-dash-text">Скорость команды</h2>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-dash-muted">Средняя: </span>
              <span className="text-dash-text font-semibold">{avgVelocity} SP</span>
            </div>
            <div>
              <span className="text-dash-muted">Последние 3 спринта: </span>
              <span className="text-dash-accent font-semibold">{last3Avg} SP</span>
            </div>
          </div>
        </div>

        {sprintVelocities.length === 0 ? (
          <div className="text-center py-10 text-dash-muted">
            <p className="text-sm">Нет завершённых спринтов</p>
            <p className="text-xs mt-1 text-dash-muted/60">
              Данные появятся после завершения первого спринта
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sprintVelocities.map(({ sprint, sp }) => (
              <div key={sprint.id} className="flex items-center gap-3">
                <div className="w-32 text-xs text-dash-muted truncate shrink-0">{sprint.name}</div>
                <div className="flex-1 h-5 bg-dash-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dash-accent/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max((sp / maxSP) * 100, sp > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-dash-text w-14 text-right shrink-0">
                  {sp > 0 ? `${sp} SP` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sprint summary table */}
      {sprintVelocities.length > 0 && (
        <div className="bg-dash-panel border border-dash-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-dash-text mb-4">Статистика спринтов</h2>
          <div className="space-y-2">
            <div className="grid grid-cols-4 text-xs text-dash-muted pb-2 border-b border-dash-border">
              <span>Спринт</span>
              <span>Период</span>
              <span className="text-right">Задачи</span>
              <span className="text-right">SP</span>
            </div>
            {sprintVelocities.map(({ sprint, sp }) => {
              const issueCount = allIssues.filter((i) => i.sprintId === sprint.id).length;
              const s = sprint.startDate
                ? new Date(sprint.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                : '—';
              const e = sprint.endDate
                ? new Date(sprint.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                : '—';
              return (
                <div key={sprint.id} className="grid grid-cols-4 text-xs py-1.5 border-b border-dash-border/50 last:border-0">
                  <span className="text-dash-text truncate">{sprint.name}</span>
                  <span className="text-dash-muted">{s} — {e}</span>
                  <span className="text-dash-muted text-right">{issueCount}</span>
                  <span className={`font-medium text-right ${sp > 0 ? 'text-dash-accent' : 'text-dash-muted'}`}>{sp > 0 ? sp : '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workload */}
      <div className="bg-dash-panel border border-dash-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-dash-text mb-4">Нагрузка команды</h2>

        {workload.length === 0 ? (
          <div className="text-center py-10 text-dash-muted">
            <p className="text-sm">Нет назначенных задач</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workload.map(({ user, count, sp, overdue, priorities }) => (
              <div key={user.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-dash-border flex items-center justify-center text-sm text-dash-muted font-semibold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dash-text font-medium">{user.name}</span>
                    {overdue > 0 && (
                      <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-medium">
                        {overdue} просроч.
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dash-muted">
                    {count} задач{count % 10 === 1 && count !== 11 ? 'а' : count % 10 >= 2 && count % 10 <= 4 && (count < 10 || count > 20) ? 'и' : ''}
                    {sp > 0 && ` · ${sp} SP`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {priorityConfig.map(({ key, color }) => {
                    const n = priorities[key] ?? 0;
                    if (!n) return null;
                    return (
                      <div
                        key={key}
                        title={`${key}: ${n}`}
                        className={`w-6 h-6 rounded text-[10px] flex items-center justify-center text-white font-bold ${color}`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
