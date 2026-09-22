'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { usePlayerStore } from '@/stores/player';
import { YoutubeResults } from '@/components/YoutubeResults';
import { LikeButton } from '@/components/LikeButton';
import { SongMenu } from '@/components/SongMenu';
import type { Song } from '@/lib/types';

interface SearchResults {
  songs: { id: string; title: string; subtitle: string; cover?: string; streamUrl: string }[];
  artists: { id: string; title: string; subtitle: string; cover?: string }[];
  albums: { id: string; title: string; subtitle: string; cover?: string }[];
  playlists: { id: string; title: string; subtitle: string; cover?: string }[];
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type Tab = 'library' | 'youtube';

function SearchInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [tab, setTab] = useState<Tab>('library');
  const debounced = useDebounced(q);
  const playSong = usePlayerStore((s) => s.playSong);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.get<SearchResults>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.trim().length > 0 && tab === 'library',
  });

  const hasResults =
    data &&
    (data.songs.length || data.artists.length || data.albums.length || data.playlists.length);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="search-lg" style={{ marginBottom: 'var(--space-5)' }}>
        <Icon name="search" />
        <input
          autoFocus
          placeholder="What do you want to listen to?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isFetching && <Icon name="loader" className="lucide" size={18} />}
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        <button
          className={`tab${tab === 'library' ? ' active' : ''}`}
          onClick={() => setTab('library')}
        >
          SoundWave
        </button>
        <button
          className={`tab${tab === 'youtube' ? ' active' : ''}`}
          onClick={() => setTab('youtube')}
        >
          YouTube
        </button>
      </div>

      {tab === 'youtube' && <YoutubeResults query={debounced} />}

      {tab === 'library' && !debounced.trim() && (
        <div className="sr-empty">Search songs, artists, albums and playlists.</div>
      )}

      {tab === 'library' && debounced.trim() && data && (
        <div className="search-results">
          {data.songs.length > 0 && <div className="sr-cat">Songs</div>}
          {data.songs.map((s) => (
            <div
              className="sr-item"
              key={s.id}
              onClick={() =>
                playSong({
                  id: s.id,
                  title: s.title,
                  duration: 0,
                  streamUrl: s.streamUrl,
                  cover: s.cover,
                  artist: { id: '', name: s.subtitle, slug: '' },
                } as Song)
              }
            >
              <div className="cover">
                <img src={s.cover ?? '/assets/cover-tide.svg'} alt="" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{s.title}</div>
                <div className="s">{s.subtitle}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <LikeButton songId={s.id} size={17} />
                <SongMenu songId={s.id} title={s.title} />
              </div>
            </div>
          ))}

          {data.artists.length > 0 && <div className="sr-cat">Artists</div>}
          {data.artists.map((a) => (
            <Link className="sr-item round" href={`/artist/${a.id}`} key={a.id}>
              <div className="cover">
                <img src={a.cover ?? '/assets/cover-bloom.svg'} alt="" />
              </div>
              <div>
                <div className="t">{a.title}</div>
                <div className="s">{a.subtitle}</div>
              </div>
              <span className="type">ARTIST</span>
            </Link>
          ))}

          {data.albums.length > 0 && <div className="sr-cat">Albums</div>}
          {data.albums.map((a) => (
            <Link className="sr-item" href={`/album/${a.id}`} key={a.id}>
              <div className="cover">
                <img src={a.cover ?? '/assets/cover-tide.svg'} alt="" />
              </div>
              <div>
                <div className="t">{a.title}</div>
                <div className="s">{a.subtitle}</div>
              </div>
              <span className="type">ALBUM</span>
            </Link>
          ))}

          {!hasResults && <div className="sr-empty">No results for “{debounced}”.</div>}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="sr-empty">Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}
