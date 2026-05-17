import { useState } from 'react';
import type { Column, Sprint } from '../../types';
import type { SortField, GroupBy } from '../../store/filters.store';
import { useFiltersStore } from '../../store/filters.store';
import { useSavedViewsStore } from '../../store/savedViews.store';

interface FilterBarProps {
  projectId: string;
  columns?: Column[];
  sprints?: Sprint[];
  members?: { id: string; name: string }[];
}

const PRIORITY_OPTS = [
  { value: 'CRITICAL', label: 'Критический' },
  { value: 'HIGH',     label: 'Высокий' },
  { value: 'MEDIUM',   label: 'Средний' },
  { value: 'LOW',      label: 'Низкий' },
];
const TYPE_OPTS = [
  { value: 'TASK',  label: 'Задача' },
  { value: 'BUG',   label: 'Баг' },
  { value: 'STORY', label: 'История' },
  { value: 'EPIC',  label: 'Эпик' },
];
const GROUP_OPTS: { value: GroupBy; label: string }[] = [
  { value: 'none',     label: 'Без группировки' },
  { value: 'assignee', label: 'Исполнитель' },
  { value: 'sprint',   label: 'Спринт' },
  { value: 'priority', label: 'Приоритет' },
  { value: 'status',   label: 'Статус' },
  { value: 'type',     label: 'Тип' },
];
const SORT_OPTS: { value: SortField; label: string }[] = [
  { value: 'createdAt',   label: 'Дата создания' },
  { value: 'updatedAt',   label: 'Изменено' },
  { value: 'dueDate',     label: 'Срок' },
  { value: 'priority',    label: 'Приоритет' },
  { value: 'storyPoints', label: 'Story Points' },
  { value: 'number',      label: 'Номер' },
];

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-dash-accent/15 text-dash-accent text-xs rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-white leading-none ml-0.5">×</button>
    </span>
  );
}

