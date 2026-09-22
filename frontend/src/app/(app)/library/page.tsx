'use client';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { useSongs } from '@/hooks/useCatalog';
import { useAuthStore } from '@/stores/auth';
import type { Song } from '@/lib/types';

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user);

  // Everything you imported (YouTube) or uploaded lands here, newest first.
  const { data: recent } = useSongs('latest', 50);

  const { data: liked } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get<Song[]>('/api/favorites'),
    enabled: !!user,
  });

  const recentSongs = recent?.items ?? [];

  return (
    <>
      <div className="hero-greet">
        <div>
          <h1>Your Library</h1>
          <div className="sub">Imported &amp; uploaded songs, liked tracks and playlists.</div>
        </div>
      </div>

      <div className="shelf-head"><h2>Recently added</h2></div>
      {recentSongs.length > 0 ? (
        <TrackList songs={recentSongs} />
      ) : (
        <div className="sr-empty">
          No songs yet. Import from YouTube or upload a file to get started.
        </div>
      )}

      <div className="shelf-head" style={{ marginTop: 'var(--space-7)' }}>
        <h2>Liked Songs</h2>
      </div>
      {!user ? (
        <div className="banner info" style={{ maxWidth: 520 }}>
          <Icon name="info" className="b-icon" />
          <div>
            <div className="b-title">Sign in to see your liked songs</div>
            <div className="b-text">Your liked songs, playlists, and history live here.</div>
          </div>
        </div>
      ) : liked && liked.length > 0 ? (
        <TrackList songs={liked} />
      ) : (
        <div className="sr-empty">No liked songs yet.</div>
      )}
    </>
  );
}
