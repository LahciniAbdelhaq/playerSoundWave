import { Injectable } from '@nestjs/common';
import { promises as fs, createReadStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { ReadStream } from 'fs';
import { put, del } from '@vercel/blob';

export type StorageBucket =
  | 'music'
  | 'covers'
  | 'artists'
  | 'albums'
  | 'playlists';

/** 11-char video id from any common YouTube URL shape. */
export function youtubeVideoId(url?: string | null): string | null {
  return url?.match(/(?:v=|\/|youtu\.be\/|embed\/|shorts\/)([\w-]{11})(?:[?&#]|$)/)?.[1] ?? null;
}

/**
 * Two drivers, picked by STORAGE_DRIVER:
 *  - "local" (dev): files on disk; returns *relative* paths (e.g. "music/abc.mp3")
 *    that are stored in the DB and served at PUBLIC_MEDIA_URL.
 *  - "blob" (Vercel): files in Vercel Blob; returns the blob's absolute public
 *    URL, which is stored in the DB as-is (url() passes absolute URLs through).
 */
@Injectable()
export class StorageService {
  private readonly root = join(
    process.cwd(),
    process.env.STORAGE_ROOT ?? 'storage',
  );
  readonly publicBase = process.env.PUBLIC_MEDIA_URL ?? 'http://localhost:4000/media';
  readonly isBlob = process.env.STORAGE_DRIVER === 'blob';

  /** True when the stored value is already an absolute URL (blob driver). */
  static isRemote(path: string): boolean {
    return /^https?:\/\//i.test(path);
  }

  /** Absolute path for a relative storage key. */
  abs(relativePath: string): string {
    return join(this.root, relativePath);
  }

  /** Public URL for a stored relative path. */
  url(relativePath?: string | null): string | null {
    if (!relativePath) return null;
    if (StorageService.isRemote(relativePath)) return relativePath;
    return `${this.publicBase}/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Best-available poster for a song: stored cover → album cover → for YouTube
   * imports, the video's own thumbnail derived from sourceUrl. Returns null only
   * when nothing is available (the UI then shows its generated placeholder).
   */
  songCover(song: {
    coverPath?: string | null;
    album?: { cover?: string | null } | null;
    source?: string | null;
    sourceUrl?: string | null;
  }): string | null {
    const stored = this.url(song.coverPath) ?? this.url(song.album?.cover);
    if (stored) return stored;
    if (song.source !== 'YOUTUBE') return null;
    const id = youtubeVideoId(song.sourceUrl);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }

  /**
   * Video id for a *linked* YouTube track: one saved without audio (downloads
   * blocked, e.g. on Vercel) that the player streams via YouTube's embed.
   * Null for every song that has a stored audio file.
   */
  linkedYoutubeId(song: {
    filePath?: string | null;
    source?: string | null;
    sourceUrl?: string | null;
  }): string | null {
    if (song.source !== 'YOUTUBE' || song.filePath) return null;
    return youtubeVideoId(song.sourceUrl);
  }

  async save(bucket: StorageBucket, fileName: string, data: Buffer): Promise<string> {
    if (this.isBlob) return this.putBlob(bucket, fileName, data);
    const rel = join(bucket, fileName);
    const abs = this.abs(rel);
    await fs.mkdir(dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    return rel.replace(/\\/g, '/');
  }

  /** Move an existing absolute file into a bucket (used by ffmpeg/yt-dlp output). */
  async adopt(bucket: StorageBucket, fileName: string, srcAbs: string): Promise<string> {
    if (this.isBlob) {
      const url = await this.putBlob(bucket, fileName, await fs.readFile(srcAbs));
      await fs.unlink(srcAbs).catch(() => undefined);
      return url;
    }
    const rel = join(bucket, fileName);
    const destAbs = this.abs(rel);
    await fs.mkdir(dirname(destAbs), { recursive: true });
    try {
      await fs.rename(srcAbs, destAbs);
    } catch (err: any) {
      // rename can't cross drives/filesystems (EXDEV) — fall back to copy+unlink.
      if (err?.code === 'EXDEV') {
        await fs.copyFile(srcAbs, destAbs);
        await fs.unlink(srcAbs).catch(() => undefined);
      } else {
        throw err;
      }
    }
    return rel.replace(/\\/g, '/');
  }

  private async putBlob(bucket: StorageBucket, fileName: string, data: Buffer) {
    const blob = await put(`${bucket}/${fileName}`, data, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }

  exists(relativePath: string): boolean {
    return existsSync(this.abs(relativePath));
  }

  async stat(relativePath: string) {
    return fs.stat(this.abs(relativePath));
  }

  stream(relativePath: string, opts?: { start: number; end: number }): ReadStream {
    return createReadStream(this.abs(relativePath), opts);
  }

  async remove(relativePath?: string | null): Promise<void> {
    if (!relativePath) return;
    if (StorageService.isRemote(relativePath)) {
      // Only delete blobs we own; seeded/external URLs (e.g. YouTube) are left alone.
      if (this.isBlob && relativePath.includes('.blob.vercel-storage.com/')) {
        await del(relativePath).catch(() => undefined);
      }
      return;
    }
    try {
      await fs.unlink(this.abs(relativePath));
    } catch {
      /* ignore missing */
    }
  }
}
