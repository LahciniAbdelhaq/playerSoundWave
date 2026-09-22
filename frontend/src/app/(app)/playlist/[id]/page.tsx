'use client';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import {
  usePlaylist,
  useUpdatePlaylist,
  useDeletePlaylist,
  useRemoveFromPlaylist,
  useReorderPlaylist,
  useAddToPlaylist,
} from '@/hooks/usePlaylists';
import { usePlayerStore } from '@/stores/player';
import { toast } from '@/stores/toast';
import type { Song } from '@/lib/types';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = usePlaylist(id);

  const update = useUpdatePlaylist(id);
  const del = useDeletePlaylist();
  const removeSong = useRemoveFromPlaylist(id);
  const reorder = useReorderPlaylist(id);

  const playQueue = usePlayerStore((s) => s.playQueue);
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.current);

  // local order for smooth drag-and-drop
  const [order, setOrder] = useState<any[]>([]);
  useEffect(() => {
    if (data?.tracks) setOrder(data.tracks);
  }, [data?.tracks]);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  useEffect(() => {
    if (data?.title) setTitle(data.title);
  }, [data?.title]);

  const dragIndex = useRef<number | null>(null);

  if (isLoading) return <div className="sr-empty">Loading playlist…</div>;
  if (!data) return <div className="sr-empty">Playlist not found.</div>;

  const tracks: Song[] = order.map((t) => ({
    id: t.id,
    title: t.title,
    duration: t.duration,
    streamUrl: t.streamUrl,
    youtubeId: t.youtubeId,
    cover: t.cover,
    artist: t.artist,
    album: t.album,
  }));

  const saveTitle = () => {
    setEditing(false);
    if (title.trim() && title !== data.title) update.mutate({ title: title.trim() });
  };

  const onDrop = (toIdx: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === toIdx) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(toIdx, 0, moved);
    setOrder(next);
    reorder.mutate(next.map((t) => t.id));
  };

  const onDelete = () => {
    del.mutate(id, {
      onSuccess: () => {
        toast.success('Playlist deleted');
        router.push('/');
      },
    });
  };

  return (
    <>
      {/* Header */}
      <div
        className="album-card"
        style={{ marginBottom: 'var(--space-6)', border: 'none', background: 'transparent', padding: 0 }}
      >
        <div
          className="cover"
          style={{ width: 200, height: 200, display: 'grid', placeItems: 'center', background: 'var(--surface-2)' }}
        >
          {data.image ? (
            <img src={data.image} alt="" />
          ) : (
            <Icon name="music" size={64} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
        <div className="meta">
          <span className="tag">PLAYLIST</span>
          {editing ? (
            <input
              className="input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              style={{ fontSize: 'var(--fs-h2)', fontWeight: 700, margin: '6px 0', maxWidth: 480 }}
            />
          ) : (
            <h4
              style={{ fontSize: 'var(--fs-display-lg)', cursor: 'pointer' }}
              title="Click to rename"
              onClick={() => setEditing(true)}
            >
              {data.title}
            </h4>
          )}
          <div className="by">
            {(data as any).owner?.username ?? 'You'} · {tracks.length} songs
          </div>
          <div className="cta" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              className="btn btn-primary"
              disabled={!tracks.length}
              onClick={() => playQueue(tracks)}
            >
              <Icon name="play" size={18} />Play
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Icon name="pencil" size={16} />Rename
            </button>
            <button className="btn btn-ghost" onClick={onDelete}>
              <Icon name="trash-2" size={16} />Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <div className="sr-empty">This playlist is empty. Add songs below.</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="row-idx">#</th>
                <th>Title</th>
                <th className="num"><Icon name="clock" size={15} /></th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((song, i) => (
                <tr
                  key={song.id}
                  draggable
                  onDragStart={() => (dragIndex.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(i)}
                  onClick={() => playSong(song, tracks)}
                  style={{ cursor: 'grab' }}
                >
                  <td className="row-idx">
                    {current?.id === song.id ? (
                      <span className="eq-mini"><i /><i /><i /></span>
                    ) : (
                      <>
                        <span className="num">{i + 1}</span>
                        <span className="play"><Icon name="play" size={14} /></span>
                      </>
                    )}
                  </td>
                  <td>
                    <div className="cell-track">
                      <div className="cover">
                        <img src={song.cover ?? '/assets/cover-tide.svg'} alt="" />
                      </div>
                      <div>
                        <div className="t">{song.title}</div>
                        <div className="a">{song.artist?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{fmt(song.duration)}</td>
                  <td>
                    <button
                      className="icon-btn"
                      title="Remove from playlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrder((o) => o.filter((t) => t.id !== song.id));
                        removeSong.mutate(song.id);
                      }}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddSongs playlistId={id} />
    </>
  );
}

/** Inline search to add songs to the playlist. */
function AddSongs({ playlistId }: { playlistId: string }) {
  const [q, setQ] = useState('');
  const add = useAddToPlaylist();
  const { data } = useQuery({
    queryKey: ['search-add', q],
    queryFn: () =>
      api.get<{ songs: { id: string; title: string; subtitle: string; cover?: string }[] }>(
        `/api/search?q=${encodeURIComponent(q)}`,
      ),
    enabled: q.trim().length > 0,
  });

  return (
    <div style={{ marginTop: 'var(--space-8)' }}>
      <div className="shelf-head"><h2>Add songs</h2></div>
      <div className="search-lg" style={{ marginBottom: 'var(--space-4)' }}>
        <Icon name="search" />
        <input
          placeholder="Search your library to add songs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {q.trim() && data && (
        <div className="search-results">
          {data.songs.length === 0 && <div className="sr-empty">No songs found.</div>}
          {data.songs.map((s) => (
            <div className="sr-item" key={s.id}>
              <div className="cover">
                <img src={s.cover ?? '/assets/cover-tide.svg'} alt="" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{s.title}</div>
                <div className="s">{s.subtitle}</div>
              </div>
              <button
                className="btn btn-secondary sm"
                onClick={() =>
                  add.mutate(
                    { playlistId, songId: s.id },
                    { onSuccess: () => toast.success('Added', s.title) },
                  )
                }
              >
                <Icon name="plus" size={15} />Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
