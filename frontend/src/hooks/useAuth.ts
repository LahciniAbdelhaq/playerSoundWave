'use client';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { AuthSession } from '@/lib/types';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthSession>('/api/auth/login', body),
    onSuccess: (s) => setSession(s),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (body: { username: string; email: string; password: string }) =>
      api.post<AuthSession>('/api/auth/register', body),
    onSuccess: (s) => setSession(s),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout', { refreshToken }),
    onSettled: () => clear(),
  });
}
