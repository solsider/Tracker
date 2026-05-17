import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi } from '../api/issues.api';

export function useWatchers(issueId: string) {
  return useQuery({
    queryKey: ['watchers', issueId],
    queryFn: () => issuesApi.getWatchers(issueId),
    enabled: !!issueId,
  });
}

export function useWatchIssue(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => issuesApi.watch(issueId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchers', issueId] }),
  });
}

export function useUnwatchIssue(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => issuesApi.unwatch(issueId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchers', issueId] }),
  });
}
