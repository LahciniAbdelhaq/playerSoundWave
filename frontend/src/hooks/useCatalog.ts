'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Album, Artist, Paginated, Song } from '@/lib/types';

export function useSongs(sort: 'trending' | 'latest' | 'top' = 'trending', take = 10) {
  return useQuery({
    queryKey: ['songs', sort, take],
    queryFn: () => api.get<Paginated<Song>>(`/api/songs?sort=${sort}&take=${take}`),
  });
}

export function useArtists(take = 10) {
  return useQuery({
    queryKey: ['artists', take],
    queryFn: () => api.get<Paginated<Artist>>(`/api/artists?take=${take}`),
  });
}

export function useAlbums(take = 10) {
  return useQuery({
    queryKey: ['albums', take],
    queryFn: () => api.get<Paginated<Album>>(`/api/albums?take=${take}`),
  });
}

export function useArtist(idOrSlug: string) {
  return useQuery({
    queryKey: ['artist', idOrSlug],
    queryFn: () => api.get<Artist>(`/api/artists/${idOrSlug}`),
    enabled: !!idOrSlug,
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: ['album', id],
    queryFn: () => api.get<Album>(`/api/albums/${id}`),
    enabled: !!id,
  });
}
