import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '../api/checklists.api';

export function useChecklists(issueId: string) {
  return useQuery({
    queryKey: ['checklists', issueId],
    queryFn: () => checklistsApi.getByIssue(issueId),
    enabled: !!issueId,
  });
}

export function useCreateChecklist(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; order?: number }) =>
      checklistsApi.createChecklist(issueId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', issueId] }),
  });
}

export function useUpdateChecklist(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; order?: number }) =>
      checklistsApi.updateChecklist(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', issueId] }),
  });
}

export function useDeleteChecklist(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistsApi.deleteChecklist(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', issueId] }),
  });
}

export function useCreateChecklistItem(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, ...data }: { checklistId: string; title: string; order?: number; assigneeId?: string }) =>
      checklistsApi.createItem(checklistId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', issueId] }),
  });
}

export function useUpdateChecklistItem(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; isCompleted?: boolean; order?: number; assigneeId?: string | null }) =>
      checklistsApi.updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', issueId] }),
  });
}

export function useDeleteChecklistItem(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checklistsApi.deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', issueId] }),
  });
}
