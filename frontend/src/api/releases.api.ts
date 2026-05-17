import client from './client';

export type ReleaseStatus = 'DRAFT' | 'RELEASED' | 'ARCHIVED';

export interface Release {
  id: string;
  version: string;
  name: string | null;
  description: string | null;
  status: ReleaseStatus;
  releasedAt: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { issues: number };
}

export const releasesApi = {
  list: (projectId: string) =>
    client.get<Release[]>(`/projects/${projectId}/releases`).then((r) => r.data),
  get: (projectId: string, id: string) =>
    client.get<Release & { issues: { issue: any }[] }>(`/projects/${projectId}/releases/${id}`).then((r) => r.data),
  create: (projectId: string, data: { version: string; name?: string; description?: string; status?: ReleaseStatus }) =>
    client.post<Release>(`/projects/${projectId}/releases`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: Partial<{ version: string; name: string; description: string; status: ReleaseStatus; releasedAt: string }>) =>
    client.put<Release>(`/projects/${projectId}/releases/${id}`, data).then((r) => r.data),
  delete: (projectId: string, id: string) =>
    client.delete(`/projects/${projectId}/releases/${id}`).then((r) => r.data),
  addIssue: (projectId: string, id: string, issueId: string) =>
    client.post(`/projects/${projectId}/releases/${id}/issues/${issueId}`).then((r) => r.data),
  removeIssue: (projectId: string, id: string, issueId: string) =>
    client.delete(`/projects/${projectId}/releases/${id}/issues/${issueId}`).then((r) => r.data),
};
