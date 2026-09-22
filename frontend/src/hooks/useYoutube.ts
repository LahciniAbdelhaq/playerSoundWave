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

export function useYoutubeImport() {
  return useMutation({
    mutationFn: (url: string) => api.post<Song>('/api/youtube/import', { url }),
  });
}
