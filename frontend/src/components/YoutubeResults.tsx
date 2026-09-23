'use client';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import {
  useYoutubeSearch,
  useYoutubeImport,
  youtubePreviewSong,
  type YoutubeResult,
} from '@/hooks/useYoutube';
import { usePlayerStore } from '@/stores/player';
import { toast } from '@/stores/toast';
import { ApiError } from '@/lib/api';

function fmt(s: number) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function YoutubeRow({ r, results }: { r: YoutubeResult; results: YoutubeResult[] }) {
  const importMut = useYoutubeImport();
  const qc = useQueryClient();
  const playSong = usePlayerStore((s) => s.playSong);
  const toggle = usePlayerStore((s) => s.toggle);
  const isCurrent = usePlayerStore((s) => s.current?.id === `yt:${r.id}`);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  // Listen right away through YouTube's embed — nothing is downloaded or saved.
  // The other results become the queue, so next/previous walk the list.
  const listen = () => {
    if (isCurrent) return toggle();
    playSong(youtubePreviewSong(r), results.map(youtubePreviewSong));
  };

  // Import → store → play. Locally this downloads the MP3 (~30s); where the
  // server can't download (Vercel), it saves a linked track that streams from YouTube.
  const importAndPlay = () => {
    if (importMut.isPending) return;
    const id = toast.info('Importing from YouTube…', `${r.title} — this can take ~30s`);
    importMut.mutate(r, {
      onSuccess: (song) => {
        toast.dismiss(id);
        // The track is in the library now — refresh the lists that show it.
        qc.invalidateQueries({ queryKey: ['songs'] });
        qc.invalidateQueries({ queryKey: ['history'] });
        toast.success(
          song.youtubeId ? 'Saved to your library' : 'Imported — now playing',
          song.youtubeId ? `${song.title} (streams from YouTube)` : song.title,
        );
        playSong(song, [song]);
      },
      onError: (e) => {
        toast.dismiss(id);
        const msg = e instanceof ApiError ? e.message : 'Import failed';
        toast.error('Import failed', msg);
      },
    });
  };

  const playingNow = isCurrent && isPlaying;

  return (
    <div
      className="sr-item"
      onClick={listen}
      style={{ cursor: 'pointer', opacity: importMut.isPending ? 0.6 : 1 }}
    >
      <div className="cover" style={{ width: 64, height: 40, borderRadius: 6, flex: 'none' }}>
        <img src={r.thumbnail} alt="" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="t" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.title}
        </div>
        <div className="s">
          {r.uploader}
          {r.duration ? ` · ${fmt(r.duration)}` : ''}
        </div>
      </div>
      {/* Narrow screens show the beats animation for the playing row instead
          of a Play button — tapping the row itself plays or pauses. */}
      {playingNow && (
        <span className="eq-mini yt-beats" aria-label="Playing">
          <i /><i /><i />
        </span>
      )}
      <button
        type="button"
        className="btn btn-primary sm yt-play"
        onClick={(e) => {
          e.stopPropagation();
          listen();
        }}
        aria-label={playingNow ? `Pause ${r.title}` : `Play ${r.title}`}
      >
        <Icon name={playingNow ? 'pause' : 'play'} size={15} />
        {playingNow ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className="btn btn-secondary sm icon yt-import"
        onClick={(e) => {
          e.stopPropagation();
          importAndPlay();
        }}
        disabled={importMut.isPending}
        title={importMut.isPending ? 'Importing…' : 'Import to your library'}
        aria-label={importMut.isPending ? 'Importing' : `Import ${r.title} to your library`}
      >
        <Icon name={importMut.isPending ? 'loader' : 'download'} size={16} />
      </button>
    </div>
  );
}

export function YoutubeResults({ query }: { query: string }) {
  const { data, isFetching, error } = useYoutubeSearch(query);

  if (!query.trim()) {
    return <div className="sr-empty">Search YouTube for any song, then import it.</div>;
  }
  if (isFetching) return <div className="sr-empty">Searching YouTube…</div>;
  if (error) {
    return (
      <div className="banner warning" style={{ marginTop: 'var(--space-3)' }}>
        <Icon name="triangle-alert" className="b-icon" />
        <div>
          <div className="b-title">YouTube search unavailable</div>
          <div className="b-text">
            {error instanceof ApiError && error.status === 503 ? (
              error.message
            ) : (
              <>
                The server needs <code>yt-dlp</code> installed (or run the API in Docker).
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <div className="sr-empty">No YouTube results for “{query}”.</div>;
  }

  return (
    <div className="search-results">
      <div className="sr-cat">From YouTube</div>
      {data.map((r) => (
        <YoutubeRow key={r.id} r={r} results={data} />
      ))}
    </div>
  );
}
