import client from './client';
import type { ActivityLog } from '../types';

export const activityApi = {
  getByIssue: async (issueId: string, limit?: number): Promise<ActivityLog[]> => {
    const res = await client.get<ActivityLog[]>(`/issues/${issueId}/activity`, {
      params: limit ? { limit } : undefined,
    });
    return res.data;
  },

  getByProject: async (projectId: string, limit?: number): Promise<ActivityLog[]> => {
    const res = await client.get<ActivityLog[]>(`/projects/${projectId}/activity`, {
      params: limit ? { limit } : undefined,
    });
    return res.data;
  },
};
