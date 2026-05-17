import client from './client';
import type { TimeEntriesResponse, TimeEntry } from '../types';

export const timeTrackingApi = {
  getByIssue: async (issueId: string): Promise<TimeEntriesResponse> => {
    const res = await client.get<TimeEntriesResponse>(`/issues/${issueId}/time-entries`);
    return res.data;
  },

  logTime: async (issueId: string, data: { minutes: number; description?: string; date?: string }): Promise<TimeEntry> => {
    const res = await client.post<TimeEntry>(`/issues/${issueId}/time-entries`, data);
    return res.data;
  },

  updateEntry: async (id: string, data: { minutes?: number; description?: string; date?: string }): Promise<TimeEntry> => {
    const res = await client.patch<TimeEntry>(`/time-entries/${id}`, data);
    return res.data;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await client.delete(`/time-entries/${id}`);
  },
};
