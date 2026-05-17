import client from './client';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../types';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const res = await client.get<Project[]>('/projects');
    return res.data;
  },

  getById: async (id: string): Promise<Project> => {
    const res = await client.get<Project>(`/projects/${id}`);
    return res.data;
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const res = await client.post<Project>('/projects', data);
    return res.data;
  },

  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const res = await client.patch<Project>(`/projects/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/projects/${id}`);
  },

  addMember: async (
    projectId: string,
    data: { userId: string; role?: string },
  ): Promise<void> => {
    await client.post(`/projects/${projectId}/members`, data);
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await client.delete(`/projects/${projectId}/members/${userId}`);
  },
};
