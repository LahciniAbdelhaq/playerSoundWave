'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Playlist } from '@/lib/types';

export interface PlaylistSummary {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  isPublic: boolean;
  songCount: number;
  updatedAt: string;
}

export function useMyPlaylists() {
  return useQuery({
    queryKey: ['playlists', 'mine'],
    queryFn: () => api.get<PlaylistSummary[]>('/api/playlists/mine'),
  });
}

export function usePlaylist(id: string | undefined) {
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () => api.get<Playlist & { tracks: any[]; owner: any }>(`/api/playlists/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      api.post<{ id: string }>('/api/playlists', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists', 'mine'] }),
  });
}

export function useUpdatePlaylist(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title?: string; description?: string; isPublic?: boolean }) =>
      api.patch(`/api/playlists/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlist', id] });
      qc.invalidateQueries({ queryKey: ['playlists', 'mine'] });
    },
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/playlists/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlists', 'mine'] }),
  });
}

export function useAddToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      api.post(`/api/playlists/${playlistId}/songs`, { songId }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['playlist', v.playlistId] });
      qc.invalidateQueries({ queryKey: ['playlists', 'mine'] });
    },
  });
}

export function useRemoveFromPlaylist(playlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (songId: string) => api.del(`/api/playlists/${playlistId}/songs/${songId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlist', playlistId] });
      qc.invalidateQueries({ queryKey: ['playlists', 'mine'] });
    },
  });
}

export function useReorderPlaylist(playlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (songIds: string[]) =>
      api.patch(`/api/playlists/${playlistId}/reorder`, { songIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playlist', playlistId] }),
  });
}
