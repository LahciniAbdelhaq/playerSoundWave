'use client';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';
import { usePlayerStore } from '@/stores/player';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Spotify-style "Queue" side panel: now playing + the rest of the queue. */
export function QueueView() {
  const open = useUiStore((s) => s.queueOpen);
  const close = useUiStore((s) => s.closeQueue);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const playAt = usePlayerStore((s) => s.playAt);

  const current = index >= 0 ? queue[index] : null;
  const upcoming = queue
    .map((song, i) => ({ song, i }))
    .filter(({ i }) => i > index);

  const Row = ({ song, i }: { song: (typeof queue)[number]; i: number }) => (
    <button className="queue-row" onClick={() => playAt(i)}>
      <div className="cover" style={{ width: 44, height: 44, borderRadius: 6, flex: 'none' }}>
        <img src={song.cover ?? '/assets/cover-tide.svg'} alt="" />
      </div>
      <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
        <div className="t" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.title}
        </div>
        <div className="a" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {song.artist?.name}
        </div>
      </div>
      <span className="time" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
        {fmt(song.duration)}
      </span>
    </button>
  );

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={close} />
      <aside className={`drawer${open ? ' open' : ''}`}>
        <div className="d-head">
          <h3>Queue</h3>
          <button className="icon-btn" onClick={close} aria-label="Close queue">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 6 }}>
          {!queue.length && <div className="sr-empty">The queue is empty. Play something!</div>}

          {current && (
            <>
              <div className="queue-label">Now playing</div>
              <div className="queue-row is-current">
                <div className="cover" style={{ width: 44, height: 44, borderRadius: 6, flex: 'none' }}>
                  <img src={current.cover ?? '/assets/cover-tide.svg'} alt="" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="t" style={{ fontWeight: 600, color: 'var(--brand)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {current.title}
                  </div>
                  <div className="a" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {current.artist?.name}
                  </div>
                </div>
                <span className="eq-mini"><i /><i /><i /></span>
              </div>
            </>
          )}

          {upcoming.length > 0 && (
            <>
              <div className="queue-label">Next up</div>
              {upcoming.map(({ song, i }) => (
                <Row key={`${song.id}-${i}`} song={song} i={i} />
              ))}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
