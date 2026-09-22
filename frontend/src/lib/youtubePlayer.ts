'use client';
/**
 * Thin wrapper around YouTube's IFrame Player API — the second playback engine
 * next to the <audio> element. Used for tracks with a `youtubeId`: search
 * previews and linked imports. Playback happens in the browser, so it works
 * the same locally and on Vercel (where the server can't download from YouTube).
 *
 * <YoutubeEngine> mounts the (visible) player; the store calls the functions
 * below. Calls made before the API has loaded are queued until it's ready.
 */

// Minimal typings for the parts of the IFrame API we use.
interface YTPlayer {
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** YT.PlayerState values. */
export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 } as const;

export interface YoutubeHandlers {
  onState: (state: number) => void;
  onError: (code: number) => void;
}

let player: YTPlayer | null = null;
let pending: ((p: YTPlayer) => void)[] = [];

function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[data-yt-api]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.dataset.ytApi = '1';
      document.head.appendChild(s);
    }
  });
}

/** Create the player inside `el`. Returns a cleanup function. */
export function mountYoutube(el: HTMLElement, handlers: YoutubeHandlers, volume: number) {
  let cancelled = false;
  loadApi().then((YT) => {
    if (cancelled) return;
    const host = document.createElement('div');
    el.appendChild(host);
    new YT.Player(host, {
      width: '100%',
      height: '100%',
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          player = e.target;
          player.setVolume(Math.round(volume * 100));
          const queued = pending;
          pending = [];
          queued.forEach((fn) => fn(player!));
        },
        onStateChange: (e: { data: number }) => handlers.onState(e.data),
        onError: (e: { data: number }) => handlers.onError(e.data),
      },
    });
  });
  return () => {
    cancelled = true;
    player = null;
    pending = [];
    el.replaceChildren();
  };
}

function withPlayer(fn: (p: YTPlayer) => void) {
  if (player) fn(player);
  else pending.push(fn);
}

export const youtube = {
  load(videoId: string, autoplay: boolean) {
    withPlayer((p) => (autoplay ? p.loadVideoById(videoId) : p.cueVideoById(videoId)));
  },
  play: () => withPlayer((p) => p.playVideo()),
  pause: () => player?.pauseVideo(),
  /** Silence the embed when switching to an audio-file track. */
  stop: () => {
    pending = [];
    player?.stopVideo();
  },
  seek: (seconds: number) => player?.seekTo(seconds, true),
  setVolume: (v: number) => withPlayer((p) => p.setVolume(Math.round(v * 100))),
  currentTime: () => player?.getCurrentTime() ?? 0,
  duration: () => player?.getDuration() ?? 0,
};
