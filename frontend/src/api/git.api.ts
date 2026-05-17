import client from './client';

export interface GitBranch { id: string; name: string; url: string | null; createdAt: string; }
export interface GitCommit { id: string; sha: string; message: string; url: string | null; authorName: string | null; committedAt: string | null; createdAt: string; }
export interface GitPR { id: string; number: number; title: string; url: string; state: string; authorName: string | null; mergedAt: string | null; createdAt: string; }

export interface GitLinks { branches: GitBranch[]; commits: GitCommit[]; pullRequests: GitPR[]; }

export const gitApi = {
  getLinks: (projectId: string, issueNumber: number) =>
    client.get<GitLinks>(`/projects/${projectId}/issues/${issueNumber}/git`).then((r) => r.data),
  addBranch: (projectId: string, n: number, data: { name: string; url?: string }) =>
    client.post<GitBranch>(`/projects/${projectId}/issues/${n}/git/branches`, data).then((r) => r.data),
  addCommit: (projectId: string, n: number, data: { sha: string; message: string; url?: string; authorName?: string }) =>
    client.post<GitCommit>(`/projects/${projectId}/issues/${n}/git/commits`, data).then((r) => r.data),
  addPR: (projectId: string, n: number, data: { number_: number; title: string; url: string; state?: string; authorName?: string }) =>
    client.post<GitPR>(`/projects/${projectId}/issues/${n}/git/pull-requests`, data).then((r) => r.data),
  deleteBranch: (id: string) =>
    client.delete(`/git-branches/${id}`).then((r) => r.data),
};
