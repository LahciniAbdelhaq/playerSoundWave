'use client';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useArtist } from '@/hooks/useCatalog';
import { TrackList } from '@/components/TrackList';
import { YoutubeResults } from '@/components/YoutubeResults';
import { usePlayerStore } from '@/stores/player';
import type { Song } from '@/lib/types';

/**
 * Artist page body: what's in the library, their albums, and everything else
 * they have on YouTube. Separate from the route file because Next only allows
 * specific exports from page.tsx.
 */
export function ArtistView({ slug }: { slug: string }) {
  const { data: artist, isLoading } = useArtist(slug);
  const playQueue = usePlayerStore((s) => s.playQueue);

  if (isLoading) return <div className="sr-empty">Loading artist…</div>;
  if (!artist) return <div className="sr-empty">Artist not found.</div>;

  // Tracks come back without the artist attached — the endpoint already knows it.
  const songs: Song[] = (artist.topSongs ?? []).map((s) => ({
    ...s,
    artist: { id: artist.id, name: artist.name, slug: artist.slug },
  }));
  const albums = artist.albums ?? [];
  const listeners = artist.listeners ?? 0;

  return (
    <>
      <div
        className="album-card"
        style={{ marginBottom: 'var(--space-6)', border: 'none', background: 'transparent', padding: 0 }}
      >
        <div className="cover" style={{ width: 200, height: 200, borderRadius: 999 }}>
          <img src={artist.image ?? songs[0]?.cover ?? '/assets/cover-bloom.svg'} alt="" />
        </div>
        <div className="meta">
          <span className="tag">ARTIST</span>
          <h4 style={{ fontSize: 'var(--fs-display-lg)' }}>{artist.name}</h4>
          <div className="by">
            {listeners > 0
              ? `${listeners.toLocaleString()} monthly listeners`
              : `${songs.length} ${songs.length === 1 ? 'song' : 'songs'} in your library`}
          </div>
          {artist.bio && <p className="card-text" style={{ marginTop: 8 }}>{artist.bio}</p>}
          <div className="cta" style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
            <button
              className="btn btn-primary"
              onClick={() => playQueue(songs)}
              disabled={songs.length === 0}
            >
              <Icon name="play" size={18} />Play
            </button>
          </div>
        </div>
      </div>

      <div className="shelf-head"><h2>In your library</h2></div>
      {songs.length > 0 ? (
        <TrackList songs={songs} />
      ) : (
        <div className="sr-empty">Nothing from this artist saved yet.</div>
      )}

      {albums.length > 0 && (
        <>
          <div className="shelf-head" style={{ marginTop: 'var(--space-7)' }}>
            <h2>Albums</h2>
          </div>
          <div className="card-shelf">
            {albums.map((al) => (
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

      {/* Everything else this artist has, straight from YouTube: play without
          saving, or import into the library. */}
      <div className="shelf-head" style={{ marginTop: 'var(--space-7)' }}>
        <h2>More from {artist.name}</h2>
      </div>
      <YoutubeResults query={artist.name} />
    </>
  );
}
