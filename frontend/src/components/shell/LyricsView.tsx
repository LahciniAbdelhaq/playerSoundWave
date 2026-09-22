'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';
import { usePlayerStore, getAudio } from '@/stores/player';
import { useLyrics, parseLrc } from '@/hooks/useLyrics';
import { LikeButton } from '@/components/LikeButton';
import { SongMenu } from '@/components/SongMenu';

export function LyricsView() {
  const open = useUiStore((s) => s.lyricsOpen);
  const close = useUiStore((s) => s.closeLyrics);
  const current = usePlayerStore((s) => s.current);
  const seek = usePlayerStore((s) => s.seek);

  // Lyrics are prefetched on play (see Player), so this is usually instant.
  const { data, isFetching } = useLyrics(current?.id);
  const lines = useMemo(
    () => (data?.syncedLyrics ? parseLrc(data.syncedLyrics) : []),
    [data?.syncedLyrics],
  );

  // Drive the active line straight off the audio clock for a smooth, real-time
  // (Spotify-style) highlight — only re-render when the active line changes.
  const [activeIdx, setActiveIdx] = useState(-1);
  useEffect(() => {
    if (!open || !lines.length) {
      setActiveIdx(-1);
      return;
    }
    const tick = () => {
      const t = getAudio().currentTime;
      let idx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].time <= t + 0.1) idx = i;
        else break;
      }
      setActiveIdx((prev) => (prev === idx ? prev : idx));
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [open, lines]);

  const activeRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIdx]);

  const cover = current?.cover ?? '/assets/cover-tide.svg';

  return (
    <>
      <div
        className={`drawer-overlay${open ? ' open' : ''}`}
        onClick={close}
      />
      <aside className={`drawer lyrics-drawer${open ? ' open' : ''}`}>
        {/* Cover-tinted, blurred backdrop — Spotify-style immersive feel. */}
        {current && (
          <div
            aria-hidden
            className="lyrics-backdrop"
            style={{ backgroundImage: `url(${cover})` }}
          />
        )}
        <div className="d-head">
          <h3>Lyrics</h3>
          <button className="icon-btn" onClick={close} aria-label="Close lyrics">
            <Icon name="x" size={18} />
          </button>
        </div>

        {current && (
          <div className="np" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div className="cover" style={{ width: 48, height: 48, borderRadius: 8, flex: 'none' }}>
              <img src={cover} alt="" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="t" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {current.title}
              </div>
              <div className="a" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {current.artist?.name}
              </div>
            </div>
            <LikeButton songId={current.id} size={18} />
            <SongMenu songId={current.id} title={current.title} />
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 6 }}>
          {!current && <div className="sr-empty">Nothing is playing.</div>}
          {current && isFetching && <div className="sr-empty">Loading lyrics…</div>}

          {current && !isFetching && data && !data.found && (
            <div className="sr-empty">No lyrics found for this track.</div>
          )}
          {current && !isFetching && data?.instrumental && (
            <div className="sr-empty">This track is instrumental. 🎹</div>
          )}

          {/* Synced (karaoke) lyrics */}
          {lines.length > 0 &&
            lines.map((l, i) => (
              <p
                key={i}
                ref={i === activeIdx ? activeRef : undefined}
                onClick={() => seek(l.time)}
                className={`lyric-line${i === activeIdx ? ' active' : ''}${i < activeIdx ? ' past' : ''}`}
              >
                {l.text || '♪'}
              </p>
            ))}

          {/* Plain lyrics fallback (no timestamps) */}
          {lines.length === 0 && data?.plainLyrics && (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-sans)',
                fontSize: 16,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {data.plainLyrics}
            </pre>
          )}
        </div>
      </aside>
    </>
  );
}
