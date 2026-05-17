import { create } from 'zustand';

interface DrawerState {
  isOpen: boolean;
  projectId: string | null;
  issueNumber: number | null;
  open: (projectId: string, issueNumber: number) => void;
  close: () => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  isOpen: false,
  projectId: null,
  issueNumber: null,
  open: (projectId, issueNumber) => set({ isOpen: true, projectId, issueNumber }),
  close: () => set({ isOpen: false, projectId: null, issueNumber: null }),
}));
