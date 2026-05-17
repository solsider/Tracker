import { useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useIssues, useUpdateIssue } from '../../hooks/useIssues';
import { useSprints } from '../../hooks/useSprints';
import { useColumns } from '../../hooks/useColumns';
import { useDrawerStore } from '../../store/drawer.store';
import { useFiltersStore } from '../../store/filters.store';
import { FilterBar } from '../../components/filters/FilterBar';
import type { Issue, Sprint } from '../../types';

type CalendarView = 'month' | 'week';

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/80 border-red-400',
  HIGH:     'bg-orange-500/80 border-orange-400',
  MEDIUM:   'bg-yellow-500/80 border-yellow-400',
  LOW:      'bg-green-500/80 border-green-400',
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Mon = 0
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getWeekGrid(anchor: Date): Date[] {
  const offset = (anchor.getDay() + 6) % 7;
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function sprintBandsForDay(day: string, sprints: Sprint[]): Sprint[] {
  return sprints.filter((s) => {
    if (!s.startDate || !s.endDate) return false;
    return day >= s.startDate.slice(0, 10) && day <= s.endDate.slice(0, 10);
  });
}

function IssueChip({
  issue,
  projectId,
  onDragStart,
}: {
  issue: Issue;
  projectId: string;
  onDragStart: (id: string) => void;
}) {
  const open = useDrawerStore((s) => s.open);
  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(issue.id); }}
      onClick={(e) => { e.stopPropagation(); open(projectId, issue.number); }}
      className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate cursor-pointer hover:brightness-110 transition-all select-none ${PRIORITY_COLORS[issue.priority]} text-white`}
      title={`#${issue.number} ${issue.title}`}
    >
      #{issue.number} {issue.title}
    </div>
  );
}

