import { create } from 'zustand';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  createdAt: number;
}

export interface PresenceUser {
  userId: string;
  name: string;
}

interface RealtimeState {
  connected: boolean;
  toasts: ToastNotification[];
  // issueId → list of viewers
  issuePresence: Record<string, PresenceUser[]>;
  // issueId → list of typing user names
  typingUsers: Record<string, { userId: string; name: string }[]>;

  setConnected: (v: boolean) => void;
  addToast: (msg: string, type?: ToastNotification['type']) => void;
  dismissToast: (id: string) => void;
  setIssuePresence: (issueId: string, viewers: PresenceUser[]) => void;
  setTyping: (issueId: string, userId: string, name: string, isTyping: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connected: false,
  toasts: [],
  issuePresence: {},
  typingUsers: {},

  setConnected: (v) => set({ connected: v }),

  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: crypto.randomUUID(), message, type, createdAt: Date.now() },
      ].slice(-5),
    })),

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setIssuePresence: (issueId, viewers) =>
    set((s) => ({ issuePresence: { ...s.issuePresence, [issueId]: viewers } })),

  setTyping: (issueId, userId, name, isTyping) =>
    set((s) => {
      const current = s.typingUsers[issueId] ?? [];
      const filtered = current.filter((u) => u.userId !== userId);
      return {
        typingUsers: {
          ...s.typingUsers,
          [issueId]: isTyping ? [...filtered, { userId, name }] : filtered,
        },
      };
    }),
}));
