import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIssues } from '../../hooks/useIssues';
import { useColumns } from '../../hooks/useColumns';
import { useDrawerStore } from '../../store/drawer.store';
import { issuesApi } from '../../api/issues.api';
import type { Issue, IssueType, UpdateIssueDto } from '../../types';

// ─── Constants ───────────────────────────────────────────────────────────────
const DAY_PX = 28;
const TOTAL_DAYS = 90;
const LABEL_W = 240;
const ROW_H = 40;
const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const TYPE_LABELS: Record<IssueType, string> = {
  TASK: 'Задача', BUG: 'Баг', STORY: 'История', EPIC: 'Эпик',
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function fmtShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}
function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DragRef = {
  issueId: string;
  issueNumber: number;
  type: 'start' | 'end' | 'move';
  initX: number;
  origStart: Date;
  origEnd: Date | null;
};

type LocalDate = { start: Date; end: Date | null };

// ─── Component ────────────────────────────────────────────────────────────────
export function GanttPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: issues } = useIssues(projectId!);
  const { data: columns } = useColumns(projectId!);
  const openDrawer = useDrawerStore((s) => s.open);
  const qc = useQueryClient();

  const today = useRef((() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()).current;
  const viewStart = useRef(addDays(today, -14)).current;

  const [typeFilter, setTypeFilter] = useState<IssueType | null>(null);
  const [localDates, setLocalDates] = useState<Record<string, LocalDate>>({});
  const localDatesRef = useRef<Record<string, LocalDate>>({});
  const drag = useRef<DragRef | null>(null);

  useEffect(() => { localDatesRef.current = localDates; }, [localDates]);

  const updateMutation = useMutation({
    mutationFn: ({ number, data }: { number: number; data: UpdateIssueDto }) =>
      issuesApi.update(projectId!, number, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
      setLocalDates({});
    },
  });
  const updateRef = useRef(updateMutation.mutate);
  useEffect(() => { updateRef.current = updateMutation.mutate; });

  // Global drag handlers (attached once, read from refs)
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return;
      const { issueId, type, initX, origStart, origEnd } = drag.current;
      const delta = Math.round((e.clientX - initX) / DAY_PX);

      setLocalDates(prev => {
        const next = { ...prev };
        if (type === 'start') {
          const ns = addDays(origStart, delta);
          next[issueId] = { start: ns, end: origEnd && origEnd > ns ? origEnd : (origEnd ? addDays(ns, 1) : origEnd) };
        } else if (type === 'end') {
          const ne = addDays(origEnd ?? origStart, delta);
          next[issueId] = { start: origStart, end: ne > origStart ? ne : addDays(origStart, 1) };
        } else {
          next[issueId] = { start: addDays(origStart, delta), end: origEnd ? addDays(origEnd, delta) : null };
        }
        return next;
      });
    }

    function onUp() {
      if (!drag.current) return;
      const { issueId, issueNumber } = drag.current;
      const dates = localDatesRef.current[issueId];
      if (dates) {
        updateRef.current({
          number: issueNumber,
          data: {
            startDate: toISO(dates.start),
            dueDate: dates.end ? toISO(dates.end) : null,
          },
        });
      }
      drag.current = null;
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  function getEffective(issue: Issue): LocalDate {
    if (localDates[issue.id]) return localDates[issue.id];
    return {
      start: new Date(issue.startDate ?? issue.createdAt),
      end: issue.dueDate ? new Date(issue.dueDate) : null,
    };
  }

  function startDrag(e: React.PointerEvent, issue: Issue, type: DragRef['type']) {
    e.stopPropagation();
    const { start, end } = getEffective(issue);
    drag.current = { issueId: issue.id, issueNumber: issue.number, type, initX: e.clientX, origStart: start, origEnd: end };
  }

  // Build week markers for the header
  const weekMarkers: { day: number; label: string }[] = [];
  for (let d = 0; d < TOTAL_DAYS; d++) {
    const date = addDays(viewStart, d);
    if (d === 0 || date.getDay() === 1) {
      weekMarkers.push({ day: d, label: fmtShort(date) });
    }
  }

  const todayOffset = daysBetween(viewStart, today);

  const filtered = (issues ?? []).filter(i => !typeFilter || i.type === typeFilter);

  const grouped = (columns ?? [])
    .map(col => ({ col, issues: filtered.filter(i => i.columnId === col.id) }))
    .filter(g => g.issues.length > 0);

  const noDateIssues = filtered.filter(i => !i.startDate && !i.dueDate);
  const totalW = LABEL_W + TOTAL_DAYS * DAY_PX;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap shrink-0">
        <h1 className="text-xl font-bold text-dash-text">Диаграмма Ганта</h1>
        <div className="flex gap-1 ml-2">
          <TypeBtn active={!typeFilter} onClick={() => setTypeFilter(null)}>Все</TypeBtn>
          {(Object.keys(TYPE_LABELS) as IssueType[]).map(t => (
            <TypeBtn key={t} active={typeFilter === t} onClick={() => setTypeFilter(typeFilter === t ? null : t)}>
              {TYPE_LABELS[t]}
            </TypeBtn>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto border border-dash-border rounded-card bg-dash-panel">
        <div style={{ width: totalW, minWidth: totalW }}>

          {/* Sticky header */}
          <div className="flex sticky top-0 z-20 bg-dash-panel border-b border-dash-border" style={{ height: 36 }}>
            <div className="shrink-0 flex items-center px-3 text-xs font-semibold text-dash-muted border-r border-dash-border"
              style={{ width: LABEL_W }}>
              Задача
            </div>
            <div className="relative flex-1" style={{ width: TOTAL_DAYS * DAY_PX }}>
              {weekMarkers.map((w) => (
                <div key={w.day} className="absolute top-0 bottom-0 border-l border-dash-border/50 flex items-center pl-1"
                  style={{ left: w.day * DAY_PX }}>
                  <span className="text-xs text-dash-muted whitespace-nowrap">{w.label}</span>
                </div>
              ))}
              {/* Today marker in header */}
              {todayOffset >= 0 && todayOffset <= TOTAL_DAYS && (
                <div className="absolute top-0 bottom-0 w-px bg-red-500/60" style={{ left: todayOffset * DAY_PX }} />
              )}
            </div>
          </div>

          {/* Groups */}
          {grouped.length === 0 && noDateIssues.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-dash-muted text-sm">
              Нет задач для отображения
            </div>
          ) : (
            <>
              {grouped.map(({ col, issues: grpIssues }) => (
                <div key={col.id}>
                  {/* Group header */}
                  <div className="flex items-center border-b border-dash-border bg-dash-bg/60" style={{ height: 28 }}>
                    <div className="flex items-center gap-2 px-3" style={{ width: LABEL_W }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                      <span className="text-xs font-semibold text-dash-muted uppercase tracking-wide">{col.title}</span>
                    </div>
                    <div style={{ width: TOTAL_DAYS * DAY_PX }} />
                  </div>

                  {/* Issue rows */}
                  {grpIssues.map(issue => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      col={col}
                      effective={getEffective(issue)}
                      viewStart={viewStart}
                      todayOffset={todayOffset}
                      onStartDrag={startDrag}
                      onOpenDrawer={(number) => openDrawer(projectId!, number)}
                    />
                  ))}
                </div>
              ))}

              {/* Issues without dates */}
              {noDateIssues.length > 0 && (
                <div>
                  <div className="flex items-center border-b border-dash-border bg-dash-bg/60" style={{ height: 28 }}>
                    <div className="flex items-center gap-2 px-3" style={{ width: LABEL_W }}>
                      <div className="w-2 h-2 rounded-full bg-dash-muted shrink-0" />
                      <span className="text-xs font-semibold text-dash-muted uppercase tracking-wide">Без дат</span>
                    </div>
                    <div style={{ width: TOTAL_DAYS * DAY_PX }} />
                  </div>
                  {noDateIssues.map(issue => (
                    <div key={issue.id} className="flex border-b border-dash-border/40 hover:bg-dash-border/10" style={{ height: ROW_H }}>
                      <div className="flex items-center gap-2 px-3 border-r border-dash-border" style={{ width: LABEL_W }}>
                        <span className="text-xs text-dash-muted font-mono w-8">#{issue.number}</span>
                        <button onClick={() => openDrawer(projectId!, issue.number)} className="text-xs text-dash-muted hover:text-dash-accent truncate flex-1 text-left">{issue.title}</button>
                      </div>
                      <div className="flex items-center px-3" style={{ width: TOTAL_DAYS * DAY_PX }}>
                        <span className="text-xs text-dash-muted/50 italic">нет дат — задайте в редакторе</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-dash-muted shrink-0">
        Перетащите края полосы для изменения дат. Начало отсчёта — {fmtShort(viewStart)}.
      </p>
    </div>
  );
}

// ─── IssueRow ─────────────────────────────────────────────────────────────────
function IssueRow({
  issue, col, effective, viewStart, todayOffset, onStartDrag, onOpenDrawer,
}: {
  issue: Issue;
  col: { color: string };
  effective: LocalDate;
  viewStart: Date;
  todayOffset: number;
  onStartDrag: (e: React.PointerEvent, issue: Issue, type: 'start' | 'end' | 'move') => void;
  onOpenDrawer: (number: number) => void;
}) {
  const { start, end } = effective;
  const startDay = daysBetween(viewStart, start);
  const endDay = end ? daysBetween(viewStart, end) : startDay + 3;

  const leftPx = Math.max(0, startDay * DAY_PX);
  const rightPx = Math.min(TOTAL_DAYS * DAY_PX, endDay * DAY_PX);
  const widthPx = Math.max(DAY_PX, rightPx - leftPx);
  const isOpen = !end;
  const isVisible = rightPx > 0 && leftPx < TOTAL_DAYS * DAY_PX;

  return (
    <div className="flex border-b border-dash-border/40 hover:bg-dash-border/10 group" style={{ height: ROW_H }}>
      {/* Label */}
      <div
        className="flex items-center gap-2 px-3 border-r border-dash-border sticky left-0 bg-dash-panel group-hover:bg-[#1a2436] z-10"
        style={{ width: LABEL_W }}
      >
        <span className="text-xs text-dash-muted font-mono w-8 shrink-0">#{issue.number}</span>
        <button onClick={() => onOpenDrawer(issue.number)} className="text-xs text-dash-text hover:text-dash-accent truncate text-left">{issue.title}</button>
      </div>

      {/* Timeline */}
      <div className="relative" style={{ width: TOTAL_DAYS * DAY_PX }}>
        {/* Today line */}
        {todayOffset >= 0 && todayOffset <= TOTAL_DAYS && (
          <div className="absolute top-0 bottom-0 w-px bg-red-500/30 pointer-events-none" style={{ left: todayOffset * DAY_PX }} />
        )}

        {/* Bar */}
        {isVisible && (
          <div
            className="absolute top-2 bottom-2 flex items-center cursor-move select-none rounded"
            style={{
              left: leftPx,
              width: widthPx,
              backgroundColor: col.color + 'bb',
              borderRight: isOpen ? `2px dashed ${col.color}` : undefined,
            }}
            onPointerDown={(e) => onStartDrag(e, issue, 'move')}
          >
            {/* Left resize handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-3 rounded-l cursor-ew-resize z-10 hover:opacity-100 opacity-60"
              style={{ backgroundColor: col.color }}
              onPointerDown={(e) => { e.stopPropagation(); onStartDrag(e, issue, 'start'); }}
            />

            {widthPx > 50 && (
              <span className="px-4 text-[11px] text-white truncate pointer-events-none">
                {issue.title}
              </span>
            )}

            {!isOpen && (
              <div
                className="absolute right-0 top-0 bottom-0 w-3 rounded-r cursor-ew-resize z-10 hover:opacity-100 opacity-60"
                style={{ backgroundColor: col.color }}
                onPointerDown={(e) => { e.stopPropagation(); onStartDrag(e, issue, 'end'); }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TypeBtn helper ───────────────────────────────────────────────────────────
function TypeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        active ? 'bg-dash-accent text-white' : 'bg-dash-panel text-dash-muted border border-dash-border hover:border-dash-accent/40'
      }`}
    >
      {children}
    </button>
  );
}
