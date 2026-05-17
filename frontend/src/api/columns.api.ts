import client from './client';
import type { Column, CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from '../types';

export const columnsApi = {
  getAll: async (projectId: string): Promise<Column[]> => {
    const res = await client.get<Column[]>(`/projects/${projectId}/columns`);
    return res.data;
  },

  create: async (projectId: string, data: CreateColumnDto): Promise<Column> => {
    const res = await client.post<Column>(`/projects/${projectId}/columns`, data);
    return res.data;
  },

  update: async (projectId: string, id: string, data: UpdateColumnDto): Promise<Column> => {
    const res = await client.patch<Column>(`/projects/${projectId}/columns/${id}`, data);
    return res.data;
  },

  delete: async (projectId: string, id: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/columns/${id}`);
  },

  reorder: async (projectId: string, data: ReorderColumnsDto): Promise<void> => {
    await client.patch(`/projects/${projectId}/columns/reorder`, data);
  },
};
