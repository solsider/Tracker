import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi } from '../api/issues.api';
import type { Column, CreateIssueDto, Issue, UpdateIssueDto } from '../types';

export function useIssues(projectId: string) {
  return useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => issuesApi.getAll(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useIssue(projectId: string, number: number) {
  return useQuery({
    queryKey: ['issues', projectId, number],
    queryFn: () => issuesApi.getByNumber(projectId, number),
    enabled: !!projectId && !!number,
    staleTime: 30_000,
  });
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIssueDto) => issuesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });
}

export function useUpdateIssue(projectId: string, number: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIssueDto) => issuesApi.update(projectId, number, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId, number] });
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (number: number) => issuesApi.delete(projectId, number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });
}

export function useMoveIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      columnId,
      afterId,
      beforeId,
    }: {
      id: string;
      columnId: string;
      afterId?: string;
      beforeId?: string;
    }) => issuesApi.moveToColumn(id, columnId, afterId, beforeId),

    onMutate: async ({ id, columnId, afterId, beforeId }) => {
      await queryClient.cancelQueries({ queryKey: ['issues', projectId] });
      const previous = queryClient.getQueryData<Issue[]>(['issues', projectId]);
      const columns = queryClient.getQueryData<Column[]>(['columns', projectId]);
      const targetColumn = columns?.find((c) => c.id === columnId);

      queryClient.setQueryData<Issue[]>(['issues', projectId], (old) => {
        if (!old) return [];

        const afterIssue = afterId ? old.find((i) => i.id === afterId) : undefined;
        const beforeIssue = beforeId ? old.find((i) => i.id === beforeId) : undefined;

        let newOrder: number;
        if (afterIssue && beforeIssue) {
          newOrder = (afterIssue.order + beforeIssue.order) / 2;
        } else if (afterIssue) {
          newOrder = afterIssue.order + 1.0;
        } else if (beforeIssue) {
          newOrder = beforeIssue.order - 0.5;
        } else {
          const colIssues = old.filter((i) => i.columnId === columnId);
          const maxOrder = colIssues.length
            ? Math.max(...colIssues.map((i) => i.order))
            : 0;
          newOrder = maxOrder + 1.0;
        }

        return old.map((issue) =>
          issue.id === id
            ? {
                ...issue,
                columnId,
                order: newOrder,
                column: targetColumn
                  ? {
                      id: targetColumn.id,
                      title: targetColumn.title,
                      color: targetColumn.color,
                      order: targetColumn.order,
                    }
                  : { ...issue.column, id: columnId },
              }
            : issue,
        );
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['issues', projectId], context.previous);
      } else {
        // context missing (network failure before mutation started) — force refetch
        queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      }
    },
  });
}
