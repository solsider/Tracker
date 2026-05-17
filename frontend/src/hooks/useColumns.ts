import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { columnsApi } from '../api/columns.api';
import type { Column, CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from '../types';

export function useColumns(projectId: string) {
  return useQuery({
    queryKey: ['columns', projectId],
    queryFn: () => columnsApi.getAll(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useCreateColumn(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateColumnDto) => columnsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
    },
  });
}

export function useUpdateColumn(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateColumnDto }) =>
      columnsApi.update(projectId, id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['columns', projectId] });
      const previous = queryClient.getQueryData<Column[]>(['columns', projectId]);
      queryClient.setQueryData<Column[]>(['columns', projectId], (old) => {
        if (!old) return old;
        return old.map((col) => (col.id === id ? { ...col, ...data } : col));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['columns', projectId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
    },
  });
}

export function useDeleteColumn(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => columnsApi.delete(projectId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['columns', projectId] });
      const previous = queryClient.getQueryData<Column[]>(['columns', projectId]);
      queryClient.setQueryData<Column[]>(['columns', projectId], (old) => {
        if (!old) return old;
        return old.filter((col) => col.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['columns', projectId], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
    },
  });
}

export function useReorderColumns(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderColumnsDto) => columnsApi.reorder(projectId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['columns', projectId] });
      const previous = queryClient.getQueryData<Column[]>(['columns', projectId]);
      queryClient.setQueryData<Column[]>(['columns', projectId], (old) => {
        if (!old) return old;
        const orderMap = new Map(data.orders.map((o) => [o.id, o.order]));
        return [...old]
          .map((col) => ({ ...col, order: orderMap.get(col.id) ?? col.order }))
          .sort((a, b) => a.order - b.order);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['columns', projectId], context.previous);
      }
    },
  });
}
