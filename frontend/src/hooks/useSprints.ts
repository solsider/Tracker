import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sprintsApi } from '../api/sprints.api';

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => sprintsApi.getByProject(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
  });
}

export function useBacklog(projectId: string) {
  return useQuery({
    queryKey: ['backlog', projectId],
    queryFn: () => sprintsApi.getBacklog(projectId),
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
      sprintsApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}

export function useUpdateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; goal?: string; startDate?: string; endDate?: string }) =>
      sprintsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}

export function useStartSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sprintsApi.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}

export function useCompleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sprintsApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}

export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sprintsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}
