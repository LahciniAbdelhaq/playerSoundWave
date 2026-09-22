import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AlbumsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private serialize = (a: any) => ({
    id: a.id,
    title: a.title,
    // Fall back to a track's art (incl. YouTube thumbnail) when the album has no cover.
    cover: this.storage.url(a.cover) ?? (a.songs?.[0] ? this.storage.songCover(a.songs[0]) : null),
    releaseDate: a.releaseDate,
    artist: a.artist,
  });

  async findAll(params: { skip?: number; take?: number }) {
    const skip = Number(params.skip) || 0;
    const take = Number(params.take) || 20;
    const [items, total] = await Promise.all([
      this.prisma.album.findMany({
        skip,
        take: Math.min(take, 100),
        orderBy: { releaseDate: 'desc' },
        include: {
          artist: { select: { id: true, name: true, slug: true } },
          songs: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      }),
      this.prisma.album.count(),
    ]);
    return { items: items.map(this.serialize), total };
  }

  async findOne(id: string) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: {
        artist: { select: { id: true, name: true, slug: true, image: true } },
        songs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!album) throw new NotFoundException('Album not found');
    return {
      ...this.serialize(album),
      tracks: album.songs.map((s, i) => ({
        index: i + 1,
        id: s.id,
        title: s.title,
        duration: s.duration,
        plays: s.plays,
        streamUrl: `/api/songs/${s.id}/stream`,
        cover: this.storage.songCover({ ...s, album: { cover: album.cover } }),
      })),
    };
  }
}
