'use client';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { usePlayerStore } from '@/stores/player';
import Link from 'next/link';
import { useUiStore } from '@/stores/ui';
import { useIsLiked, useToggleFavorite } from '@/hooks/useFavorites';
import type { LyricsResponse } from '@/hooks/useLyrics';
import { isPreview } from '@/lib/types';
import { toast } from '@/stores/toast';

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function Player() {
  const {
    current, isPlaying, progress, duration, volume, muted, shuffle, repeat,
    toggle, next, prev, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat,
  } = usePlayerStore();
  const seekRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLDivElement>(null);
  const lyricsOpen = useUiStore((s) => s.lyricsOpen);
  const toggleLyrics = useUiStore((s) => s.toggleLyrics);
  const queueOpen = useUiStore((s) => s.queueOpen);
  const toggleQueue = useUiStore((s) => s.toggleQueue);
  const openActivity = useUiStore((s) => s.openActivity);
  const qc = useQueryClient();
  const liked = useIsLiked(current?.id);
  const toggleFav = useToggleFavorite();
  const toggleLike = () => {
    if (isPreview(current)) {
      toast.info('Not in your library yet', 'Use “Import & play” to save it, then like it.');
      return;
    }
    if (current?.id) toggleFav.mutate({ songId: current.id, liked });
  };

  // Prefetch lyrics as soon as a track starts so opening the panel is instant.
  useEffect(() => {
    if (!current?.id || isPreview(current)) return;
    qc.prefetchQuery({
      queryKey: ['lyrics', current.id],
      queryFn: () => api.get<LyricsResponse>(`/api/songs/${current.id}/lyrics`),
      staleTime: 30 * 60_000,
    });
  }, [current?.id, qc]);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const cover = current?.cover ?? '/assets/cover-tide.svg';
  const title = current?.title ?? 'Neon Tide';
  const artist = current?.artist?.name ?? 'Solstate';
  // The artist page lists everything they have; previews aren't in the catalogue,
  // so those fall back to a search for the channel name.
  const artistSlug = !isPreview(current) ? current?.artist?.slug : undefined;
  const artistHref = artistSlug
    ? `/artist/${artistSlug}`
    : `/search?q=${encodeURIComponent(artist)}`;

  const onBar = (
    e: React.PointerEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement | null>,
    apply: (p: number) => void,
  ) => {
    const el = ref.current;
    if (!el) return;
    const move = (clientX: number) => {
      const r = el.getBoundingClientRect();
      apply(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
    };
    move(e.clientX);
    const onMove = (ev: PointerEvent) => move(ev.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <footer
      className={`player surface${isPlaying ? '' : ' paused'}`}
      id="player"
      data-screen-label="Music Player"
    >
      <div className="player-desktop">
        <div className="np">
          <div
            className="cover np-open"
            role="button"
            tabIndex={0}
            title="Show poster"
            onClick={openActivity}
            onKeyDown={(e) => e.key === 'Enter' && openActivity()}
          >
            <img src={cover} alt="" id="npCover" />
          </div>
          <div className="meta">
            <div className="t" id="npTitle">{title}</div>
            {current ? (
              <Link className="a np-link" id="npArtist" href={artistHref}>
                {artist}
              </Link>
            ) : (
              <div className="a" id="npArtist">{artist}</div>
            )}
          </div>
          <button
            className={`like${liked ? ' on' : ''}`}
            title={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            onClick={toggleLike}
          >
            <Icon name="heart" size={18} style={liked ? { fill: 'currentColor' } : undefined} />
          </button>
        </div>

        <div className="transport">
          <div className="tctrl">
            <button
              className={`tg${shuffle ? ' on' : ''}`}
              title="Shuffle"
              onClick={toggleShuffle}
            >
              <Icon name="shuffle" size={18} />
            </button>
            <button title="Previous" onClick={prev}>
              <Icon name="skip-back" size={20} />
            </button>
            <button className="play" title="Play/Pause" onClick={toggle}>
              <Icon name={isPlaying ? 'pause' : 'play'} size={20} />
            </button>
            <button title="Next" onClick={next}>
              <Icon name="skip-forward" size={20} />
            </button>
            <button
              className={`tg${repeat !== 'off' ? ' on' : ''}`}
              title={`Repeat: ${repeat}`}
              onClick={cycleRepeat}
            >
              <Icon name={repeat === 'one' ? 'repeat-1' : 'repeat'} size={18} />
            </button>
          </div>
          <div className="scrub">
            <span className="time">{fmt(progress)}</span>
            <div
              className="bar"
              ref={seekRef}
              onPointerDown={(e) => onBar(e, seekRef, (p) => seek(p * duration))}
            >
              <div className="fill" style={{ width: `${pct}%` }} />
              <div className="knob" style={{ left: `${pct}%` }} />
            </div>
            <span className="time">{fmt(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <button
            className={lyricsOpen ? 'on' : ''}
            title="Lyrics"
            onClick={toggleLyrics}
          >
            <Icon name="mic-vocal" size={18} />
          </button>
          <button
            className={queueOpen ? 'on' : ''}
            title="Queue"
            onClick={toggleQueue}
          >
            <Icon name="list-music" size={18} />
          </button>
          <button title="Connect to device"><Icon name="cast" size={18} /></button>
          <div className="vol">
            <button onClick={toggleMute} aria-label="Mute">
              <Icon name={muted || volume === 0 ? 'volume-x' : 'volume-2'} size={18} />
            </button>
            <div
              className="bar"
              ref={volRef}
              onPointerDown={(e) => onBar(e, volRef, setVolume)}
            >
              <div className="fill" style={{ width: `${volPct}%` }} />
            </div>
          </div>
          <button title="Fullscreen"><Icon name="maximize-2" size={17} /></button>
        </div>
      </div>

      {/* mobile mini player */}
      <div className="mini">
        <div className="mini-prog">
          <div className="f" style={{ width: `${pct}%` }} />
        </div>
        <div className="np">
          <div
            className="cover np-open"
            role="button"
            tabIndex={0}
            title="Show poster"
            onClick={openActivity}
            style={{ width: 46, height: 46, borderRadius: 7, overflow: 'hidden', flex: 'none' }}
          >
            <img src={cover} alt="" />
          </div>
          <div className="meta">
            <div className="t">{title}</div>
            {current ? (
              <Link className="a np-link" href={artistHref}>{artist}</Link>
            ) : (
              <div className="a">{artist}</div>
            )}
          </div>
        </div>
        <div className="mctrl">
          <button onClick={toggleLike} className={liked ? 'on' : ''}>
            <Icon name="heart" size={20} style={liked ? { fill: 'currentColor', color: 'var(--brand)' } : undefined} />
          </button>
          <button className="play" onClick={toggle}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
}
