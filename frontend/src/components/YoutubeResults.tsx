'use client';
import { Icon } from '@/components/Icon';
import { useYoutubeSearch, useYoutubeImport, type YoutubeResult } from '@/hooks/useYoutube';
import { usePlayerStore } from '@/stores/player';
import { toast } from '@/stores/toast';
import { ApiError } from '@/lib/api';

function fmt(s: number) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function YoutubeRow({ r }: { r: YoutubeResult }) {
  const importMut = useYoutubeImport();
  const playSong = usePlayerStore((s) => s.playSong);

  // Import → store → play. Importing takes a little while (download + convert).
  const importAndPlay = () => {
    if (importMut.isPending) return;
    const id = toast.info('Importing from YouTube…', `${r.title} — this can take ~30s`);
    importMut.mutate(r.url, {
      onSuccess: (song) => {
        toast.dismiss(id);
        toast.success('Now playing', song.title);
        playSong(song, [song]);
      },
      onError: (e) => {
        toast.dismiss(id);
        const msg = e instanceof ApiError ? e.message : 'Import failed';
        toast.error('Import failed', msg);
      },
    });
  };

  return (
    <div
      className="sr-item"
      onClick={importAndPlay}
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
      <button
        className="btn btn-secondary sm"
        onClick={(e) => {
          e.stopPropagation();
          importAndPlay();
        }}
        disabled={importMut.isPending}
      >
        <Icon name={importMut.isPending ? 'loader' : 'download'} size={15} />
        {importMut.isPending ? 'Importing…' : 'Import & play'}
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
            The server needs <code>yt-dlp</code> installed (or run the API in Docker).
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
        <YoutubeRow key={r.id} r={r} />
      ))}
    </div>
  );
}
