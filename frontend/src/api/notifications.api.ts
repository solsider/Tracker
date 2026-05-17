import client from './client';

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  actorId: string | null;
  actor: { id: string; name: string; avatar: string | null } | null;
  issueId: string | null;
  issue: { id: string; number: number; title: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
}

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    client.get<Notification[]>('/notifications', { params: unreadOnly ? { unread: 'true' } : undefined }).then((r) => r.data),

  unreadCount: () =>
    client.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) =>
    client.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    client.patch('/notifications/read-all').then((r) => r.data),
};
