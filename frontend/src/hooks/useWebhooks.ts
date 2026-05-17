import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksApi } from '../api/webhooks.api';

export function useWebhooks(projectId: string) {
  return useQuery({
    queryKey: ['webhooks', projectId],
    queryFn: () => webhooksApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateWebhook(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string; secret?: string; events: string[] }) =>
      webhooksApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', projectId] }),
  });
}

export function useUpdateWebhook(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; isActive?: boolean; events?: string[] }) =>
      webhooksApi.update(projectId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', projectId] }),
  });
}

export function useDeleteWebhook(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => webhooksApi.delete(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', projectId] }),
  });
}

export function useWebhookDeliveries(projectId: string, webhookId: string) {
  return useQuery({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: () => webhooksApi.deliveries(projectId, webhookId),
    enabled: !!webhookId,
  });
}
