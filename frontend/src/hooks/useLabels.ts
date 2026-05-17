import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsApi } from '../api/labels.api';

export function useProjectLabels(projectId: string) {
  return useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => labelsApi.getByProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => labelsApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels', projectId] }),
  });
}

export function useAddLabelToIssue(projectId: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelsApi.addToIssue(issueId, labelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });
}

export function useRemoveLabelFromIssue(projectId: string, issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId: string) => labelsApi.removeFromIssue(issueId, labelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });
}
