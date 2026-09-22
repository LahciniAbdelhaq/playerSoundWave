'use client';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import type { AuthSession } from '@/lib/types';

/**
 * Dev convenience: if there's no session yet, sign in with the seeded demo
 * account so per-user features (playlists, favorites, history) work without a
 * manual login. The user can still log out / log in as themselves.
 */
export function SessionBootstrap() {
  const tried = useRef(false);
  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    const { accessToken } = useAuthStore.getState();
    if (accessToken) return;
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jordan@soundwave.fm', password: 'password123' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: AuthSession | null) => s && useAuthStore.getState().setSession(s))
      .catch(() => undefined);
  }, []);
  return null;
}
