'use client';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { TrackList } from '@/components/TrackList';
import { usePlayerStore } from '@/stores/player';
import { useAuthStore } from '@/stores/auth';
import type { Song } from '@/lib/types';

type HistoryEntry = Song & { playedAt: string };

/** "2 min ago" / "3 h ago" / "Tue" — short and good enough for a list. */
function ago(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export default function HistoryPage() {
  const user = useAuthStore((s) => s.user);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.get<HistoryEntry[]>('/api/history?take=100'),
    enabled: !!user,
    staleTime: 10_000,
  });

  const entries = data ?? [];
  // One card/row per song — the newest play wins, repeats are collapsed.
  const unique: HistoryEntry[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    unique.push(e);
  }
  const recent = unique.slice(0, 6);

  return (
    <>
      <div className="hero-greet">
        <div>
          <h1>Listening history</h1>
          <div className="sub">Everything you played, most recent first.</div>
        </div>
        {unique.length > 0 && (
          <button className="btn btn-primary" onClick={() => playQueue(unique)}>
            <Icon name="play" size={16} />
            Play again
          </button>
        )}
      </div>

      {!user ? (
        <div className="sr-empty">Sign in to keep a listening history.</div>
      ) : isLoading ? (
        <div className="sr-empty">Loading your history…</div>
      ) : unique.length === 0 ? (
        <div className="sr-empty">
          Nothing played yet. Start a song and it will show up here.
        </div>
      ) : (
        <>
          <div className="shelf-head"><h2>Jump back in</h2></div>
          <div className="card-shelf">
            {recent.map((e) => (
              <div
                className="pcard"
                key={e.id}
                onClick={() => playQueue(unique, unique.indexOf(e))}
                style={{ cursor: 'pointer' }}
              >
                <div className="cover">
                  <img src={e.cover ?? '/assets/cover-tide.svg'} alt="" />
                  <button className="qp"><Icon name="play" size={18} /></button>
                </div>
                <div className="pt">{e.title}</div>
                <p className="ps">
                  {e.artist?.name} · {ago(e.playedAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="shelf-head" style={{ marginTop: 'var(--space-7)' }}>
            <h2>All history</h2>
          </div>
          <TrackList songs={unique} />
        </>
      )}
    </>
  );
}
