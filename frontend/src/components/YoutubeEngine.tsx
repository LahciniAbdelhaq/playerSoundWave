'use client';
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/player';
import { mountYoutube, youtube, YT_STATE } from '@/lib/youtubePlayer';
import { toast } from '@/stores/toast';

/**
 * Mounts once next to <AudioEngine>. Hosts the YouTube embed used for tracks
 * with a `youtubeId` and feeds its state into the player store. The video stays
 * visible while such a track is current (YouTube's terms require a visible player).
 */
export function YoutubeEngine() {
  const hostRef = useRef<HTMLDivElement>(null);
  const isYoutube = usePlayerStore((s) => !!s.current?.youtubeId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const { _sync, _onEnded } = usePlayerStore.getState();
    const active = () => !!usePlayerStore.getState().current?.youtubeId;

    return mountYoutube(
      el,
      {
        onState: (state) => {
          if (!active()) return; // stale events after switching to an audio track
          if (state === YT_STATE.PLAYING) _sync({ isPlaying: true, duration: youtube.duration() });
          else if (state === YT_STATE.PAUSED) _sync({ isPlaying: false });
          else if (state === YT_STATE.ENDED) {
            _sync({ isPlaying: false });
            _onEnded();
          }
        },
        onError: (code) => {
          if (!active()) return;
          // 101/150: the uploader doesn't allow playback in embedded players.
          const blocked = code === 101 || code === 150;
          toast.error(
            'Can’t play this video',
            blocked ? 'The uploader disabled playback outside YouTube.' : 'YouTube playback failed.',
          );
          _sync({ isPlaying: false });
          if (blocked) _onEnded();
        },
      },
      usePlayerStore.getState().volume,
    );
  }, []);

  // The IFrame API has no timeupdate event — poll progress while playing.
  useEffect(() => {
    if (!isYoutube || !isPlaying) return;
    const t = setInterval(
      () => usePlayerStore.getState()._sync({ progress: youtube.currentTime() }),
      250,
    );
    return () => clearInterval(t);
  }, [isYoutube, isPlaying]);

  return (
    <div className="yt-mini" data-active={isYoutube || undefined} aria-hidden={!isYoutube}>
      <div ref={hostRef} className="yt-mini-host" />
    </div>
  );
}
