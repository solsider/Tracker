import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueLinksApi } from '../api/issue-links.api';
import type { IssueLinkType } from '../types';

export function useIssueLinks(issueId: string) {
  return useQuery({
    queryKey: ['issue-links', issueId],
    queryFn: () => issueLinksApi.getByIssue(issueId),
    enabled: !!issueId,
  });
}

export function useCreateIssueLink(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetId: string; type: IssueLinkType }) =>
      issueLinksApi.create(issueId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issue-links', issueId] }),
  });
}

export function useDeleteIssueLink(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => issueLinksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issue-links', issueId] }),
  });
}
