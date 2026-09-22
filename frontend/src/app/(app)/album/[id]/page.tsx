'use client';
import { use } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useAlbum } from '@/hooks/useCatalog';
import { TrackList } from '@/components/TrackList';
import { usePlayerStore } from '@/stores/player';

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: album, isLoading } = useAlbum(id);
  const playQueue = usePlayerStore((s) => s.playQueue);

  if (isLoading) return <div className="sr-empty">Loading album…</div>;
  if (!album) return <div className="sr-empty">Album not found.</div>;

  const songs = (album.tracks ?? []).map((s) => ({
    ...s,
    artist: album.artist,
    album: { id: album.id, title: album.title, cover: album.cover },
  }));

  return (
    <>
      <div className="album-card" style={{ marginBottom: 'var(--space-6)', border: 'none', background: 'transparent', padding: 0 }}>
        <div className="cover" style={{ width: 200, height: 200 }}>
          <img src={album.cover ?? '/assets/cover-tide.svg'} alt="" />
        </div>
        <div className="meta">
          <span className="tag">ALBUM</span>
          <h4 style={{ fontSize: 'var(--fs-display-lg)' }}>{album.title}</h4>
          <Link className="by" href={`/artist/${album.artist.slug}`}>
            {album.artist.name}
          </Link>
          <div className="stats">
            {songs.length} songs
            {album.releaseDate
              ? ` · ${new Date(album.releaseDate).getFullYear()}`
              : ''}
          </div>
          <div className="cta" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => playQueue(songs)}>
              <Icon name="play" size={18} />Play
            </button>
          </div>
        </div>
      </div>

      <TrackList songs={songs} />
    </>
  );
}
