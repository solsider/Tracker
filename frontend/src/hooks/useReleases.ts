import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { releasesApi, type ReleaseStatus } from '../api/releases.api';

export function useReleases(projectId: string) {
  return useQuery({
    queryKey: ['releases', projectId],
    queryFn: () => releasesApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useRelease(projectId: string, id: string) {
  return useQuery({
    queryKey: ['releases', projectId, id],
    queryFn: () => releasesApi.get(projectId, id),
    enabled: !!projectId && !!id,
  });
}

export function useCreateRelease(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { version: string; name?: string; description?: string }) =>
      releasesApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['releases', projectId] }),
  });
}

export function useUpdateRelease(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: ReleaseStatus; name?: string; description?: string; version?: string }) =>
      releasesApi.update(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['releases', projectId] }),
  });
}

export function useDeleteRelease(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releasesApi.delete(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['releases', projectId] }),
  });
}
