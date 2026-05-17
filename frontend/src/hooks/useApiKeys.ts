import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '../api/api-keys.api';

export function useApiKeys() {
  return useQuery({ queryKey: ['api-keys'], queryFn: apiKeysApi.list });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, scopes, expiresAt }: { name: string; scopes: string[]; expiresAt?: string }) =>
      apiKeysApi.create(name, scopes, expiresAt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}
