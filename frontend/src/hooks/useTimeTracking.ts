import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingApi } from '../api/time-tracking.api';

export function useTimeEntries(issueId: string) {
  return useQuery({
    queryKey: ['time-entries', issueId],
    queryFn: () => timeTrackingApi.getByIssue(issueId),
    enabled: !!issueId,
  });
}

export function useLogTime(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { minutes: number; description?: string; date?: string }) =>
      timeTrackingApi.logTime(issueId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', issueId] }),
  });
}

export function useUpdateTimeEntry(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; minutes?: number; description?: string; date?: string }) =>
      timeTrackingApi.updateEntry(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', issueId] }),
  });
}

export function useDeleteTimeEntry(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeTrackingApi.deleteEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries', issueId] }),
  });
}
