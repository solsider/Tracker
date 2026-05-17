import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi } from '../api/attachments.api';

export function useAttachments(projectId: string, issueNumber: number) {
  return useQuery({
    queryKey: ['attachments', projectId, issueNumber],
    queryFn: () => attachmentsApi.list(projectId, issueNumber),
    enabled: !!projectId && issueNumber > 0,
  });
}

export function useDeleteAttachment(projectId: string, issueNumber: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attachmentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', projectId, issueNumber] }),
  });
}
