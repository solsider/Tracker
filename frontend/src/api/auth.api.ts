import client from './client';
import type { User, SystemRole } from '../types';

interface AuthSuccess { user: User }

export const authApi = {
  register: async (data: {
    email: string;
    name: string;
    password: string;
    systemRole?: SystemRole;
  }): Promise<AuthSuccess> => {
    const res = await client.post<AuthSuccess>('/auth/register', data);
    return res.data;
  },

  login: async (data: {
    email: string;
    password: string;
    twoFactorCode?: string;
  }): Promise<AuthSuccess> => {
    const res = await client.post<AuthSuccess>('/auth/login', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const res = await client.get<User>('/auth/me');
    return res.data;
  },
};
