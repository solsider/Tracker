import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useIssues } from '../../hooks/useIssues';
import { useSprints } from '../../hooks/useSprints';
import { useColumns } from '../../hooks/useColumns';
import type { Issue, Sprint, IssuePriority } from '../../types';

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e',
};

// ── Velocity chart (bar chart, CSS) ──────────────────────────────────────────

function VelocityChart({ sprints, issues }: { sprints: Sprint[]; issues: Issue[] }) {
  const completed = [...sprints]
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (!completed.length) {
    return <div className="text-center py-8 text-dash-muted text-sm">Нет завершённых спринтов</div>;
  }

  const velocities = completed.map((s) => ({
    name: s.name,
    sp: issues.filter((i) => i.sprintId === s.id).reduce((acc, i) => acc + (i.storyPoints ?? 0), 0),
  }));
  const max = Math.max(...velocities.map((v) => v.sp), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {velocities.map((v) => (
        <div key={v.name} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-dash-accent font-semibold">{v.sp}</span>
          <div
            className="w-full bg-dash-accent/70 rounded-t transition-all hover:bg-dash-accent"
            style={{ height: `${Math.max((v.sp / max) * 100, 4)}%` }}
            title={`${v.name}: ${v.sp}SP`}
          />
          <span className="text-[9px] text-dash-muted text-center leading-tight truncate w-full">{v.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Cumulative Flow Diagram (CFD, simplified using SVG area chart) ─────────────

function CumulativeFlowChart({ issues, columns }: { issues: Issue[]; columns: { id: string; title: string; color: string }[] }) {
  if (!issues.length || !columns.length) {
    return <div className="text-center py-8 text-dash-muted text-sm">Нет данных</div>;
  }

  const W = 400;
  const H = 120;

  // Simplified: show current column distribution as stacked bars
  const colData = columns.map((c) => ({
    ...c,
    count: issues.filter((i) => i.columnId === c.id).length,
  })).filter((c) => c.count > 0);

  const total = colData.reduce((s, c) => s + c.count, 0);
  let accumulatedY = 0;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {colData.map((c) => {
          const h = Math.round((c.count / total) * H);
          const y = accumulatedY;
          accumulatedY += h;
          return (
            <rect
              key={c.id}
              x={0}
              y={y}
              width={W}
              height={h}
              fill={c.color}
              fillOpacity={0.6}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2">
        {colData.map((c) => (
          <div key={c.id} className="flex items-center gap-1 text-xs text-dash-muted">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />
            {c.title}: {c.count}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Issue trend chart (SVG line chart by createdAt week) ─────────────────────

function IssueTrendChart({ issues }: { issues: Issue[] }) {
  const weekData = useMemo(() => {
    if (!issues.length) return [];
    const sorted = [...issues].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const firstDate = new Date(sorted[0].createdAt);
    const lastDate = new Date(sorted[sorted.length - 1].createdAt);
    const weeks: { label: string; created: number; closed: number }[] = [];

    let current = new Date(firstDate);
    current.setDate(current.getDate() - current.getDay() + 1); // start of week
    const maxWeeks = 12;

    while (current <= lastDate && weeks.length < maxWeeks) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const label = weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      const created = issues.filter((i) => {
        const d = new Date(i.createdAt);
        return d >= weekStart && d <= weekEnd;
      }).length;

      weeks.push({ label, created, closed: 0 });
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }, [issues]);

  if (!weekData.length) {
    return <div className="text-center py-8 text-dash-muted text-sm">Нет данных</div>;
  }

  const W = 400;
  const H = 100;
  const maxCreated = Math.max(...weekData.map((d) => d.created), 1);

  const points = weekData
    .map((d, i) => {
      const x = (i / Math.max(weekData.length - 1, 1)) * W;
      const y = H - (d.created / maxCreated) * (H - 10);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${points} ${W},${H}`}
          fill="url(#trendGrad)"
        />
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth={2} />
        {weekData.map((d, i) => {
          const x = (i / Math.max(weekData.length - 1, 1)) * W;
          const y = H - (d.created / maxCreated) * (H - 10);
          return <circle key={i} cx={x} cy={y} r={3} fill="#3b82f6" />;
        })}
      </svg>
      <div className="flex justify-between text-[9px] text-dash-muted mt-1">
        {weekData.slice(0, 3).map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  );
}

// ── Sprint completion rate ────────────────────────────────────────────────────

function SprintCompletionTable({ sprints, issues }: { sprints: Sprint[]; issues: Issue[] }) {
  const completed = [...sprints]
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  if (!completed.length) {
    return <div className="text-center py-8 text-dash-muted text-sm">Нет завершённых спринтов</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-dash-border">
            <th className="text-left py-2 px-3 text-dash-muted font-semibold">Спринт</th>
            <th className="text-right py-2 px-3 text-dash-muted font-semibold">Задач</th>
            <th className="text-right py-2 px-3 text-dash-muted font-semibold">SP</th>
            <th className="text-right py-2 px-3 text-dash-muted font-semibold">Период</th>
            <th className="py-2 px-3 text-dash-muted font-semibold">Прогресс</th>
          </tr>
        </thead>
        <tbody>
          {completed.map((s) => {
            const sprintIssues = issues.filter((i) => i.sprintId === s.id);
            const sp = sprintIssues.reduce((acc, i) => acc + (i.storyPoints ?? 0), 0);
            const start = s.startDate ? new Date(s.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';
            const end = s.completedAt ? new Date(s.completedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';
            return (
              <tr key={s.id} className="border-b border-dash-border/40 hover:bg-dash-accent/5 transition-colors">
                <td className="py-2 px-3 text-dash-text font-medium">{s.name}</td>
                <td className="py-2 px-3 text-right text-dash-muted">{sprintIssues.length}</td>
                <td className="py-2 px-3 text-right text-blue-400 font-mono">{sp}</td>
                <td className="py-2 px-3 text-right text-dash-muted whitespace-nowrap">{start} — {end}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-dash-border rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-green-400 shrink-0">✓</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Priority distribution ─────────────────────────────────────────────────────

function PriorityBreakdown({ issues }: { issues: Issue[] }) {
  const total = issues.length;
  if (!total) return null;

  const data = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]).map((p) => {
    const count = issues.filter((i) => i.priority === p).length;
    return { p, count, pct: Math.round((count / total) * 100) };
  });

  return (
    <div className="space-y-2">
      {data.map(({ p, count, pct }) => (
        <div key={p} className="flex items-center gap-2">
          <span className="text-xs text-dash-muted w-24 shrink-0">
            {{ CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' }[p]}
          </span>
          <div className="flex-1 bg-dash-border rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PRIORITY_COLORS[p] }} />
          </div>
          <span className="text-xs text-dash-muted w-16 text-right shrink-0">{count} ({pct}%)</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: issues = [], isLoading } = useIssues(projectId!);
  const { data: sprints = [] } = useSprints(projectId!);
  const { data: columns = [] } = useColumns(projectId!);

  const totalSP = issues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
  const avgSP = issues.length ? (totalSP / issues.length).toFixed(1) : '0';
  const withSP = issues.filter((i) => i.storyPoints != null).length;
  const completedSprints = sprints.filter((s) => s.status === 'COMPLETED').length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-dash-panel rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dash-text">Аналитика</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего задач', value: issues.length, color: '' },
          { label: 'Завершено спринтов', value: completedSprints, color: 'text-green-400' },
          { label: 'Суммарные SP', value: totalSP, color: 'text-blue-400' },
          { label: 'Ср. SP / задача', value: avgSP, color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-dash-panel border border-dash-border rounded-xl p-4">
            <p className="text-xs text-dash-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color || 'text-dash-text'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Velocity */}
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-sm font-semibold text-dash-text mb-4">Скорость (SP/спринт)</p>
          <VelocityChart sprints={sprints} issues={issues} />
        </div>

        {/* Issue trend */}
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-sm font-semibold text-dash-text mb-4">Динамика создания задач (по неделям)</p>
          <IssueTrendChart issues={issues} />
        </div>

        {/* CFD */}
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-sm font-semibold text-dash-text mb-4">Распределение по статусам</p>
          <CumulativeFlowChart issues={issues} columns={columns} />
        </div>

        {/* Priority breakdown */}
        <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
          <p className="text-sm font-semibold text-dash-text mb-4">Распределение по приоритету</p>
          <PriorityBreakdown issues={issues} />
          <p className="text-xs text-dash-muted mt-3 text-right">{withSP} из {issues.length} задач с оценкой SP</p>
        </div>
      </div>

      {/* Sprint completion table */}
      <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
        <p className="text-sm font-semibold text-dash-text mb-4">История спринтов</p>
        <SprintCompletionTable sprints={sprints} issues={issues} />
      </div>
    </div>
  );
}
