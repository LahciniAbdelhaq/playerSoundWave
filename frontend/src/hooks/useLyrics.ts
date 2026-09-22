'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LyricsResponse {
  found: boolean;
  instrumental: boolean;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

export interface LrcLine {
  time: number; // seconds
  text: string;
}

/** Parse LRC "[mm:ss.xx] text" into time-sorted lines. */
export function parseLrc(lrc: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const raw of lrc.split('\n')) {
    const stamps = [...raw.matchAll(/\[(\d+):(\d+)(?:[.:](\d+))?\]/g)];
    if (!stamps.length) continue;
    const text = raw.replace(/\[(\d+):(\d+)(?:[.:](\d+))?\]/g, '').trim();
    for (const m of stamps) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const frac = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
      out.push({ time: min * 60 + sec + frac, text });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

export function useLyrics(songId: string | undefined) {
  return useQuery({
    queryKey: ['lyrics', songId],
    queryFn: () => api.get<LyricsResponse>(`/api/songs/${songId}/lyrics`),
    enabled: !!songId,
    staleTime: 30 * 60_000,
    retry: 0,
  });
}
