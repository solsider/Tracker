import client from './client';
import type { Checklist, ChecklistItem } from '../types';

export const checklistsApi = {
  getByIssue: async (issueId: string): Promise<Checklist[]> => {
    const res = await client.get<Checklist[]>(`/issues/${issueId}/checklists`);
    return res.data;
  },

  createChecklist: async (issueId: string, data: { title: string; order?: number }): Promise<Checklist> => {
    const res = await client.post<Checklist>(`/issues/${issueId}/checklists`, data);
    return res.data;
  },

  updateChecklist: async (id: string, data: { title?: string; order?: number }): Promise<Checklist> => {
    const res = await client.patch<Checklist>(`/checklists/${id}`, data);
    return res.data;
  },

  deleteChecklist: async (id: string): Promise<void> => {
    await client.delete(`/checklists/${id}`);
  },

  createItem: async (checklistId: string, data: { title: string; order?: number; assigneeId?: string }): Promise<ChecklistItem> => {
    const res = await client.post<ChecklistItem>(`/checklists/${checklistId}/items`, data);
    return res.data;
  },

  updateItem: async (itemId: string, data: { title?: string; isCompleted?: boolean; order?: number; assigneeId?: string | null }): Promise<ChecklistItem> => {
    const res = await client.patch<ChecklistItem>(`/checklist-items/${itemId}`, data);
    return res.data;
  },

  deleteItem: async (itemId: string): Promise<void> => {
    await client.delete(`/checklist-items/${itemId}`);
  },
};
