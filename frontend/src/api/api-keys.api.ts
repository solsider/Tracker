import client from './client';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse extends ApiKey {
  key: string; // shown once
}

export const apiKeysApi = {
  list: () => client.get<ApiKey[]>('/api-keys').then((r) => r.data),
  create: (name: string, scopes: string[], expiresAt?: string) =>
    client.post<CreateApiKeyResponse>('/api-keys', { name, scopes, expiresAt }).then((r) => r.data),
  revoke: (id: string) => client.delete(`/api-keys/${id}`).then((r) => r.data),
};
