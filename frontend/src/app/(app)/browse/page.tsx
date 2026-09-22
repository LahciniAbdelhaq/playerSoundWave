'use client';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useAlbums, useArtists } from '@/hooks/useCatalog';

export default function BrowsePage() {
  const { data: albums } = useAlbums(20);
  const { data: artists } = useArtists(12);

  return (
    <>
      <div className="hero-greet">
        <div>
          <h1>Browse</h1>
          <div className="sub">Fresh albums and the artists defining now.</div>
        </div>
      </div>

      <div className="shelf-head"><h2>Popular albums</h2></div>
      <div className="card-shelf">
        {(albums?.items ?? []).map((al) => (
          <Link className="pcard" href={`/album/${al.id}`} key={al.id}>
            <div className="cover">
              <img src={al.cover ?? '/assets/cover-tide.svg'} alt="" />
              <button className="qp"><Icon name="play" size={18} /></button>
            </div>
            <div className="pt">{al.title}</div>
            <p className="ps">{al.artist?.name}</p>
          </Link>
        ))}
      </div>

      <div className="shelf-head" style={{ marginTop: 'var(--space-7)' }}>
        <h2>Artists</h2>
      </div>
      <div className="card-shelf">
        {(artists?.items ?? []).map((a) => (
          <Link className="pcard round" href={`/artist/${a.slug}`} key={a.id}>
            <div className="cover">
              <img src={a.image ?? '/assets/cover-bloom.svg'} alt="" />
            </div>
            <div className="pt">{a.name}</div>
            <p className="ps">Artist</p>
          </Link>
        ))}
      </div>
    </>
  );
}
