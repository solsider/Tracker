import client from './client';
import type { User, SystemRole, UpdateProfileDto } from '../types';

export const usersApi = {
  updateProfile: async (data: UpdateProfileDto): Promise<User> => {
    const res = await client.patch<User>('/users/me', data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await client.patch('/users/me/password', data);
  },

  setup2FA: async (): Promise<{ secret: string; otpauthUrl: string }> => {
    const res = await client.post<{ secret: string; otpauthUrl: string }>(
      '/users/me/2fa/setup',
    );
    return res.data;
  },

  enable2FA: async (code: string): Promise<User> => {
    const res = await client.post<User>('/users/me/2fa/enable', { code });
    return res.data;
  },

  disable2FA: async (): Promise<User> => {
    const res = await client.delete<User>('/users/me/2fa');
    return res.data;
  },

  assignRole: async (userId: string, systemRole: SystemRole): Promise<User> => {
    const res = await client.patch<User>(`/admin/users/${userId}/role`, { systemRole });
    return res.data;
  },
};