function DayCell({
  date,
  issues,
  sprints,
  projectId,
  isCurrentMonth,
  onDragStart,
  onDrop,
}: {
  date: Date;
  issues: Issue[];
  sprints: Sprint[];
  projectId: string;
  isCurrentMonth: boolean;
  onDragStart: (id: string) => void;
  onDrop: (day: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const today = isoDate(new Date());
  const day = isoDate(date);
  const isToday = day === today;
  const isOverdue = issues.some((i) => i.dueDate && i.dueDate.slice(0, 10) === day && day < today);
  const bands = sprintBandsForDay(day, sprints);

  return (
    <div
      className={`min-h-24 border border-dash-border/50 p-1 flex flex-col transition-colors ${
        !isCurrentMonth ? 'bg-dash-bg/30 opacity-40' : 'bg-dash-panel'
      } ${dragOver ? 'ring-1 ring-dash-accent bg-dash-accent/5' : ''} ${
        isToday ? 'ring-1 ring-dash-accent/50' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(day); }}
    >
      {/* Sprint bands */}
      {bands.map((s) => (
        <div
          key={s.id}
          className="text-[9px] px-1 rounded mb-0.5 truncate"
          style={{ backgroundColor: s.status === 'ACTIVE' ? '#3b82f620' : '#6366f120', color: s.status === 'ACTIVE' ? '#60a5fa' : '#a78bfa' }}
          title={s.name}
        >
          {s.name}
        </div>
      ))}

      {/* Date number */}
      <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
        isToday ? 'bg-dash-accent text-white' : isOverdue ? 'text-red-400' : 'text-dash-muted'
      }`}>
        {date.getDate()}
      </div>

      {/* Issue chips */}
      <div className="flex flex-col gap-0.5 overflow-y-auto max-h-24 flex-1">
        {issues.slice(0, 5).map((issue) => (
          <IssueChip
            key={issue.id}
            issue={issue}
            projectId={projectId}
            onDragStart={onDragStart}
          />
        ))}
        {issues.length > 5 && (
          <div className="text-[10px] text-dash-muted px-1">+{issues.length - 5}</div>
        )}
      </div>
    </div>
  );
}

function WeekDayCell({
  date,
  issues,
  sprints,
  projectId,
  onDragStart,
  onDrop,
}: {
  date: Date;
  issues: Issue[];
  sprints: Sprint[];
  projectId: string;
  onDragStart: (id: string) => void;
  onDrop: (day: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const today = isoDate(new Date());
  const day = isoDate(date);
  const isToday = day === today;
  const bands = sprintBandsForDay(day, sprints);

  return (
    <div
      className={`border border-dash-border/50 p-2 flex flex-col gap-1 min-h-40 ${
        isToday ? 'ring-1 ring-dash-accent/50 bg-dash-accent/5' : 'bg-dash-panel'
      } ${dragOver ? 'ring-1 ring-dash-accent' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(day); }}
    >
      {bands.map((s) => (
        <div
          key={s.id}
          className="text-[9px] px-1 py-0.5 rounded truncate"
          style={{ backgroundColor: '#3b82f615', color: '#60a5fa' }}
        >
          🏃 {s.name}
        </div>
      ))}
      {issues.map((issue) => (
        <IssueChip key={issue.id} issue={issue} projectId={projectId} onDragStart={onDragStart} />
      ))}
    </div>
  );
}

export function CalendarPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: issues = [] } = useIssues(projectId!);
  const { data: sprints = [] } = useSprints(projectId!);
  const { data: columns = [] } = useColumns(projectId!);
  const updateIssue = useUpdateIssue(projectId!, 0);
  const { filters } = useFiltersStore();

  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const dragId = useRef<string | null>(null);

  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const days = useMemo(
    () => (view === 'month' ? getMonthGrid(year, month) : getWeekGrid(anchor)),
    [view, year, month, anchor],
  );

  // Client-side filter
  const filteredIssues = useMemo(() => {
    let list = issues;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || String(i.number).includes(q));
    }
    if (filters.priorities.length) list = list.filter((i) => (filters.priorities as string[]).includes(i.priority));
    if (filters.assigneeIds.length) list = list.filter((i) => filters.assigneeIds.includes(i.assigneeId ?? ''));
    if (filters.types.length) list = list.filter((i) => (filters.types as string[]).includes(i.type));
    return list;
  }, [issues, filters]);

  // Map day → issues (by dueDate or startDate)
  const issuesByDay = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of filteredIssues) {
      for (const dateStr of [issue.dueDate, issue.startDate]) {
        if (!dateStr) continue;
        const day = dateStr.slice(0, 10);
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(issue);
      }
    }
    return map;
  }, [filteredIssues]);

  const handleDrop = useCallback(
    (day: string) => {
      if (!dragId.current) return;
      const issue = issues.find((i) => i.id === dragId.current);
      if (!issue || issue.dueDate?.slice(0, 10) === day) return;
      updateIssue.mutate({ dueDate: day } as any);
      dragId.current = null;
    },
    [issues, updateIssue],
  );

  const members = useMemo(() => {
    const seen = new Set<string>();
    return filteredIssues
      .filter((i) => i.assignee && !seen.has(i.assigneeId!) && seen.add(i.assigneeId!))
      .map((i) => ({ id: i.assigneeId!, name: i.assignee!.name }));
  }, [filteredIssues]);

  const navigatePrev = () => {
    if (view === 'month') setAnchor(new Date(year, month - 1, 1));
    else {
      const d = new Date(anchor);
      d.setDate(d.getDate() - 7);
      setAnchor(d);
    }
  };

  const navigateNext = () => {
    if (view === 'month') setAnchor(new Date(year, month + 1, 1));
    else {
      const d = new Date(anchor);
      d.setDate(d.getDate() + 7);
      setAnchor(d);
    }
  };

  const periodLabel =
    view === 'month'
      ? anchor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      : (() => {
          const week = getWeekGrid(anchor);
          const from = week[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
          const to = week[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
          return `${from} — ${to}`;
        })();

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dash-text">Календарь</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-dash-border">
            {(['month', 'week'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v ? 'bg-dash-accent text-white' : 'bg-dash-panel text-dash-muted hover:text-dash-text'
                }`}
              >
                {v === 'month' ? 'Месяц' : 'Неделя'}
              </button>
            ))}
          </div>
          <button onClick={navigatePrev} className="p-1.5 rounded-lg border border-dash-border text-dash-muted hover:text-dash-text hover:border-dash-accent/40 transition-colors">
            ‹
          </button>
          <span className="text-sm font-medium text-dash-text min-w-36 text-center capitalize">{periodLabel}</span>
          <button onClick={navigateNext} className="p-1.5 rounded-lg border border-dash-border text-dash-muted hover:text-dash-text hover:border-dash-accent/40 transition-colors">
            ›
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="px-3 py-1.5 text-xs font-medium bg-dash-panel border border-dash-border rounded-lg text-dash-muted hover:text-dash-text transition-colors"
          >
            Сегодня
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        projectId={projectId!}
        columns={columns}
        sprints={sprints}
        members={members}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-dash-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Критический
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Высокий
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Средний
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Низкий
        </span>
        <span className="ml-auto text-dash-muted/60">Перетащите задачу на дату чтобы изменить срок</span>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-dash-border">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-dash-border">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-xs font-semibold text-dash-muted text-center py-2 bg-dash-panel">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        {view === 'month' ? (
          <div className="grid grid-cols-7 flex-1 overflow-auto">
            {days.map((date) => {
              const day = isoDate(date);
              return (
                <DayCell
                  key={day}
                  date={date}
                  issues={issuesByDay.get(day) ?? []}
                  sprints={sprints}
                  projectId={projectId!}
                  isCurrentMonth={date.getMonth() === month}
                  onDragStart={(id) => { dragId.current = id; }}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 flex-1 overflow-auto">
            {/* Week header with full date */}
            {days.map((date) => {
              const day = isoDate(date);
              const isToday = day === isoDate(new Date());
              return (
                <div key={`h-${day}`} className={`text-xs font-medium py-2 text-center border-b border-dash-border ${isToday ? 'text-dash-accent' : 'text-dash-muted'}`}>
                  {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              );
            })}
            {days.map((date) => {
              const day = isoDate(date);
              return (
                <WeekDayCell
                  key={day}
                  date={date}
                  issues={issuesByDay.get(day) ?? []}
                  sprints={sprints}
                  projectId={projectId!}
                  onDragStart={(id) => { dragId.current = id; }}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
