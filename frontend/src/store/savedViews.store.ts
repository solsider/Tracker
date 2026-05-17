import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IssueFilters, SortField, SortDir, GroupBy } from './filters.store';

export interface SavedView {
  id: string;
  name: string;
  projectId: string | null;
  filters: IssueFilters;
  sortField: SortField;
  sortDir: SortDir;
  groupBy: GroupBy;
  createdAt: string;
}

interface SavedViewsState {
  views: SavedView[];
  save: (view: Omit<SavedView, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
}

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set) => ({
      views: [],
      save: (view) =>
        set((s) => ({
          views: [
            ...s.views,
            { ...view, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        })),
      remove: (id) => set((s) => ({ views: s.views.filter((v) => v.id !== id) })),
      rename: (id, name) =>
        set((s) => ({ views: s.views.map((v) => (v.id === id ? { ...v, name } : v)) })),
    }),
    { name: 'tracker-views' },
  ),
);
