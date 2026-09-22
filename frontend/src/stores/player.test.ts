import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from './player';
import type { Song } from '@/lib/types';

const song = (id: string): Song => ({
  id,
  title: `Track ${id}`,
  duration: 200,
  streamUrl: `/api/songs/${id}/stream`,
  artist: { id: 'a', name: 'Artist', slug: 'artist' },
});

const QUEUE = [song('1'), song('2'), song('3')];

beforeEach(() => {
  // Reset only the data fields; keep the action implementations intact.
  usePlayerStore.setState({
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
  });
});

describe('player store — queue & navigation', () => {
  it('playQueue sets the queue, start index and current track', () => {
    usePlayerStore.getState().playQueue(QUEUE, 1);
    const s = usePlayerStore.getState();
    expect(s.current?.id).toBe('2');
    expect(s.index).toBe(1);
    expect(s.queue).toHaveLength(3);
  });

  it('playAt jumps to a specific queue index (used by the queue panel)', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 0);
    store.playAt(2);
    expect(usePlayerStore.getState().current?.id).toBe('3');
    expect(usePlayerStore.getState().index).toBe(2);
  });

  it('playAt ignores out-of-range indices', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 1);
    store.playAt(99);
    expect(usePlayerStore.getState().index).toBe(1); // unchanged
  });

  it('next advances to the following track', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 0);
    store.next();
    expect(usePlayerStore.getState().current?.id).toBe('2');
  });

  it('next at the end stops when repeat is off', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 2);
    store.next();
    // index unchanged — playback does not advance past the end
    expect(usePlayerStore.getState().index).toBe(2);
    expect(usePlayerStore.getState().current?.id).toBe('3');
  });

  it('next at the end wraps to the first track when repeat is "all"', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 2);
    usePlayerStore.setState({ repeat: 'all' });
    store.next();
    expect(usePlayerStore.getState().current?.id).toBe('1');
  });

  it('prev restarts the current track when more than 3s in', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 1);
    usePlayerStore.setState({ progress: 10 });
    store.prev();
    const s = usePlayerStore.getState();
    expect(s.current?.id).toBe('2'); // same track
    expect(s.progress).toBe(0); // restarted
  });

  it('prev goes to the previous track when near the start', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 1);
    usePlayerStore.setState({ progress: 1 });
    store.prev();
    expect(usePlayerStore.getState().current?.id).toBe('1');
  });

  it('shuffle keeps next within the queue bounds', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 0);
    usePlayerStore.setState({ shuffle: true });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    store.next();
    randomSpy.mockRestore(); // restore only Math.random — not the global media stubs
    expect(usePlayerStore.getState().index).toBeLessThan(QUEUE.length);
  });
});

describe('player store — volume & repeat', () => {
  it('setVolume clamps to 0..1 and mutes at zero', () => {
    const store = usePlayerStore.getState();
    store.setVolume(2);
    expect(usePlayerStore.getState().volume).toBe(1);
    store.setVolume(-1);
    expect(usePlayerStore.getState().volume).toBe(0);
    expect(usePlayerStore.getState().muted).toBe(true);
  });

  it('cycleRepeat cycles off → all → one → off', () => {
    const store = usePlayerStore.getState();
    store.cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe('all');
    store.cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe('one');
    store.cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe('off');
  });

  it('_onEnded with repeat "one" replays the same track', () => {
    const store = usePlayerStore.getState();
    store.playQueue(QUEUE, 1);
    usePlayerStore.setState({ repeat: 'one' });
    store._onEnded();
    expect(usePlayerStore.getState().current?.id).toBe('2');
  });
});
