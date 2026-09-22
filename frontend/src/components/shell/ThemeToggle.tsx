'use client';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui';
import { Icon } from '@/components/Icon';

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  // Restore persisted theme (parity with the prototype's localStorage 'sw-theme').
  useEffect(() => {
    const saved = (localStorage.getItem('sw-theme') as 'dark' | 'light') || 'dark';
    setTheme(saved);
  }, [setTheme]);

  return (
    <div className="theme-toggle" id="themeToggle">
      <button
        className={theme === 'dark' ? 'active' : ''}
        onClick={() => setTheme('dark')}
        aria-label="Dark theme"
      >
        <Icon name="moon" size={15} />
      </button>
      <button
        className={theme === 'light' ? 'active' : ''}
        onClick={() => setTheme('light')}
        aria-label="Light theme"
      >
        <Icon name="sun" size={15} />
      </button>
    </div>
  );
}
