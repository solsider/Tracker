import client from './client';
import type { Sprint, Issue } from '../types';

export const sprintsApi = {
  getByProject: async (projectId: string): Promise<Sprint[]> => {
    const res = await client.get<Sprint[]>(`/projects/${projectId}/sprints`);
    return res.data;
  },

  getBacklog: async (projectId: string): Promise<Issue[]> => {
    const res = await client.get<Issue[]>(`/projects/${projectId}/backlog`);
    return res.data;
  },

  create: async (projectId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }): Promise<Sprint> => {
    const res = await client.post<Sprint>(`/projects/${projectId}/sprints`, data);
    return res.data;
  },

  update: async (id: string, data: { name?: string; goal?: string; startDate?: string; endDate?: string }): Promise<Sprint> => {
    const res = await client.patch<Sprint>(`/sprints/${id}`, data);
    return res.data;
  },

  start: async (id: string): Promise<Sprint> => {
    const res = await client.patch<Sprint>(`/sprints/${id}/start`);
    return res.data;
  },

  complete: async (id: string): Promise<Sprint> => {
    const res = await client.patch<Sprint>(`/sprints/${id}/complete`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/sprints/${id}`);
  },
};
