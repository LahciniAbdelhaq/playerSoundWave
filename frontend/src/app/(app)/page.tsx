'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useSongs, useArtists } from '@/hooks/useCatalog';
import { usePlayerStore } from '@/stores/player';
import { SongMenu } from '@/components/SongMenu';
import type { Song } from '@/lib/types';

// Curated data from the prototype (shell.js) — used as the visual fallback so the
// page is pixel-identical even before the API has data.
const QUICK = [
  ['Liked Songs', 'forest'], ['Daily Mix 1', 'midnight'], ['Discover Weekly', 'bloom'],
  ['Neon Tide', 'tide'], ['Focus Flow', 'aurora'], ['On Repeat', 'ember'],
] as const;
const SHELF2 = [
  ['Daily Mix 1', 'Aurora Bay, Vela & more', 'bloom'],
  ['Discover Weekly', 'Your weekly mixtape', 'midnight'],
  ['Chill Lo-fi', 'Beats to focus', 'forest'],
  ['Release Radar', 'New from artists you follow', 'tide'],
  ['Time Capsule', 'Songs from your past', 'aurora'],
] as const;
const SHELF3_FALLBACK = [
  ['Aurora Bay', 'bloom'], ['Solstate', 'tide'], ['Vela', 'ember'],
  ['Kara Mori', 'forest'], ['Nova Lux', 'midnight'],
] as const;
const FILTERS = ['All', 'Music', 'Podcasts', 'Audiobooks'];

export default function HomePage() {
  const [filter, setFilter] = useState('All');
  const [greeting, setGreeting] = useState('Good evening, Jordan');
  const { data: songs } = useSongs('trending', 5);
  const { data: artists } = useArtists(5);
  const playSong = usePlayerStore((s) => s.playSong);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(`Good ${h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}, Jordan`);
  }, []);

  const shelf1: Song[] = songs?.items ?? [];

  return (
    <>
      <div className="hero-greet">
        <div>
          <h1 id="greeting">{greeting}</h1>
          <div className="sub">
            You&apos;ve listened to{' '}
            <b style={{ color: 'var(--text-primary)' }}>42 hours</b> this month — a new high.
          </div>
        </div>
        <button className="btn btn-secondary sm">
          <Icon name="history" size={16} />
          Listening history
        </button>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`fchip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Quick picks */}
      <div className="quick-grid">
        {QUICK.map(([title, cover]) => (
          <div className="quick" key={title}>
            <div className="cover">
              <img src={`/assets/cover-${cover}.svg`} alt="" />
            </div>
            <div className="t">{title}</div>
            <button className="qp">
              <Icon name="play" size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Jump back in — real songs */}
      <div className="shelf-head">
        <h2>Jump back in</h2>
        <a>Show all</a>
      </div>
      <div className="card-shelf">
        {shelf1.map((song) => (
          <div className="pcard" key={song.id}>
            <div className="cover">
              <img src={song.cover ?? '/assets/cover-tide.svg'} alt="" />
              <button className="qp" onClick={() => playSong(song, shelf1)}>
                <Icon name="play" size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="pt" style={{ flex: 1, minWidth: 0 }}>{song.title}</div>
              <SongMenu songId={song.id} title={song.title} />
            </div>
            <p className="ps">{song.artist.name}</p>
          </div>
        ))}
      </div>

      {/* Made for you */}
      <div className="shelf-head">
        <h2>Made for you</h2>
        <a>Show all</a>
      </div>
      <div className="card-shelf">
        {SHELF2.map(([title, sub, cover]) => (
          <div className="pcard" key={title}>
            <div className="cover">
              <img src={`/assets/cover-${cover}.svg`} alt="" />
              <button className="qp">
                <Icon name="play" size={18} />
              </button>
            </div>
            <div className="pt">{title}</div>
            <p className="ps">{sub}</p>
          </div>
        ))}
      </div>

      {/* Popular artists */}
      <div className="shelf-head">
        <h2>Popular artists</h2>
        <a>Show all</a>
      </div>
      <div className="card-shelf">
        {(artists?.items?.length
          ? artists.items.map((a) => ({ id: a.id, name: a.name, slug: a.slug, cover: a.image }))
          : SHELF3_FALLBACK.map(([name, cover]) => ({ id: name, name, slug: name, cover: `/assets/cover-${cover}.svg` }))
        ).map((a) => (
          <Link className="pcard round" href={`/artist/${a.slug}`} key={a.id}>
            <div className="cover">
              <img src={a.cover ?? '/assets/cover-bloom.svg'} alt="" />
              <button className="qp">
                <Icon name="play" size={18} />
              </button>
            </div>
            <div className="pt">{a.name}</div>
            <p className="ps">Artist</p>
          </Link>
        ))}
      </div>
    </>
  );
}
