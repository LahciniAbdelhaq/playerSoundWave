'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';
import { useMyPlaylists, useCreatePlaylist } from '@/hooks/usePlaylists';
import { toast } from '@/stores/toast';

const NAV = [
  { href: '/', icon: 'house', label: 'Home' },
  { href: '/search', icon: 'search', label: 'Search', kbd: '⌘K' },
  { href: '/browse', icon: 'compass', label: 'Browse' },
  { href: '/radio', icon: 'radio', label: 'Live Radio' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const { data: playlists } = useMyPlaylists();
  const createPlaylist = useCreatePlaylist();

  const onCreate = () => {
    createPlaylist.mutate(
      { title: 'New Playlist' },
      {
        onSuccess: (p) => {
          toast.success('Playlist created', 'New Playlist');
          router.push(`/playlist/${p.id}`);
        },
        onError: () => toast.error('Could not create playlist'),
      },
    );
  };

  return (
    <aside
      className={`sidebar surface${sidebarOpen ? ' open' : ''}`}
      id="sidebar"
      data-screen-label="Sidebar"
    >
      <div className="side-top">
        <div className="side-brand">
          <div className="brand-mark" aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="name">
            Sound<b>Wave</b>
          </div>
        </div>
        {NAV.map((n) => {
          const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={`nav-item${active ? ' active' : ''}`}>
              <Icon name={n.icon} />
              {n.label}
              {n.kbd && <kbd>{n.kbd}</kbd>}
            </Link>
          );
        })}
      </div>

      <div className="side-sep" />

      <div className="lib-head">
        <span className="lbl">Your Library</span>
        <button
          className="add"
          title="Create playlist"
          onClick={onCreate}
          disabled={createPlaylist.isPending}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className="lib-list" id="libList">
        {/* Liked Songs — always present */}
        <Link
          href="/library"
          className={`lib-item${pathname === '/library' ? ' active' : ''}`}
        >
          <div
            className="cover"
            style={{
              borderRadius: 7,
              background: 'linear-gradient(135deg,var(--brand),var(--aqua-500))',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="heart" size={18} style={{ color: '#04140B', fill: '#04140B' }} />
          </div>
          <div className="meta">
            <div className="t">Liked Songs</div>
            <div className="s">Playlist</div>
          </div>
        </Link>

        {/* User playlists */}
        {(playlists ?? []).map((p) => {
          const active = pathname === `/playlist/${p.id}`;
          return (
            <Link
              key={p.id}
              href={`/playlist/${p.id}`}
              className={`lib-item${active ? ' active' : ''}`}
            >
              <div className="cover">
                {p.image ? (
                  <img src={p.image} alt="" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--surface-2)' }}>
                    <Icon name="music" size={18} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                )}
              </div>
              <div className="meta">
                <div className="t">{p.title}</div>
                <div className="s">Playlist · {p.songCount} songs</div>
              </div>
            </Link>
          );
        })}

        {playlists && playlists.length === 0 && (
          <button
            onClick={onCreate}
            className="lib-item"
            style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
          >
            <div className="cover" style={{ display: 'grid', placeItems: 'center', background: 'var(--surface-2)' }}>
              <Icon name="plus" size={18} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div className="meta">
              <div className="t">Create your first playlist</div>
              <div className="s">It&apos;s easy, we&apos;ll help you</div>
            </div>
          </button>
        )}
      </div>

      <div className="side-cta">
        <div className="t">Go Premium</div>
        <div className="s">Lossless audio, offline, no ads.</div>
        <button className="btn btn-primary sm block">Upgrade</button>
      </div>
    </aside>
  );
}
