import { useMemo } from 'react';
import type { Issue } from '../types';
import type { IssueFilters, SortField, SortDir, GroupBy } from '../store/filters.store';

const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function matchesFilters(issue: Issue, f: IssueFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!issue.title.toLowerCase().includes(q) && !String(issue.number).includes(q)) return false;
  }
  if (f.assigneeIds.length && !f.assigneeIds.includes(issue.assigneeId ?? '__none__')) return false;
  if (f.sprintIds.length && !f.sprintIds.includes(issue.sprintId ?? '__backlog__')) return false;
  if (f.columnIds.length && !f.columnIds.includes(issue.columnId)) return false;
  if (f.priorities.length && !(f.priorities as string[]).includes(issue.priority)) return false;
  if (f.types.length && !(f.types as string[]).includes(issue.type)) return false;
  if (f.overdue) {
    if (!issue.dueDate) return false;
    if (new Date(issue.dueDate) >= new Date()) return false;
  }
  if (f.dueDateFrom && issue.dueDate && issue.dueDate < f.dueDateFrom) return false;
  if (f.dueDateTo && issue.dueDate && issue.dueDate > f.dueDateTo) return false;
  return true;
}

function sortIssues(issues: Issue[], field: SortField, dir: SortDir): Issue[] {
  return [...issues].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'number':       cmp = a.number - b.number; break;
      case 'priority':     cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]; break;
      case 'dueDate':      cmp = (a.dueDate ?? 'zzz').localeCompare(b.dueDate ?? 'zzz'); break;
      case 'storyPoints':  cmp = (a.storyPoints ?? -1) - (b.storyPoints ?? -1); break;
      case 'createdAt':    cmp = a.createdAt.localeCompare(b.createdAt); break;
      case 'updatedAt':    cmp = a.updatedAt.localeCompare(b.updatedAt); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

export interface IssueGroup {
  key: string;
  label: string;
  issues: Issue[];
  color?: string;
}

function groupIssues(
  issues: Issue[],
  groupBy: GroupBy,
  sprintsMap: Record<string, string>,
): IssueGroup[] {
  if (groupBy === 'none') return [{ key: 'all', label: 'Все', issues }];

  const map = new Map<string, IssueGroup>();

  for (const issue of issues) {
    let key: string;
    let label: string;
    let color: string | undefined;

    switch (groupBy) {
      case 'assignee':
        key = issue.assigneeId ?? 'none';
        label = issue.assignee?.name ?? 'Не назначен';
        break;
      case 'sprint':
        key = issue.sprintId ?? 'backlog';
        label = sprintsMap[issue.sprintId ?? ''] ?? 'Бэклог';
        break;
      case 'priority':
        key = issue.priority;
        label = { CRITICAL: 'Критический', HIGH: 'Высокий', MEDIUM: 'Средний', LOW: 'Низкий' }[issue.priority];
        color = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' }[issue.priority];
        break;
      case 'status':
        key = issue.columnId;
        label = issue.column.title;
        color = issue.column.color;
        break;
      case 'type':
        key = issue.type;
        label = { TASK: 'Задача', BUG: 'Баг', STORY: 'История', EPIC: 'Эпик' }[issue.type];
        break;
      default:
        key = 'all';
        label = 'Все';
    }

    if (!map.has(key)) map.set(key, { key, label, issues: [], color });
    map.get(key)!.issues.push(issue);
  }

  return Array.from(map.values());
}

export function useFilteredIssues(
  issues: Issue[] | undefined,
  filters: IssueFilters,
  sortField: SortField,
  sortDir: SortDir,
  groupBy: GroupBy,
  sprintsMap: Record<string, string> = {},
): { filtered: Issue[]; groups: IssueGroup[] } {
  return useMemo(() => {
    const all = issues ?? [];
    const filtered = sortIssues(
      all.filter((i) => matchesFilters(i, filters)),
      sortField,
      sortDir,
    );
    const groups = groupIssues(filtered, groupBy, sprintsMap);
    return { filtered, groups };
  }, [issues, filters, sortField, sortDir, groupBy, sprintsMap]);
}
