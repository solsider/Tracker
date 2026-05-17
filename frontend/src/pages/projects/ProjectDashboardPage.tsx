import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIssues } from '../../hooks/useIssues';
import { useSprints } from '../../hooks/useSprints';
import { useColumns } from '../../hooks/useColumns';
import { useProject } from '../../hooks/useProjects';
import { useDrawerStore } from '../../store/drawer.store';
import type { Issue, IssuePriority } from '../../types';

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e',
};
const PRIORITY_LABELS: Record<IssuePriority, string> = {
  CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий',
};

// ── Mini bar chart (pure CSS) ─────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-xs text-dash-muted w-24 shrink-0 truncate">{d.label}</span>
          <div className="flex-1 bg-dash-border rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
          <span className="text-xs text-dash-muted w-8 text-right shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Burndown chart (SVG) ──────────────────────────────────────────────────────

function BurndownChart({ sprint, issues }: { sprint: { startDate: string | null; endDate: string | null; id: string }; issues: Issue[] }) {
  const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
  const totalSP = sprintIssues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);

  if (!sprint.startDate || !sprint.endDate || totalSP === 0) {
    return <div className="text-xs text-dash-muted text-center py-8">Нет данных для графика сгорания</div>;
  }

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const days = Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000), 1);
  const today = new Date();
  const elapsed = Math.min(Math.max(0, Math.ceil((today.getTime() - start.getTime()) / 86400000)), days);

  // Ideal line: totalSP → 0 over all sprint days
  const W = 400;
  const H = 120;

  // Actual: flat line to today at current remaining SP
  const doneSP = sprintIssues
    .filter((i) => i.column.title.toLowerCase().includes('done') || i.column.title.toLowerCase().includes('закрыт'))
    .reduce((s, i) => s + (i.storyPoints ?? 0), 0);
  const remaining = totalSP - doneSP;
  const actualX = Math.round((elapsed / days) * W);
  const actualY = Math.round((remaining / totalSP) * H);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        {/* Ideal line */}
        <line x1={0} y1={0} x2={W} y2={H} stroke="#6366f140" strokeWidth={1.5} strokeDasharray="4 4" />
        {/* Actual line */}
        <polyline
          points={`0,0 ${actualX},${actualY}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        <circle cx={actualX} cy={actualY} r={4} fill="#3b82f6" />
      </svg>
      <div className="flex justify-between text-xs text-dash-muted mt-1">
        <span>{new Date(sprint.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
        <span className="text-blue-400">{remaining}SP осталось</span>
        <span>{new Date(sprint.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}

// ── Donut-like distribution (CSS pie segments) ────────────────────────────────

function DistributionBars({ title, data }: {
  title: string;
  data: { label: string; count: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return null;
  return (
    <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
      <p className="text-sm font-semibold text-dash-text mb-3">{title}</p>
      <BarChart data={data.map((d) => ({ label: d.label, value: d.count, color: d.color }))} />
      <p className="text-xs text-dash-muted mt-2 text-right">Всего: {total}</p>
    </div>
  );
}

// ── Recent Activity ───────────────────────────────────────────────────────────

function RecentIssues({ issues, projectId }: { issues: Issue[]; projectId: string }) {
  const open = useDrawerStore((s) => s.open);
  const recent = [...issues]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  return (
    <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
      <p className="text-sm font-semibold text-dash-text mb-3">Недавняя активность</p>
      <div className="space-y-1">
        {recent.map((issue) => (
          <div
            key={issue.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dash-border/50 cursor-pointer transition-colors group"
            onClick={() => open(projectId, issue.number)}
          >
            <span className="text-xs font-mono text-dash-muted w-8 shrink-0">#{issue.number}</span>
            <span className="flex-1 text-sm text-dash-text truncate group-hover:text-white">{issue.title}</span>
            <span className="text-xs text-dash-muted shrink-0">
              {new Date(issue.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Workload summary ──────────────────────────────────────────────────────────

function WorkloadWidget({ issues }: { issues: Issue[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const members = useMemo(() => {
    const map: Record<string, { name: string; count: number; sp: number; overdue: number }> = {};
    for (const i of issues) {
      if (!i.assignee) continue;
      const id = i.assigneeId!;
      if (!map[id]) map[id] = { name: i.assignee.name, count: 0, sp: 0, overdue: 0 };
      map[id].count++;
      map[id].sp += i.storyPoints ?? 0;
      if (i.dueDate && i.dueDate.slice(0, 10) < today) map[id].overdue++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [issues, today]);

  if (!members.length) return null;

  return (
    <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
      <p className="text-sm font-semibold text-dash-text mb-3">Нагрузка команды</p>
      <div className="space-y-2">
        {members.slice(0, 8).map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-dash-accent/20 flex items-center justify-center text-[10px] font-semibold text-dash-accent shrink-0">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-dash-text w-28 truncate shrink-0">{m.name}</span>
            <div className="flex-1 flex items-center gap-1">
              <div className="flex-1 bg-dash-border rounded h-1.5 overflow-hidden">
                <div className="h-full bg-dash-accent/60 rounded" style={{ width: `${Math.min((m.count / (members[0]?.count ?? 1)) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-dash-muted w-8 text-right shrink-0">{m.count}</span>
            </div>
            {m.sp > 0 && <span className="text-xs text-blue-400 w-12 text-right shrink-0">{m.sp}SP</span>}
            {m.overdue > 0 && <span className="text-xs text-red-400 shrink-0">⚠{m.overdue}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProjectDashboardPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: issues = [], isLoading } = useIssues(projectId!);
  const { data: sprints = [] } = useSprints(projectId!);
  const { data: columns = [] } = useColumns(projectId!);
  const { data: project } = useProject(projectId!);

  const today = new Date().toISOString().slice(0, 10);
  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');

  const stats = useMemo(() => {
    const total = issues.length;
    const overdue = issues.filter((i) => i.dueDate && i.dueDate.slice(0, 10) < today).length;
    const noAssignee = issues.filter((i) => !i.assigneeId).length;
    const totalSP = issues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
    return { total, overdue, noAssignee, totalSP };
  }, [issues, today]);

  const priorityDist = useMemo(() =>
    (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]).map((p) => ({
      label: PRIORITY_LABELS[p],
      count: issues.filter((i) => i.priority === p).length,
      color: PRIORITY_COLORS[p],
    })),
  [issues]);

  const statusDist = useMemo(() =>
    columns.map((c) => ({
      label: c.title,
      count: issues.filter((i) => i.columnId === c.id).length,
      color: c.color,
    })).filter((d) => d.count > 0),
  [issues, columns]);

  const typeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((i) => { counts[i.type] = (counts[i.type] ?? 0) + 1; });
    const TYPE_COLORS: Record<string, string> = { TASK: '#3b82f6', BUG: '#ef4444', STORY: '#a78bfa', EPIC: '#f97316' };
    const TYPE_LBL: Record<string, string> = { TASK: 'Задача', BUG: 'Баг', STORY: 'История', EPIC: 'Эпик' };
    return Object.entries(counts).map(([k, v]) => ({ label: TYPE_LBL[k] ?? k, count: v, color: TYPE_COLORS[k] ?? '#64748b' }));
  }, [issues]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-dash-panel rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Дашборд проекта</h1>
          {project && <p className="text-sm text-dash-muted mt-0.5">{project.name}</p>}
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${projectId}/issues`} className="text-xs px-3 py-1.5 bg-dash-panel border border-dash-border rounded-lg text-dash-muted hover:text-dash-text hover:border-dash-accent/40 transition-colors">
            Все задачи →
          </Link>
          <Link to={`/projects/${projectId}/velocity`} className="text-xs px-3 py-1.5 bg-dash-panel border border-dash-border rounded-lg text-dash-muted hover:text-dash-text hover:border-dash-accent/40 transition-colors">
            Аналитика →
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-xs text-dash-muted mb-1">Всего задач</p>
          <p className="text-2xl font-bold text-dash-text">{stats.total}</p>
        </div>
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-xs text-dash-muted mb-1">Просрочено</p>
          <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-dash-text'}`}>{stats.overdue}</p>
        </div>
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-xs text-dash-muted mb-1">Без исполнителя</p>
          <p className="text-2xl font-bold text-dash-text">{stats.noAssignee}</p>
        </div>
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-xs text-dash-muted mb-1">Story Points</p>
          <p className="text-2xl font-bold text-blue-400">{stats.totalSP}</p>
        </div>
      </div>

      {/* Active sprint burndown */}
      {activeSprint && (
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-dash-text">Сгорание спринта — {activeSprint.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Активный</span>
          </div>
          <BurndownChart sprint={activeSprint} issues={issues} />
        </div>
      )}

      {/* 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DistributionBars title="По приоритету" data={priorityDist} />
        <DistributionBars title="По статусу" data={statusDist} />
        <DistributionBars title="По типу" data={typeDist} />
      </div>

      {/* Workload + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WorkloadWidget issues={issues} />
        <RecentIssues issues={issues} projectId={projectId!} />
      </div>
    </div>
  );
}
