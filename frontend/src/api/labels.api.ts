import client from './client';
import type { Label } from '../types';

export const labelsApi = {
  getByProject: async (projectId: string): Promise<Label[]> => {
    const res = await client.get<Label[]>(`/projects/${projectId}/labels`);
    return res.data;
  },

  create: async (projectId: string, data: { name: string; color?: string }): Promise<Label> => {
    const res = await client.post<Label>(`/projects/${projectId}/labels`, data);
    return res.data;
  },

  update: async (id: string, data: { name?: string; color?: string }): Promise<Label> => {
    const res = await client.patch<Label>(`/labels/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/labels/${id}`);
  },

  addToIssue: async (issueId: string, labelId: string): Promise<{ success: boolean }> => {
    const res = await client.post<{ success: boolean }>(`/issues/${issueId}/labels/${labelId}`);
    return res.data;
  },

  removeFromIssue: async (issueId: string, labelId: string): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/issues/${issueId}/labels/${labelId}`);
    return res.data;
  },
};
