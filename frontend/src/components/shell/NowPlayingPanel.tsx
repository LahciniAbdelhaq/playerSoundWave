'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';
import { usePlayerStore } from '@/stores/player';
import { useArtist } from '@/hooks/useCatalog';
import { isPreview } from '@/lib/types';

const FALLBACK = '/assets/cover-tide.svg';

/**
 * Right rail: what's playing now — a large poster you can switch between the
 * song's artwork and the artist's photo, the artist (linked to everything they
 * have), and the rest of the queue.
 */
export function NowPlayingPanel() {
  const [view, setView] = useState<'song' | 'artist'>('song');
  const activityOpen = useUiStore((s) => s.activityOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const { queue, index, current, isPlaying, playAt } = usePlayerStore();

  // Artist photo + track count come from the catalogue; previews aren't in it.
  const slug = !isPreview(current) ? current?.artist?.slug : undefined;
  const { data: artist } = useArtist(slug || '');

  // Artwork is the sensible default whenever the track changes.
  useEffect(() => setView('song'), [current?.id]);

  const artistName = current?.artist?.name ?? 'Unknown artist';
  const artistHref = slug ? `/artist/${slug}` : `/search?q=${encodeURIComponent(artistName)}`;
  const poster =
    view === 'artist' ? artist?.image ?? current?.cover ?? FALLBACK : current?.cover ?? FALLBACK;
  const upNext = queue.slice(index + 1);

  return (
    <aside
      className={`activity surface${activityOpen ? ' open' : ''}`}
      id="activity"
      data-screen-label="Now Playing Panel"
    >
      <div className="act-head">
        <span className="t">Now playing</span>
        {isPlaying && current && (
          <span className="eq-mini" aria-hidden>
            <i /><i /><i />
          </span>
        )}
        <button className="round-btn x" style={{ marginLeft: 'auto' }} onClick={closeDrawers}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="act-scroll">
        {current ? (
          <>
            <div className="np-poster">
              <img src={poster} alt={view === 'artist' ? artistName : current.title} />
            </div>

            <div className="act-tabs np-poster-tabs">
              <button
                className={`act-tab${view === 'song' ? ' active' : ''}`}
                onClick={() => setView('song')}
              >
                Song
              </button>
              <button
                className={`act-tab${view === 'artist' ? ' active' : ''}`}
                onClick={() => setView('artist')}
              >
                Artist
              </button>
            </div>

            <div className="np-meta">
              <div className="np-title">{current.title}</div>
              <Link className="np-artist" href={artistHref} onClick={closeDrawers}>
                {artistName}
                <Icon name="chevron-right" size={15} />
              </Link>
              {artist?.listeners ? (
                <div className="np-sub">{artist.listeners.toLocaleString()} listeners</div>
              ) : null}
            </div>

            <div className="act-section">Next in queue</div>
            {upNext.length > 0 ? (
              upNext.map((s, i) => (
                <div
                  className="friend"
                  key={`${s.id}-${i}`}
                  onClick={() => playAt(index + 1 + i)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="av">
                    <div className="cover" style={{ borderRadius: 7 }}>
                      <img src={s.cover ?? FALLBACK} alt="" />
                    </div>
                  </div>
                  <div className="info">
                    <div className="n">{s.title}</div>
                    <div className="artist">{s.artist.name}</div>
                  </div>
                  <Icon name="play" size={16} />
                </div>
              ))
            ) : (
              <div className="sr-empty">Nothing queued after this track.</div>
            )}
          </>
        ) : (
          <div className="sr-empty">Play something to see it here.</div>
        )}
      </div>
    </aside>
  );
}
