'use client';
import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  activityOpen: boolean;
  lyricsOpen: boolean;
  queueOpen: boolean;
  setTheme: (t: Theme) => void;
  openSidebar: () => void;
  openActivity: () => void;
  closeDrawers: () => void;
  toggleLyrics: () => void;
  closeLyrics: () => void;
  toggleQueue: () => void;
  closeQueue: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  sidebarOpen: false,
  activityOpen: false,
  lyricsOpen: false,
  queueOpen: false,
  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('sw-theme', theme);
    }
    set({ theme });
  },
  openSidebar: () => set({ sidebarOpen: true }),
  openActivity: () => set({ activityOpen: true }),
  closeDrawers: () => set({ sidebarOpen: false, activityOpen: false }),
  // Lyrics and queue are mutually exclusive side panels — opening one closes the other.
  toggleLyrics: () => set((s) => ({ lyricsOpen: !s.lyricsOpen, queueOpen: false })),
  closeLyrics: () => set({ lyricsOpen: false }),
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen, lyricsOpen: false })),
  closeQueue: () => set({ queueOpen: false }),
}));
