'use client';
import { Icon } from '@/components/Icon';
import { useIsLiked, useToggleFavorite } from '@/hooks/useFavorites';

/** Heart toggle for a song. Stops row-click propagation. */
export function LikeButton({ songId, size = 18 }: { songId: string; size?: number }) {
  const liked = useIsLiked(songId);
  const toggle = useToggleFavorite();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate({ songId, liked });
      }}
      title={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        display: 'grid',
        placeItems: 'center',
        color: liked ? 'var(--brand)' : 'var(--text-tertiary)',
      }}
    >
      <Icon name="heart" size={size} style={liked ? { fill: 'currentColor' } : undefined} />
    </button>
  );
}
