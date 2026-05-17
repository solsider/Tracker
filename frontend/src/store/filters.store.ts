import { create } from 'zustand';
import type { IssuePriority, IssueType } from '../types';

export type SortField = 'number' | 'priority' | 'dueDate' | 'storyPoints' | 'createdAt' | 'updatedAt';
export type SortDir = 'asc' | 'desc';
export type GroupBy = 'none' | 'assignee' | 'sprint' | 'priority' | 'status' | 'type';

export interface IssueFilters {
  search: string;
  assigneeIds: string[];
  sprintIds: string[];
  columnIds: string[];
  priorities: IssuePriority[];
  types: IssueType[];
  overdue: boolean;
  dueDateFrom: string;
  dueDateTo: string;
}

export const DEFAULT_FILTERS: IssueFilters = {
  search: '',
  assigneeIds: [],
  sprintIds: [],
  columnIds: [],
  priorities: [],
  types: [],
  overdue: false,
  dueDateFrom: '',
  dueDateTo: '',
};

interface FiltersState {
  filters: IssueFilters;
  sortField: SortField;
  sortDir: SortDir;
  groupBy: GroupBy;
  setFilter: <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => void;
  toggleArrayFilter: <K extends keyof IssueFilters>(
    key: K,
    value: IssueFilters[K] extends (infer T)[] ? T : never,
  ) => void;
  setSort: (field: SortField, dir?: SortDir) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  reset: () => void;
  activeCount: () => number;
}

export const useFiltersStore = create<FiltersState>()((set, get) => ({
  filters: { ...DEFAULT_FILTERS },
  sortField: 'createdAt',
  sortDir: 'desc',
  groupBy: 'none',

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  toggleArrayFilter: (key, value) =>
    set((s) => {
      const arr = s.filters[key] as unknown[];
      const exists = arr.includes(value);
      return {
        filters: {
          ...s.filters,
          [key]: exists ? arr.filter((v) => v !== value) : [...arr, value],
        },
      };
    }),

  setSort: (field, dir) =>
    set((s) => ({
      sortField: field,
      sortDir: dir ?? (s.sortField === field && s.sortDir === 'asc' ? 'desc' : 'asc'),
    })),

  setGroupBy: (groupBy) => set({ groupBy }),

  reset: () =>
    set({ filters: { ...DEFAULT_FILTERS }, sortField: 'createdAt', sortDir: 'desc', groupBy: 'none' }),

  activeCount: () => {
    const f = get().filters;
    return (
      (f.search ? 1 : 0) +
      f.assigneeIds.length +
      f.sprintIds.length +
      f.columnIds.length +
      f.priorities.length +
      f.types.length +
      (f.overdue ? 1 : 0) +
      (f.dueDateFrom ? 1 : 0) +
      (f.dueDateTo ? 1 : 0)
    );
  },
}));
