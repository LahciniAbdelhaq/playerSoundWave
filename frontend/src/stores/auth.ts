'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, User } from '@/lib/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (s: AuthSession) => void;
  clear: () => void;
  refresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (s) =>
        set({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!res.ok) {
            get().clear();
            return false;
          }
          const session: AuthSession = await res.json();
          get().setSession(session);
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'sw-auth' },
  ),
);
