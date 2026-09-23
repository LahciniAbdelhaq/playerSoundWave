'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';
import { usePlayerStore } from '@/stores/player';
import { useArtist } from '@/hooks/useCatalog';
import { useYoutubeSearch, youtubePreviewSong } from '@/hooks/useYoutube';
import { isPreview } from '@/lib/types';

const FALLBACK = '/assets/cover-tide.svg';

/** One compact row in the rail (queue track, artist track or album). */
function Row({
  cover,
  title,
  sub,
  onPlay,
}: {
  cover?: string | null;
  title: string;
  sub: string;
  onPlay: () => void;
}) {
  return (
    <div className="friend" onClick={onPlay} style={{ cursor: 'pointer' }}>
      <div className="av">
        <div className="cover" style={{ borderRadius: 7 }}>
          <img src={cover ?? FALLBACK} alt="" />
        </div>
      </div>
      <div className="info">
        <div className="n">{title}</div>
        <div className="artist">{sub}</div>
      </div>
      <Icon name="play" size={16} />
    </div>
  );
}

/**
 * Right rail: what's playing now — a large poster you can switch between the
 * song's artwork and the artist's photo, the artist (linked to everything they
 * have), and the rest of the queue.
 */
export function NowPlayingPanel() {
  const [view, setView] = useState<'song' | 'artist'>('song');
  const activityOpen = useUiStore((s) => s.activityOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const { queue, index, current, isPlaying, playAt, playSong } = usePlayerStore();

  // Artist photo, songs and albums come from the catalogue. Previews aren't in
  // it, so for those the artist's other songs come from a YouTube search.
  const slug = !isPreview(current) ? current?.artist?.slug : undefined;
  const { data: artist, isLoading: loadingArtist } = useArtist(slug || '');
  const wantsYoutube = view === 'artist' && !slug;
  const { data: ytSongs, isFetching: loadingYoutube } = useYoutubeSearch(
    wantsYoutube ? current?.artist?.name ?? '' : '',
  );

  // Artwork is the sensible default whenever the track changes.
  useEffect(() => setView('song'), [current?.id]);

  const artistName = current?.artist?.name ?? 'Unknown artist';
  const artistHref = slug
    ? `/artist/${slug}`
    : `/search?q=${encodeURIComponent(artistName)}&tab=youtube`;
  const poster =
    view === 'artist' ? artist?.image ?? current?.cover ?? FALLBACK : current?.cover ?? FALLBACK;
  const upNext = queue.slice(index + 1);
  // Other songs by this artist, minus the one playing.
  const artistSongs = (
    slug ? artist?.topSongs ?? [] : (ytSongs ?? []).map(youtubePreviewSong)
  ).filter((s) => s.id !== current?.id);
  const loadingMore = slug ? loadingArtist : loadingYoutube;

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

            {view === 'song' ? (
              <>
                <div className="act-section">Next in queue</div>
                {upNext.length > 0 ? (
                  upNext.map((s, i) => (
                    <Row
                      key={`${s.id}-${i}`}
                      cover={s.cover}
                      title={s.title}
                      sub={s.artist.name}
                      onPlay={() => playAt(index + 1 + i)}
                    />
                  ))
                ) : (
                  <div className="sr-empty">Nothing queued after this track.</div>
                )}
              </>
            ) : (
              <>
                <div className="act-section">More from {artistName}</div>
                {artistSongs.length > 0 ? (
                  artistSongs.map((s, i) => (
                    <Row
                      key={`${s.id}-${i}`}
                      cover={s.cover}
                      title={s.title}
                      sub={s.artist.name}
                      onPlay={() => playSong(s, artistSongs)}
                    />
                  ))
                ) : (
                  <div className="sr-empty">
                    {loadingMore ? 'Looking for more…' : 'No other songs found.'}
                  </div>
                )}

                {(artist?.albums?.length ?? 0) > 0 && (
                  <>
                    <div className="act-section">Albums</div>
                    {artist!.albums!.map((al) => (
                      <Link
                        className="friend"
                        href={`/album/${al.id}`}
                        key={al.id}
                        onClick={closeDrawers}
                      >
                        <div className="av">
                          <div className="cover" style={{ borderRadius: 7 }}>
                            <img src={al.cover ?? FALLBACK} alt="" />
                          </div>
                        </div>
                        <div className="info">
                          <div className="n">{al.title}</div>
                          <div className="artist">Album</div>
                        </div>
                        <Icon name="chevron-right" size={16} />
                      </Link>
                    ))}
                  </>
                )}

                <Link className="btn btn-secondary sm np-seeall" href={artistHref} onClick={closeDrawers}>
                  See everything from {artistName}
                </Link>
              </>
            )}
          </>
        ) : (
          <div className="sr-empty">Play something to see it here.</div>
        )}
      </div>
    </aside>
  );
}