function SelectFilter({
  label,
  opts,
  onChange,
}: {
  label: string;
  opts: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value=""
      onChange={(e) => { if (e.target.value) onChange(e.target.value); e.target.value = ''; }}
      className="px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-text focus:outline-none focus:border-dash-accent"
    >
      <option value="">{label}</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function FilterBar({ projectId, columns = [], sprints = [], members = [] }: FilterBarProps) {
  const {
    filters, sortField, sortDir, groupBy,
    setFilter, toggleArrayFilter, setSort, setGroupBy, reset, activeCount,
  } = useFiltersStore();
  const savedViews = useSavedViewsStore();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const count = activeCount();
  const projectViews = savedViews.views.filter((v) => !v.projectId || v.projectId === projectId);

  const handleSave = () => {
    if (!saveName.trim()) return;
    savedViews.save({ name: saveName.trim(), projectId, filters, sortField, sortDir, groupBy });
    setSaveName('');
    setSaveOpen(false);
  };

  const applyView = (v: (typeof savedViews.views)[0]) => {
    Object.entries(v.filters).forEach(([k, val]) =>
      setFilter(k as keyof typeof filters, val as never),
    );
    setSort(v.sortField, v.sortDir);
    setGroupBy(v.groupBy);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <input
          type="text"
          placeholder="Поиск..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="px-3 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-text placeholder-dash-muted focus:outline-none focus:border-dash-accent w-44"
        />

        {/* Priority */}
        <SelectFilter
          label="Приоритет"
          opts={PRIORITY_OPTS}
          onChange={(v) => toggleArrayFilter('priorities', v as any)}
        />

        {/* Type */}
        <SelectFilter
          label="Тип"
          opts={TYPE_OPTS}
          onChange={(v) => toggleArrayFilter('types', v as any)}
        />

        {/* Assignee */}
        {members.length > 0 && (
          <SelectFilter
            label="Исполнитель"
            opts={members.map((m) => ({ value: m.id, label: m.name }))}
            onChange={(v) => toggleArrayFilter('assigneeIds', v)}
          />
        )}

        {/* Sprint */}
        {sprints.length > 0 && (
          <SelectFilter
            label="Спринт"
            opts={sprints.map((s) => ({ value: s.id, label: s.name }))}
            onChange={(v) => toggleArrayFilter('sprintIds', v)}
          />
        )}

        {/* Status */}
        {columns.length > 0 && (
          <SelectFilter
            label="Статус"
            opts={columns.map((c) => ({ value: c.id, label: c.title }))}
            onChange={(v) => toggleArrayFilter('columnIds', v)}
          />
        )}

        {/* Due date range */}
        <input
          type="date"
          value={filters.dueDateFrom}
          onChange={(e) => setFilter('dueDateFrom', e.target.value)}
          title="Срок от"
          className="px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-text focus:outline-none focus:border-dash-accent"
        />
        <input
          type="date"
          value={filters.dueDateTo}
          onChange={(e) => setFilter('dueDateTo', e.target.value)}
          title="Срок до"
          className="px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-text focus:outline-none focus:border-dash-accent"
        />

        {/* Overdue */}
        <button
          onClick={() => setFilter('overdue', !filters.overdue)}
          className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
            filters.overdue
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-dash-panel border-dash-border text-dash-muted hover:text-dash-text'
          }`}
        >
          Просрочены
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {/* Sort */}
          <select
            value={sortField}
            onChange={(e) => setSort(e.target.value as SortField, sortDir)}
            className="px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-text focus:outline-none focus:border-dash-accent"
          >
            {SORT_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            onClick={() => setSort(sortField, sortDir === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-muted hover:text-dash-text"
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Group by */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded-lg text-dash-text focus:outline-none focus:border-dash-accent"
        >
          {GROUP_OPTS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>

        {/* Reset */}
        {count > 0 && (
          <button
            onClick={reset}
            className="px-2 py-1.5 text-xs bg-dash-panel border border-dash-border rounded-lg text-dash-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            Сбросить ({count})
          </button>
        )}

        {/* Save view */}
        {!saveOpen ? (
          <button
            onClick={() => setSaveOpen(true)}
            className="px-2 py-1.5 text-xs bg-dash-panel border border-dash-border rounded-lg text-dash-muted hover:text-dash-text transition-colors"
          >
            Сохранить вид
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaveOpen(false); }}
              placeholder="Название..."
              className="px-2 py-1.5 text-xs bg-dash-panel border border-dash-accent rounded-lg text-dash-text focus:outline-none w-32"
            />
            <button onClick={handleSave} className="text-xs text-dash-accent hover:text-white px-1">✓</button>
            <button onClick={() => setSaveOpen(false)} className="text-xs text-dash-muted hover:text-dash-text px-1">✕</button>
          </div>
        )}
      </div>

      {/* Active chips */}
      {count > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.search && <Chip label={`«${filters.search}»`} onRemove={() => setFilter('search', '')} />}
          {filters.priorities.map((p) => (
            <Chip key={p} label={PRIORITY_OPTS.find((o) => o.value === p)?.label ?? p} onRemove={() => toggleArrayFilter('priorities', p)} />
          ))}
          {filters.types.map((t) => (
            <Chip key={t} label={TYPE_OPTS.find((o) => o.value === t)?.label ?? t} onRemove={() => toggleArrayFilter('types', t)} />
          ))}
          {filters.assigneeIds.map((id) => (
            <Chip key={id} label={members.find((m) => m.id === id)?.name ?? 'Исполнитель'} onRemove={() => toggleArrayFilter('assigneeIds', id)} />
          ))}
          {filters.sprintIds.map((id) => (
            <Chip key={id} label={sprints.find((s) => s.id === id)?.name ?? 'Спринт'} onRemove={() => toggleArrayFilter('sprintIds', id)} />
          ))}
          {filters.columnIds.map((id) => (
            <Chip key={id} label={columns.find((c) => c.id === id)?.title ?? 'Статус'} onRemove={() => toggleArrayFilter('columnIds', id)} />
          ))}
          {filters.overdue && <Chip label="Просрочены" onRemove={() => setFilter('overdue', false)} />}
          {filters.dueDateFrom && <Chip label={`От: ${filters.dueDateFrom}`} onRemove={() => setFilter('dueDateFrom', '')} />}
          {filters.dueDateTo && <Chip label={`До: ${filters.dueDateTo}`} onRemove={() => setFilter('dueDateTo', '')} />}
        </div>
      )}

      {/* Saved views */}
      {projectViews.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-dash-muted">Виды:</span>
          {projectViews.map((v) => (
            <div key={v.id} className="flex items-center gap-0.5">
              <button
                onClick={() => applyView(v)}
                className="text-xs px-2 py-0.5 bg-dash-panel border border-dash-border rounded text-dash-muted hover:text-dash-text hover:border-dash-accent/40 transition-colors"
              >
                {v.name}
              </button>
              <button
                onClick={() => savedViews.remove(v.id)}
                className="text-xs text-dash-muted/40 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
