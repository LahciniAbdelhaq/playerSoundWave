'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/stores/ui';

export function MobileTabs() {
  const pathname = usePathname();
  const openActivity = useUiStore((s) => s.openActivity);
  const is = (h: string) => (h === '/' ? pathname === '/' : pathname.startsWith(h));

  return (
    <nav className="mobile-tabs">
      <Link href="/" className={is('/') ? 'active' : ''}>
        <Icon name="house" />Home
      </Link>
      <Link href="/search" className={is('/search') ? 'active' : ''}>
        <Icon name="search" />Search
      </Link>
      <Link href="/library" className={is('/library') ? 'active' : ''}>
        <Icon name="library-big" />Library
      </Link>
      <button onClick={openActivity}>
        <Icon name="users" />Activity
      </button>
    </nav>
  );
}
