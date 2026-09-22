'use client';
import { useEffect } from 'react';
import { getAudio, usePlayerStore } from '@/stores/player';

/**
 * Mounts once at the app root. Wires the singleton <audio> element's events
 * into the player store. Rendered above the route tree so playback survives
 * navigation.
 */
export function AudioEngine() {
  const sync = usePlayerStore((s) => s._sync);
  const onEnded = usePlayerStore((s) => s._onEnded);
  const volume = usePlayerStore((s) => s.volume);

  useEffect(() => {
    const el = getAudio();
    el.volume = usePlayerStore.getState().volume;

    // While a YouTube-embed track is current, the <audio> element is idle and
    // its late events (e.g. the pause from switching engines) must be ignored.
    const idle = () => !!usePlayerStore.getState().current?.youtubeId;
    const onTime = () => !idle() && sync({ progress: el.currentTime });
    const onMeta = () => !idle() && sync({ duration: el.duration || 0 });
    const onPlay = () => !idle() && sync({ isPlaying: true });
    const onPause = () => !idle() && sync({ isPlaying: false });
    const onEnd = () => !idle() && onEnded();

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
    };
  }, [sync, onEnded]);

  useEffect(() => {
    getAudio().volume = volume;
  }, [volume]);

  return null;
}
