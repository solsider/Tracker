import client from './client';
import type { IssueLinksResponse, IssueLink, IssueLinkType } from '../types';

export const issueLinksApi = {
  getByIssue: async (issueId: string): Promise<IssueLinksResponse> => {
    const res = await client.get<IssueLinksResponse>(`/issues/${issueId}/links`);
    return res.data;
  },

  create: async (issueId: string, data: { targetId: string; type: IssueLinkType }): Promise<IssueLink> => {
    const res = await client.post<IssueLink>(`/issues/${issueId}/links`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/issue-links/${id}`);
  },
};
