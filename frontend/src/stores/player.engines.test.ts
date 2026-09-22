import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Song } from '@/lib/types';

// Stand-in for the YouTube IFrame engine (no network / iframe in tests).
const yt = vi.hoisted(() => ({
  load: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  currentTime: vi.fn(() => 42),
  duration: vi.fn(() => 0),
}));
vi.mock('@/lib/youtubePlayer', () => ({ youtube: yt }));

import { usePlayerStore, getAudio, currentTime } from './player';

const fileSong: Song = {
  id: 'f1',
  title: 'File track',
  duration: 200,
  streamUrl: '/api/songs/f1/stream',
  artist: { id: 'a', name: 'Artist', slug: 'artist' },
};
const ytSong: Song = {
  id: 'yt:abcdefghijk',
  title: 'YouTube track',
  duration: 180,
  streamUrl: '',
  youtubeId: 'abcdefghijk',
  artist: { id: '', name: 'Channel', slug: '' },
};

beforeEach(() => {
  vi.clearAllMocks();
  usePlayerStore.setState({ queue: [], index: -1, current: null, isPlaying: false, progress: 0 });
});

describe('player store — engine routing', () => {
  it('plays YouTube tracks through the embed and pauses the audio element', () => {
    const pause = vi.spyOn(getAudio(), 'pause');
    usePlayerStore.getState().playSong(ytSong);
    expect(yt.load).toHaveBeenCalledWith('abcdefghijk', true);
    expect(pause).toHaveBeenCalled();
  });

  it('routes play / pause / seek / position to the embed for YouTube tracks', () => {
    usePlayerStore.getState().playSong(ytSong);
    const s = usePlayerStore.getState();
    s.pause();
    s.play();
    s.seek(30);
    expect(yt.pause).toHaveBeenCalled();
    expect(yt.play).toHaveBeenCalled();
    expect(yt.seek).toHaveBeenCalledWith(30);
    expect(currentTime()).toBe(42);
  });

  it('stops the embed when switching to a file track', () => {
    usePlayerStore.getState().playQueue([ytSong, fileSong], 0);
    usePlayerStore.getState().next();
    expect(yt.stop).toHaveBeenCalled();
    expect(getAudio().src).toContain('/api/songs/f1/stream');
    usePlayerStore.getState().seek(12);
    expect(yt.seek).not.toHaveBeenCalled();
  });

  it('applies volume to both engines', () => {
    usePlayerStore.getState().setVolume(0.5);
    expect(getAudio().volume).toBe(0.5);
    expect(yt.setVolume).toHaveBeenCalledWith(0.5);
  });
});
