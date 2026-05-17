import client from './client';
import type { Issue, CreateIssueDto, UpdateIssueDto, Comment, Watcher } from '../types';

export const issuesApi = {
  getAll: async (projectId: string): Promise<Issue[]> => {
    const res = await client.get<Issue[]>(`/projects/${projectId}/issues`);
    return res.data;
  },

  getByNumber: async (projectId: string, number: number): Promise<Issue> => {
    const res = await client.get<Issue>(`/projects/${projectId}/issues/${number}`);
    return res.data;
  },

  create: async (projectId: string, data: CreateIssueDto): Promise<Issue> => {
    const res = await client.post<Issue>(`/projects/${projectId}/issues`, data);
    return res.data;
  },

  update: async (projectId: string, number: number, data: UpdateIssueDto): Promise<Issue> => {
    const res = await client.patch<Issue>(`/projects/${projectId}/issues/${number}`, data);
    return res.data;
  },

  delete: async (projectId: string, number: number): Promise<void> => {
    await client.delete(`/projects/${projectId}/issues/${number}`);
  },

  moveToColumn: async (
    id: string,
    columnId: string,
    afterId?: string,
    beforeId?: string,
  ): Promise<Issue> => {
    const res = await client.patch<Issue>(`/issues/${id}/column`, {
      columnId,
      afterId,
      beforeId,
    });
    return res.data;
  },

  getComments: async (projectId: string, issueNumber: number): Promise<Comment[]> => {
    const res = await client.get<Comment[]>(
      `/projects/${projectId}/issues/${issueNumber}/comments`,
    );
    return res.data;
  },

  addComment: async (projectId: string, issueNumber: number, body: string): Promise<Comment> => {
    const res = await client.post<Comment>(
      `/projects/${projectId}/issues/${issueNumber}/comments`,
      { body },
    );
    return res.data;
  },

  updateComment: async (id: string, body: string): Promise<Comment> => {
    const res = await client.patch<Comment>(`/comments/${id}`, { body });
    return res.data;
  },

  deleteComment: async (id: string): Promise<void> => {
    await client.delete(`/comments/${id}`);
  },

  getWatchers: async (issueId: string): Promise<Watcher[]> => {
    const res = await client.get<Watcher[]>(`/issues/${issueId}/watchers`);
    return res.data;
  },

  watch: async (issueId: string): Promise<{ success: boolean }> => {
    const res = await client.post<{ success: boolean }>(`/issues/${issueId}/watchers`);
    return res.data;
  },

  unwatch: async (issueId: string): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/issues/${issueId}/watchers`);
    return res.data;
  },
};
