'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';
import { usePlayerStore } from '@/stores/player';

const FRIENDS = [
  { n: 'Maya O.', t: 'Midnight Pulse', a: 'Aurora Bay', c: 'midnight', s: 'live' },
  { n: 'Diego R.', t: 'Neon Tide', a: 'Solstate', c: 'tide', s: 'live' },
  { n: 'Aisha K.', t: 'Deep Forest', a: 'Kara Mori', c: 'forest', s: 'live' },
  { n: 'Leo P.', t: 'Ember Skies', a: 'Vela', c: 'ember', s: 'live' },
  { n: 'Sam T.', t: 'Afterglow', a: 'Halcyon', c: 'aurora', s: 'idle' },
  { n: 'Nina W.', t: 'Dusk Drive', a: 'The Reverb', c: 'dusk', s: 'idle' },
];
const OFFLINE = [
  { n: 'Owen B.', last: 'Paper Planes · Echo Park', c: 'mono' },
  { n: 'Priya S.', last: 'Gravity · Nova Lux', c: 'bloom' },
];

export function ActivityPanel() {
  const [tab, setTab] = useState<'friends' | 'queue'>('friends');
  const activityOpen = useUiStore((s) => s.activityOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const { queue, index, current } = usePlayerStore();

  return (
    <aside
      className={`activity surface${activityOpen ? ' open' : ''}`}
      id="activity"
      data-screen-label="Activity Panel"
    >
      <div className="act-head">
        <span className="t">Friend Activity</span>
        <span className="badge">12 LIVE</span>
        <button className="round-btn x" style={{ marginLeft: 'auto' }} onClick={closeDrawers}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="act-tabs">
        <button
          className={`act-tab${tab === 'friends' ? ' active' : ''}`}
          onClick={() => setTab('friends')}
        >
          Friends
        </button>
        <button
          className={`act-tab${tab === 'queue' ? ' active' : ''}`}
          onClick={() => setTab('queue')}
        >
          Queue
        </button>
      </div>

      <div className="act-scroll" id="actScroll">
        {tab === 'friends' ? (
          <>
            <div className="act-section">Listening now</div>
            {FRIENDS.map((f, i) => (
              <div className="friend" key={i}>
                <div className="av">
                  <div className="cover">
                    <img src={`/assets/cover-${f.c}.svg`} alt="" />
                  </div>
                  <span className={`status ${f.s}`} />
                </div>
                <div className="info">
                  <div className="n">{f.n}</div>
                  <div className="track">
                    <span className="dot">●</span>
                    {f.t}
                  </div>
                  <div className="artist">{f.a}</div>
                </div>
                <button className="btn btn-ghost icon join" title="Join session">
                  <Icon name="headphones" size={17} />
                </button>
              </div>
            ))}
            <div className="act-section">Offline</div>
            {OFFLINE.map((f, i) => (
              <div className="friend" style={{ opacity: 0.65 }} key={i}>
                <div className="av">
                  <div className="cover">
                    <img src={`/assets/cover-${f.c}.svg`} alt="" />
                  </div>
                  <span className="status off" />
                </div>
                <div className="info">
                  <div className="n">{f.n}</div>
                  <div className="artist">Last: {f.last}</div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {current && (
              <>
                <div className="act-section">Now playing</div>
                <div className="friend">
                  <div className="av">
                    <div className="cover" style={{ borderRadius: 7 }}>
                      <img src={current.cover ?? '/assets/cover-tide.svg'} alt="" />
                    </div>
                  </div>
                  <div className="info">
                    <div className="n">{current.title}</div>
                    <div className="artist">{current.artist.name}</div>
                  </div>
                  <span className="eq-mini" style={{ alignSelf: 'center' }}>
                    <i /><i /><i />
                  </span>
                </div>
              </>
            )}
            <div className="act-section">Next in queue</div>
            {queue.slice(index + 1).map((s, i) => (
              <div className="friend" key={i}>
                <div className="av">
                  <div className="cover" style={{ borderRadius: 7 }}>
                    <img src={s.cover ?? '/assets/cover-mono.svg'} alt="" />
                  </div>
                </div>
                <div className="info">
                  <div className="n">{s.title}</div>
                  <div className="artist">{s.artist.name}</div>
                </div>
                <button className="btn btn-ghost icon join">
                  <Icon name="ellipsis" size={17} />
                </button>
              </div>
            ))}
            {queue.length <= index + 1 && (
              <div className="sr-empty">Queue is empty</div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
