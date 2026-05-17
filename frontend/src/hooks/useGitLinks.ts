import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gitApi } from '../api/git.api';

export function useGitLinks(projectId: string, issueNumber: number) {
  return useQuery({
    queryKey: ['git-links', projectId, issueNumber],
    queryFn: () => gitApi.getLinks(projectId, issueNumber),
    enabled: !!projectId && issueNumber > 0,
  });
}

export function useAddBranch(projectId: string, issueNumber: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url?: string }) => gitApi.addBranch(projectId, issueNumber, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['git-links', projectId, issueNumber] }),
  });
}

export function useAddCommit(projectId: string, issueNumber: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sha: string; message: string; url?: string; authorName?: string }) =>
      gitApi.addCommit(projectId, issueNumber, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['git-links', projectId, issueNumber] }),
  });
}

export function useDeleteBranch(projectId: string, issueNumber: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gitApi.deleteBranch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['git-links', projectId, issueNumber] }),
  });
}
