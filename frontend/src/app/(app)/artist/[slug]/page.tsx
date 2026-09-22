'use client';
import { use } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useArtist } from '@/hooks/useCatalog';
import { TrackList } from '@/components/TrackList';
import { usePlayerStore } from '@/stores/player';

export default function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: artist, isLoading } = useArtist(slug);
  const playQueue = usePlayerStore((s) => s.playQueue);

  if (isLoading) return <div className="sr-empty">Loading artist…</div>;
  if (!artist) return <div className="sr-empty">Artist not found.</div>;

  const songs = (artist.topSongs ?? []).map((s) => ({
    ...s,
    artist: { id: artist.id, name: artist.name, slug: artist.slug },
  }));

  return (
    <>
      <div className="album-card" style={{ marginBottom: 'var(--space-6)', border: 'none', background: 'transparent', padding: 0 }}>
        <div className="cover" style={{ width: 200, height: 200, borderRadius: 999 }}>
          <img src={artist.image ?? '/assets/cover-bloom.svg'} alt="" />
        </div>
        <div className="meta">
          <span className="tag">VERIFIED ARTIST</span>
          <h4 style={{ fontSize: 'var(--fs-display-lg)' }}>{artist.name}</h4>
          <div className="by">{artist.listeners.toLocaleString()} monthly listeners</div>
          {artist.bio && <p className="card-text" style={{ marginTop: 8 }}>{artist.bio}</p>}
          <div className="cta" style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
            <button className="btn btn-primary" onClick={() => playQueue(songs)}>
              <Icon name="play" size={18} />Play
            </button>
            <button className="btn btn-outline">Follow</button>
          </div>
        </div>
      </div>

      <div className="shelf-head"><h2>Popular</h2></div>
      <TrackList songs={songs} />

      {artist.albums && artist.albums.length > 0 && (
        <>
          <div className="shelf-head" style={{ marginTop: 'var(--space-7)' }}>
            <h2>Albums</h2>
          </div>
          <div className="card-shelf">
            {artist.albums.map((al) => (
              <Link className="pcard" href={`/album/${al.id}`} key={al.id}>
                <div className="cover">
                  <img src={al.cover ?? '/assets/cover-tide.svg'} alt="" />
                </div>
                <div className="pt">{al.title}</div>
                <p className="ps">Album</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
