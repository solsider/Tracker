import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useIssues, useCreateIssue, useUpdateIssue, useDeleteIssue } from '../../hooks/useIssues';
import { useColumns } from '../../hooks/useColumns';
import { useSprints } from '../../hooks/useSprints';
import { useDrawerStore } from '../../store/drawer.store';
import { useFiltersStore } from '../../store/filters.store';
import { useFilteredIssues } from '../../hooks/useFilteredIssues';
import { FilterBar } from '../../components/filters/FilterBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { CreateIssueDto, IssuePriority, IssueType, Issue } from '../../types';

type ViewMode = 'list' | 'table';

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  CRITICAL: 'text-red-400 font-semibold',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-green-400',
};
const PRIORITY_LABELS: Record<IssuePriority, string> = {
  CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий',
};
const TYPE_LABELS: Record<IssueType, string> = {
  TASK: 'Задача', BUG: 'Баг', STORY: 'История', EPIC: 'Эпик',
};

// ── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({
  selected,
  issues,
  projectId,
  onClear,
}: {
  selected: Set<string>;
  issues: Issue[];
  projectId: string;
  onClear: () => void;
}) {
  const deleteIssue = useDeleteIssue(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const updateIssue = useUpdateIssue(projectId, 0);
  const selectedIssues = issues.filter((i) => selected.has(i.id));

  const handlePriority = (priority: IssuePriority) => {
    selectedIssues.forEach(() => updateIssue.mutate({ priority } as any));
    onClear();
  };

  const handleSprint = (sprintId: string) => {
    selectedIssues.forEach(() => updateIssue.mutate({ sprintId: sprintId || null } as any));
    onClear();
  };

  const handleDelete = () => {
    if (!confirm(`Удалить ${selected.size} задач(и)?`)) return;
    selectedIssues.forEach((i) => deleteIssue.mutate(i.number));
    onClear();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-dash-accent/10 border border-dash-accent/30 rounded-lg">
      <span className="text-sm font-medium text-dash-accent">{selected.size} выбрано</span>

      <select
        defaultValue=""
        onChange={(e) => { if (e.target.value) handlePriority(e.target.value as IssuePriority); }}
        className="px-2 py-1 text-xs bg-dash-panel border border-dash-border rounded text-dash-text"
      >
        <option value="">Изменить приоритет</option>
        {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
        ))}
      </select>

      {sprints.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => handleSprint(e.target.value)}
          className="px-2 py-1 text-xs bg-dash-panel border border-dash-border rounded text-dash-text"
        >
          <option value="">Переместить в спринт</option>
          <option value="">Убрать из спринта</option>
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      <button
        onClick={handleDelete}
        className="px-2 py-1 text-xs bg-red-500/20 border border-red-500/40 rounded text-red-400 hover:bg-red-500/30 transition-colors"
      >
        Удалить
      </button>

      <button onClick={onClear} className="ml-auto text-xs text-dash-muted hover:text-dash-text">
        Отменить выбор
      </button>
    </div>
  );
}

// ── Create Issue Modal ───────────────────────────────────────────────────────

function CreateIssueModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: columns } = useColumns(projectId);
  const [form, setForm] = useState<CreateIssueDto>({ title: '' });
  const createIssue = useCreateIssue(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIssue.mutate(form, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        label="Заголовок"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        required minLength={2} placeholder="Краткое описание задачи"
      />
      <label className="block text-sm font-medium text-dash-muted">
        Колонка
        {columns && columns.length > 0 ? (
          <select
            className="mt-1 block w-full rounded-lg border border-dash-border bg-dash-bg text-dash-text px-3 py-2 text-sm focus:outline-none focus:border-dash-accent"
            value={form.columnId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, columnId: e.target.value || undefined }))}
          >
            <option value="">Автоматически (Backlog)</option>
            {columns.map((col) => <option key={col.id} value={col.id}>{col.title}</option>)}
          </select>
        ) : (
          <p className="mt-1 text-sm text-dash-muted">Будет создана колонка «Backlog» автоматически</p>
        )}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-dash-muted">
          Тип
          <select
            className="mt-1 block w-full rounded-lg border border-dash-border bg-dash-bg text-dash-text px-3 py-2 text-sm focus:outline-none focus:border-dash-accent"
            value={form.type ?? 'TASK'}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as IssueType }))}
          >
            {(Object.keys(TYPE_LABELS) as IssueType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-dash-muted">
          Приоритет
          <select
            className="mt-1 block w-full rounded-lg border border-dash-border bg-dash-bg text-dash-text px-3 py-2 text-sm focus:outline-none focus:border-dash-accent"
            value={form.priority ?? 'MEDIUM'}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as IssuePriority }))}
          >
            {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Дата начала" type="date" value={form.startDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || undefined }))} />
        <Input label="Срок" type="date" value={form.dueDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || undefined }))} />
      </div>
      {createIssue.error && (
        <p className="text-sm text-red-400">{(createIssue.error as any)?.response?.data?.message || 'Ошибка'}</p>
      )}
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
        <Button type="submit" loading={createIssue.isPending}>Создать</Button>
      </div>
    </form>
  );
}

// ── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({ label, count, color, expanded, onToggle }: {
  label: string; count: number; color?: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full px-3 py-2 bg-dash-bg/50 hover:bg-dash-bg rounded-lg text-left transition-colors"
    >
      <span className="text-dash-muted text-xs">{expanded ? '▾' : '▸'}</span>
      {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      <span className="text-sm font-semibold text-dash-text">{label}</span>
      <span className="text-xs text-dash-muted ml-1">({count})</span>
    </button>
  );
}

// ── List row ─────────────────────────────────────────────────────────────────

function IssueListRow({
  issue, projectId, selected, onSelect,
}: { issue: Issue; projectId: string; selected: boolean; onSelect: (id: string) => void }) {
  const openDrawer = useDrawerStore((s) => s.open);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = issue.dueDate && issue.dueDate.slice(0, 10) < today;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-dash-panel border rounded-lg hover:border-dash-accent/30 transition-colors cursor-pointer group ${
        selected ? 'border-dash-accent/50 bg-dash-accent/5' : 'border-dash-border'
      }`}
      onClick={() => openDrawer(projectId, issue.number)}
    >
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onSelect(issue.id)}
        className="accent-dash-accent shrink-0"
      />
      <span className="text-xs font-mono text-dash-muted w-10 shrink-0">#{issue.number}</span>
      <span className="text-xs px-2 py-0.5 rounded font-medium shrink-0 text-white" style={{ backgroundColor: issue.column.color }}>
        {issue.column.title}
      </span>
      <span className={`text-xs shrink-0 ${PRIORITY_COLORS[issue.priority]}`}>{PRIORITY_LABELS[issue.priority]}</span>
      <span className="text-xs bg-dash-border text-dash-muted px-2 py-0.5 rounded shrink-0">{TYPE_LABELS[issue.type]}</span>
      <span className="flex-1 text-sm font-medium text-dash-text truncate group-hover:text-white">{issue.title}</span>
      {issue.storyPoints != null && (
        <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded shrink-0">{issue.storyPoints}SP</span>
      )}
      {issue.dueDate && (
        <span className={`text-xs shrink-0 ${isOverdue ? 'text-red-400' : 'text-dash-muted'}`}>
          {isOverdue && '⚠ '}до {new Date(issue.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
      )}
      <span className="text-xs text-dash-muted shrink-0">{issue.assignee?.name ?? '—'}</span>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function IssueTableRow({
  issue, projectId, selected, onSelect, sprints,
}: {
  issue: Issue; projectId: string; selected: boolean; onSelect: (id: string) => void;
  sprints: { id: string; name: string }[];
}) {
  const openDrawer = useDrawerStore((s) => s.open);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = issue.dueDate && issue.dueDate.slice(0, 10) < today;
  const sprintName = sprints.find((s) => s.id === issue.sprintId)?.name;

  return (
    <tr
      className={`border-b border-dash-border/40 hover:bg-dash-accent/5 transition-colors cursor-pointer ${selected ? 'bg-dash-accent/8' : ''}`}
      onClick={() => openDrawer(projectId, issue.number)}
    >
      <td className="px-3 py-2 w-8" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(issue.id)} className="accent-dash-accent" />
      </td>
      <td className="px-3 py-2 text-xs font-mono text-dash-muted">#{issue.number}</td>
      <td className="px-3 py-2 text-sm text-dash-text font-medium max-w-64 truncate">{issue.title}</td>
      <td className="px-3 py-2">
        <span className="text-xs px-2 py-0.5 rounded text-white" style={{ backgroundColor: issue.column.color }}>{issue.column.title}</span>
      </td>
      <td className={`px-3 py-2 text-xs ${PRIORITY_COLORS[issue.priority]}`}>{PRIORITY_LABELS[issue.priority]}</td>
      <td className="px-3 py-2 text-xs text-dash-muted">{TYPE_LABELS[issue.type]}</td>
      <td className="px-3 py-2 text-xs text-dash-muted">{issue.assignee?.name ?? '—'}</td>
      <td className="px-3 py-2 text-xs text-dash-muted">{sprintName ?? '—'}</td>
      <td className="px-3 py-2 text-xs font-mono text-blue-400">{issue.storyPoints != null ? `${issue.storyPoints}SP` : '—'}</td>
      <td className={`px-3 py-2 text-xs ${isOverdue ? 'text-red-400' : 'text-dash-muted'}`}>
        {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
      </td>
      <td className="px-3 py-2 text-xs text-dash-muted">
        {new Date(issue.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
      </td>
      <td className="px-3 py-2 text-xs text-dash-muted">
        {new Date(issue.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function IssuesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: issues, isLoading } = useIssues(projectId!);
  const { data: columns = [] } = useColumns(projectId!);
  const { data: sprints = [] } = useSprints(projectId!);
  const { filters, sortField, sortDir, groupBy, setSort } = useFiltersStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const sprintsMap = useMemo(
    () => Object.fromEntries(sprints.map((s) => [s.id, s.name])),
    [sprints],
  );
  const members = useMemo(() => {
    const seen = new Set<string>();
    return (issues ?? [])
      .filter((i) => i.assignee && !seen.has(i.assigneeId!) && seen.add(i.assigneeId!))
      .map((i) => ({ id: i.assigneeId!, name: i.assignee!.name }));
  }, [issues]);

  const { filtered, groups } = useFilteredIssues(issues, filters, sortField, sortDir, groupBy, sprintsMap);

  const toggleSelect = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () =>
    setSelected(selected.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map((i) => i.id)));

  const toggleGroup = (key: string) =>
    setCollapsedGroups((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const SortTh = ({ field, label }: { field: typeof sortField; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-semibold text-dash-muted cursor-pointer hover:text-dash-text select-none whitespace-nowrap"
      onClick={() => setSort(field)}
    >
      {label} {sortField === field && <span className="text-dash-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-dash-panel rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-dash-text">Задачи</h1>
          <span className="text-sm text-dash-muted">({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-dash-border">
            {(['list', 'table'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === v ? 'bg-dash-accent text-white' : 'bg-dash-panel text-dash-muted hover:text-dash-text'
                }`}
              >
                {v === 'list' ? '≡ Список' : '⊞ Таблица'}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>+ Создать задачу</Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar projectId={projectId!} columns={columns} sprints={sprints} members={members} />

      {/* Bulk actions */}
      {selected.size > 0 && (
        <BulkBar selected={selected} issues={filtered} projectId={projectId!} onClear={() => setSelected(new Set())} />
      )}

      {/* Content */}
      {!filtered.length ? (
        <div className="text-center py-16 text-dash-muted">
          <p className="text-lg font-medium text-dash-text">
            {(issues?.length ?? 0) > 0 ? 'Задачи не найдены' : 'Нет задач'}
          </p>
          <p className="text-sm mt-1">
            {(issues?.length ?? 0) > 0 ? 'Попробуйте изменить фильтры' : 'Создайте первую задачу для этого проекта'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              {groupBy !== 'none' && (
                <GroupHeader
                  label={group.label}
                  count={group.issues.length}
                  color={group.color}
                  expanded={!collapsedGroups.has(group.key)}
                  onToggle={() => toggleGroup(group.key)}
                />
              )}
              {!collapsedGroups.has(group.key) && (
                <div className="space-y-1 mt-1">
                  {group.issues.map((issue) => (
                    <IssueListRow key={issue.id} issue={issue} projectId={projectId!} selected={selected.has(issue.id)} onSelect={toggleSelect} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dash-border">
          <table className="w-full text-sm">
            <thead className="bg-dash-panel border-b border-dash-border">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-dash-accent"
                  />
                </th>
                <SortTh field="number" label="#" />
                <th className="px-3 py-2 text-left text-xs font-semibold text-dash-muted">Заголовок</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-dash-muted">Статус</th>
                <SortTh field="priority" label="Приоритет" />
                <th className="px-3 py-2 text-left text-xs font-semibold text-dash-muted">Тип</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-dash-muted">Исполнитель</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-dash-muted">Спринт</th>
                <SortTh field="storyPoints" label="SP" />
                <SortTh field="dueDate" label="Срок" />
                <SortTh field="createdAt" label="Создано" />
                <SortTh field="updatedAt" label="Изменено" />
              </tr>
            </thead>
            <tbody className="bg-dash-panel">
              {groups.map((group) => (
                <>
                  {groupBy !== 'none' && (
                    <tr key={`gh-${group.key}`} className="bg-dash-bg/60">
                      <td colSpan={12} className="px-3 py-1.5">
                        <button
                          onClick={() => toggleGroup(group.key)}
                          className="flex items-center gap-2 text-xs font-semibold text-dash-text"
                        >
                          <span className="text-dash-muted">{collapsedGroups.has(group.key) ? '▸' : '▾'}</span>
                          {group.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />}
                          {group.label}
                          <span className="text-dash-muted font-normal">({group.issues.length})</span>
                        </button>
                      </td>
                    </tr>
                  )}
                  {!collapsedGroups.has(group.key) &&
                    group.issues.map((issue) => (
                      <IssueTableRow
                        key={issue.id}
                        issue={issue}
                        projectId={projectId!}
                        selected={selected.has(issue.id)}
                        onSelect={toggleSelect}
                        sprints={sprints}
                      />
                    ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Создать задачу">
        <CreateIssueModal projectId={projectId!} onClose={() => setIsCreateOpen(false)} />
      </Modal>
    </div>
  );
}
