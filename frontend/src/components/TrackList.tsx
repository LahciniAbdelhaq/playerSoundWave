'use client';
import { Icon } from '@/components/Icon';
import { usePlayerStore } from '@/stores/player';
import { LikeButton } from '@/components/LikeButton';
import { SongMenu } from '@/components/SongMenu';
import type { Song } from '@/lib/types';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Reproduces the design's `.tbl` track table (row hover → play button). */
export function TrackList({ songs }: { songs: Song[] }) {
  const playSong = usePlayerStore((s) => s.playSong);
  const current = usePlayerStore((s) => s.current);

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th className="row-idx">#</th>
            <th>Title</th>
            <th>Plays</th>
            <th className="num">
              <Icon name="clock" size={15} />
            </th>
            <th style={{ width: 90 }}></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, i) => {
            const isCurrent = current?.id === song.id;
            return (
              <tr key={song.id} onClick={() => playSong(song, songs)}>
                <td className="row-idx">
                  {isCurrent ? (
                    <span className="eq-mini"><i /><i /><i /></span>
                  ) : (
                    <>
                      <span className="num">{i + 1}</span>
                      <span className="play">
                        <Icon name="play" size={14} />
                      </span>
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
                      <div className="a">{song.artist.name}</div>
                    </div>
                  </div>
                </td>
                <td>{(song.plays ?? 0).toLocaleString()}</td>
                <td className="num">{fmt(song.duration)}</td>
                <td>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LikeButton songId={song.id} size={17} />
                    <SongMenu songId={song.id} title={song.title} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
