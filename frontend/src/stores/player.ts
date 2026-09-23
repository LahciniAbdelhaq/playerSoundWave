'use client';
import { create } from 'zustand';
import { isPreview, type Song } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { youtube } from '@/lib/youtubePlayer';

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

/**
 * Two engines: the <audio> element for stored files, YouTube's embed for
 * tracks with a youtubeId (previews + linked imports). Only one plays at a time.
 */
const onYoutube = () => !!usePlayerStore.getState().current?.youtubeId;

/**
 * Log the play so it shows up in listening history. Signed-in users only, and
 * never for previews (those aren't in the library). Failures are ignored.
 */
const recordPlay = (song: Song) => {
  if (isPreview(song) || !useAuthStore.getState().accessToken) return;
  api.post('/api/history', { songId: song.id }).catch(() => undefined);
};

const load = (song: Song, autoplay: boolean) => {
  if (autoplay) recordPlay(song);
  const el = getAudio();
  if (song.youtubeId) {
    el.pause();
    youtube.load(song.youtubeId, autoplay);
    return;
  }
  youtube.stop();
  el.src = song.streamUrl;
  el.load();
  if (autoplay) el.play().catch(() => undefined);
};

/** Playback position of whichever engine is active (used by the lyrics view). */
export function currentTime(): number {
  return onYoutube() ? youtube.currentTime() : getAudio().currentTime;
}

const applyVolume = (v: number) => {
  getAudio().volume = v;
  youtube.setVolume(v);
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
    if (onYoutube()) youtube.play();
    else getAudio().play().catch(() => undefined);
  },
  pause: () => (onYoutube() ? youtube.pause() : getAudio().pause()),

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
    if (onYoutube()) youtube.seek(seconds);
    else getAudio().currentTime = seconds;
    set({ progress: seconds });
  },

  setVolume: (v) => {
    const vol = Math.min(1, Math.max(0, v));
    applyVolume(vol);
    set({ volume: vol, muted: vol === 0 });
  },

  toggleMute: () => {
    const { muted, volume } = get();
    if (muted) {
      applyVolume(volume || 0.72);
      set({ muted: false });
    } else {
      applyVolume(0);
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
