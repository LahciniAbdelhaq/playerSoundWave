'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Song } from '@/lib/types';

export interface YoutubeResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export function useYoutubeSearch(query: string) {
  return useQuery({
    queryKey: ['youtube-search', query],
    queryFn: () =>
      api.get<YoutubeResult[]>(`/api/youtube/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
    staleTime: 5 * 60_000,
  });
}

/**
 * Import a search result into the library. Title/channel/duration are sent
 * along so the server can save a linked track when it can't download
 * (YouTube blocks downloads from cloud hosts like Vercel).
 */
export function useYoutubeImport() {
  return useMutation({
    mutationFn: (r: YoutubeResult) =>
      api.post<Song>('/api/youtube/import', {
        url: r.url,
        title: r.title,
        uploader: r.uploader,
        duration: Math.round(r.duration) || undefined,
      }),
  });
}

/** A search result as a playable, not-yet-imported track (YouTube embed). */
export function youtubePreviewSong(r: YoutubeResult): Song {
  return {
    id: `yt:${r.id}`,
    title: r.title,
    duration: r.duration,
    cover: r.thumbnail,
    streamUrl: '',
    youtubeId: r.id,
    artist: { id: '', name: r.uploader, slug: '' },
  };
}
