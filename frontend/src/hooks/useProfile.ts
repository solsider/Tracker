import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import type { UpdateProfileDto } from '../types';

export function useUpdateProfile() {
  const { setAuth } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDto) => usersApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      setAuth(updatedUser);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(data),
  });
}

export function useSetup2FA() {
  return useMutation({
    mutationFn: usersApi.setup2FA,
  });
}

export function useEnable2FA() {
  const { setAuth } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => usersApi.enable2FA(code),
    onSuccess: (updatedUser) => {
      setAuth(updatedUser);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDisable2FA() {
  const { setAuth } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: usersApi.disable2FA,
    onSuccess: (updatedUser) => {
      setAuth(updatedUser);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
