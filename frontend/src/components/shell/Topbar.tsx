'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from './ThemeToggle';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useLogout } from '@/hooks/useAuth';

export function Topbar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const openSidebar = useUiStore((s) => s.openSidebar);
  const openActivity = useUiStore((s) => s.openActivity);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const submit = (value: string) => {
    setQ(value);
    if (value.trim()) router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <header className="topbar surface" data-screen-label="Top Bar">
      <button className="round-btn tb-burger" id="burger" onClick={openSidebar}>
        <Icon name="menu" size={18} />
      </button>
      <div className="tb-nav">
        <button className="round-btn" onClick={() => router.back()}>
          <Icon name="chevron-left" size={18} />
        </button>
        <button className="round-btn" onClick={() => router.forward()}>
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
      <div className="tb-search">
        <Icon name="search" size={17} />
        <input
          type="text"
          placeholder="Search songs, artists, albums, podcasts"
          value={q}
          onChange={(e) => submit(e.target.value)}
        />
        <kbd>⌘K</kbd>
      </div>
      <div className="tb-right">
        <ThemeToggle />
        <button className="tb-pill-btn">
          <Icon name="sparkles" size={15} />
          <span>Upgrade</span>
        </button>
        <button
          className="round-btn tb-act-toggle"
          id="actToggle"
          title="Activity"
          onClick={openActivity}
        >
          <Icon name="users" size={17} />
        </button>
        {user ? (
          <>
            <Link href="/library" className="avatar" title={user.username}>
              <img src={user.avatar ?? '/assets/cover-mono.svg'} alt={user.username} />
            </Link>
            <button
              className="round-btn"
              title="Log out"
              onClick={() => logout.mutate()}
            >
              <Icon name="log-out" size={17} />
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-secondary sm">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
