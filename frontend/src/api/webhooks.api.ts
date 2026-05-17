import client from './client';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  _count?: { deliveries: number };
}

export interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  durationMs: number | null;
  attempts: number;
  succeededAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export const webhooksApi = {
  list: (projectId: string) =>
    client.get<Webhook[]>(`/projects/${projectId}/webhooks`).then((r) => r.data),
  create: (projectId: string, data: { name: string; url: string; secret?: string; events: string[] }) =>
    client.post<Webhook>(`/projects/${projectId}/webhooks`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: Partial<{ name: string; url: string; isActive: boolean; events: string[] }>) =>
    client.put<Webhook>(`/projects/${projectId}/webhooks/${id}`, data).then((r) => r.data),
  delete: (projectId: string, id: string) =>
    client.delete(`/projects/${projectId}/webhooks/${id}`).then((r) => r.data),
  deliveries: (projectId: string, id: string) =>
    client.get<WebhookDelivery[]>(`/projects/${projectId}/webhooks/${id}/deliveries`).then((r) => r.data),
};
