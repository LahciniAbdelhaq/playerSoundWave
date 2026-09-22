import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const songInclude = {
  artist: { select: { id: true, name: true, slug: true, image: true } },
  album: { select: { id: true, title: true, cover: true } },
} satisfies Prisma.SongInclude;

/** Strip YouTube-style noise from a track title for better lyric matching. */
function cleanTitle(title: string): string {
  let t = title
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '') // (Official Video), [Live] …
    .replace(/\b(official|audio|video|lyrics?|hd|4k|mv|m\/v|visualizer)\b/gi, '')
    .replace(/\bfeat\.?\b.*$/i, '')
    .trim();
  // YouTube titles are usually "Artist - Track" → keep the part AFTER the dash.
  const parts = t.split(/\s[-–|]\s/);
  if (parts.length > 1) t = parts.slice(1).join(' ');
  return t.replace(/\s+/g, ' ').trim() || title.trim();
}

/** Pick the best lyric record: prefer synced, then plain, avoid instrumentals. */
function pickBest(arr: any[]): any | null {
  if (!Array.isArray(arr) || !arr.length) return null;
  return (
    arr.find((x) => x.syncedLyrics && !x.instrumental) ??
    arr.find((x) => x.plainLyrics && !x.instrumental) ??
    arr.find((x) => x.syncedLyrics || x.plainLyrics) ??
    arr[0]
  );
}

async function lrclibGet(path: string): Promise<any | null> {
  try {
    const res = await fetch(`https://lrclib.net${path}`, {
      headers: {
        'User-Agent': 'SoundWave/0.1 (https://github.com/soundwave/app)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

@Injectable()
export class SongsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /** Map DB row → API shape with resolved media URLs. */
  serialize = (s: any) => ({
    id: s.id,
    title: s.title,
    duration: s.duration,
    plays: s.plays,
    likes: s.likes,
    source: s.source,
    cover: this.storage.songCover(s),
    streamUrl: `/api/songs/${s.id}/stream`,
    youtubeId: this.storage.linkedYoutubeId(s),
    artist: s.artist,
    album: s.album,
    createdAt: s.createdAt,
  });

  async findAll(params: {
    skip?: number;
    take?: number;
    sort?: 'trending' | 'latest' | 'top';
  }) {
    const { sort = 'latest' } = params;
    const skip = Number(params.skip) || 0;
    const take = Number(params.take) || 30;
    const orderBy: Prisma.SongOrderByWithRelationInput =
      sort === 'trending'
        ? { plays: 'desc' }
        : sort === 'top'
          ? { likes: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.song.findMany({
        skip,
        take: Math.min(take, 100),
        orderBy,
        include: songInclude,
      }),
      this.prisma.song.count(),
    ]);
    return { items: items.map(this.serialize), total };
  }

  async findOne(id: string) {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: songInclude,
    });
    if (!song) throw new NotFoundException('Song not found');
    return this.serialize(song);
  }

  /** Raw row incl. filePath — for the streaming controller. */
  async findRaw(id: string) {
    const song = await this.prisma.song.findUnique({ where: { id } });
    if (!song) throw new NotFoundException('Song not found');
    return song;
  }

  /**
   * Fetch lyrics for a song from lrclib.net (free, no key). Returns synced
   * (LRC) lyrics when available, plus a plain-text fallback.
   */
  async getLyrics(id: string) {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: { artist: { select: { name: true } } },
    });
    if (!song) throw new NotFoundException('Song not found');

    const artist = song.artist.name;
    const title = song.title;
    const clean = cleanTitle(title);

    // 1) exact get by artist + track + duration
    let hit = await lrclibGet(
      `/api/get?` +
        new URLSearchParams({
          artist_name: artist,
          track_name: clean,
          duration: String(song.duration),
        }),
    );

    // 2) fuzzy search fallback (title noise from YouTube imports is common).
    //    Try artist+track, then a looser free-text query.
    if (!hit || hit.instrumental) {
      let arr = await lrclibGet(
        `/api/search?` +
          new URLSearchParams({ track_name: clean, artist_name: artist }),
      );
      let best = pickBest(arr);
      if (!best || best.instrumental) {
        arr = await lrclibGet(`/api/search?` + new URLSearchParams({ q: `${artist} ${clean}` }));
        best = pickBest(arr) ?? best;
      }
      if (best) hit = best;
    }

    if (!hit) {
      return { found: false, instrumental: false, syncedLyrics: null, plainLyrics: null };
    }
    return {
      found: true,
      instrumental: !!hit.instrumental,
      syncedLyrics: hit.syncedLyrics ?? null,
      plainLyrics: hit.plainLyrics ?? null,
    };
  }

  async incrementPlays(id: string) {
    await this.prisma.song.update({
      where: { id },
      data: { plays: { increment: 1 } },
    });
  }

  async remove(id: string) {
    const song = await this.findRaw(id);
    await this.storage.remove(song.filePath);
    await this.storage.remove(song.coverPath);
    await this.prisma.song.delete({ where: { id } });
    return { success: true };
  }
}
