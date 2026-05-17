import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { disconnectSocket } from '../socket/socket';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      setAuth(user);
      navigate('/projects');
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => {
      setAuth(user);
      navigate('/projects');
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort — clear client state regardless
    }
    disconnectSocket();
    clearAuth();
    queryClient.clear();
    navigate('/login');
  };
}
