'use client';
import { create } from 'zustand';
import type { Song } from '@/lib/types';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  queue: Song[];
  index: number; // index into queue
  current: Song | null;
  isPlaying: boolean;
  progress: number; // seconds
  duration: number; // seconds
  volume: number; // 0..1
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;

  // actions
  playSong: (song: Song, queue?: Song[]) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  // internal — called by the <AudioEngine>
  _sync: (p: { progress?: number; duration?: number; isPlaying?: boolean }) => void;
  _onEnded: () => void;
}

/** Singleton audio element shared across the whole app (persistent playback). */
let audio: HTMLAudioElement | null = null;
export function getAudio(): HTMLAudioElement {
  if (typeof window === 'undefined') throw new Error('audio on server');
  if (!audio) audio = new Audio();
  return audio;
}

const load = (song: Song, autoplay: boolean) => {
  const el = getAudio();
  el.src = song.streamUrl;
  el.load();
  if (autoplay) el.play().catch(() => undefined);
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: -1,
  current: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.72,
  muted: false,
  shuffle: false,
  repeat: 'off',

  playSong: (song, queue) => {
    const q = queue ?? [song];
    const index = Math.max(0, q.findIndex((s) => s.id === song.id));
    set({ queue: q, index, current: song, progress: 0 });
    load(song, true);
  },

  playQueue: (songs, startIndex = 0) => {
    if (!songs.length) return;
    const current = songs[startIndex];
    set({ queue: songs, index: startIndex, current, progress: 0 });
    load(current, true);
  },

  playAt: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    const current = queue[index];
    set({ index, current, progress: 0 });
    load(current, true);
  },

  toggle: () => (get().isPlaying ? get().pause() : get().play()),
  play: () => {
    if (!get().current) return;
    getAudio().play().catch(() => undefined);
  },
  pause: () => getAudio().pause(),

  next: () => {
    const { queue, index, shuffle, repeat } = get();
    if (!queue.length) return;
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = index + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0;
        else return;
      }
    }
    const current = queue[nextIndex];
    set({ index: nextIndex, current, progress: 0 });
    load(current, true);
  },

  prev: () => {
    const { queue, index, progress } = get();
    if (!queue.length) return;
    // restart current track if >3s in
    if (progress > 3) {
      get().seek(0);
      return;
    }
    const prevIndex = index <= 0 ? queue.length - 1 : index - 1;
    const current = queue[prevIndex];
    set({ index: prevIndex, current, progress: 0 });
    load(current, true);
  },

  seek: (seconds) => {
    getAudio().currentTime = seconds;
    set({ progress: seconds });
  },

  setVolume: (v) => {
    const vol = Math.min(1, Math.max(0, v));
    getAudio().volume = vol;
    set({ volume: vol, muted: vol === 0 });
  },

  toggleMute: () => {
    const { muted, volume } = get();
    const el = getAudio();
    if (muted) {
      el.volume = volume || 0.72;
      set({ muted: false });
    } else {
      el.volume = 0;
      set({ muted: true });
    }
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),

  _sync: (p) => set(p),
  _onEnded: () => {
    const { repeat } = get();
    if (repeat === 'one') {
      get().seek(0);
      get().play();
      return;
    }
    get().next();
  },
}));
