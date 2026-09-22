'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useMyPlaylists, useAddToPlaylist, useCreatePlaylist } from '@/hooks/usePlaylists';
import { useIsLiked, useToggleFavorite } from '@/hooks/useFavorites';
import { toast } from '@/stores/toast';

interface SongMenuProps {
  songId: string;
  title?: string;
  /** visual size of the trigger icon */
  size?: number;
  className?: string;
}

/** "…" actions menu for a song: like + add to playlist. Reused on every row. */
export function SongMenu({ songId, title = 'this song', size = 16, className }: SongMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: playlists } = useMyPlaylists();
  const addToPlaylist = useAddToPlaylist();
  const createPlaylist = useCreatePlaylist();
  const liked = useIsLiked(songId);
  const toggleFav = useToggleFavorite();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const add = (playlistId: string, name: string) => {
    addToPlaylist.mutate(
      { playlistId, songId },
      { onSuccess: () => toast.success('Added to playlist', name) },
    );
    setOpen(false);
  };

  const createAndAdd = () => {
    createPlaylist.mutate(
      { title: 'New Playlist' },
      {
        onSuccess: (p) => {
          addToPlaylist.mutate({ playlistId: p.id, songId });
          toast.success('Added to new playlist');
          router.push(`/playlist/${p.id}`);
        },
      },
    );
    setOpen(false);
  };

  return (
    <div className={`dropdown${open ? ' open' : ''}`} ref={ref} onClick={stop}>
      <button
        className={`icon-btn ${className ?? ''}`}
        title="More"
        onClick={() => setOpen((o) => !o)}
        aria-label="Song actions"
      >
        <Icon name="ellipsis" size={size} />
      </button>

      <div className="menu right" style={{ minWidth: 240 }}>
        <button
          className="menu-item"
          onClick={() => {
            toggleFav.mutate({ songId, liked });
            setOpen(false);
          }}
        >
          <Icon name="heart" size={16} style={liked ? { fill: 'currentColor' } : undefined} />
          {liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        </button>

        <div className="menu-sep" />
        <div className="menu-label">Add to playlist</div>

        <button className="menu-item" onClick={createAndAdd}>
          <Icon name="plus" size={16} />
          New playlist
        </button>

        {(playlists ?? []).map((p) => (
          <button key={p.id} className="menu-item" onClick={() => add(p.id, p.title)}>
            <Icon name="list-music" size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.title}
            </span>
          </button>
        ))}

        {playlists && playlists.length === 0 && (
          <div className="menu-item" style={{ color: 'var(--text-tertiary)', cursor: 'default' }}>
            No playlists yet
          </div>
        )}
      </div>
    </div>
  );
}
