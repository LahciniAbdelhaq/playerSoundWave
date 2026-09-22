'use client';
import { useUiStore } from '@/stores/ui';

export function Scrim() {
  const open = useUiStore((s) => s.sidebarOpen || s.activityOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  return (
    <div className={`scrim${open ? ' open' : ''}`} id="scrim" onClick={closeDrawers} />
  );
}
