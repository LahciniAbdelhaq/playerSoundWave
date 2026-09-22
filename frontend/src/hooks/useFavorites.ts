'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Set of liked song ids — drives the heart state everywhere. */
export function useLikedIds() {
  return useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: () => api.get<string[]>('/api/favorites/ids'),
    staleTime: 60_000,
  });
}

export function useIsLiked(songId: string | undefined) {
  const { data } = useLikedIds();
  return !!songId && !!data?.includes(songId);
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ songId, liked }: { songId: string; liked: boolean }) =>
      liked ? api.del(`/api/favorites/${songId}`) : api.post('/api/favorites', { songId }),
    // optimistic update of the liked-ids cache
    onMutate: async ({ songId, liked }) => {
      await qc.cancelQueries({ queryKey: ['favorites', 'ids'] });
      const prev = qc.getQueryData<string[]>(['favorites', 'ids']) ?? [];
      qc.setQueryData<string[]>(
        ['favorites', 'ids'],
        liked ? prev.filter((id) => id !== songId) : [...prev, songId],
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['favorites', 'ids'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['favorites', 'ids'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
