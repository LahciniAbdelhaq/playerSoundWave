import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ArtistsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private serialize = (a: any) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    bio: a.bio,
    listeners: a.listeners,
    image: this.storage.url(a.image),
  });

  async findAll(params: { skip?: number; take?: number }) {
    const skip = Number(params.skip) || 0;
    const take = Number(params.take) || 20;
    const [items, total] = await Promise.all([
      this.prisma.artist.findMany({
        skip,
        take: Math.min(take, 100),
        orderBy: { listeners: 'desc' },
      }),
      this.prisma.artist.count(),
    ]);
    return { items: items.map(this.serialize), total };
  }

  async findOne(idOrSlug: string) {
    const artist = await this.prisma.artist.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        albums: {
          orderBy: { releaseDate: 'desc' },
          include: { songs: { take: 1, orderBy: { createdAt: 'asc' } } },
        },
        songs: {
          orderBy: { plays: 'desc' },
          take: 10,
          include: { album: { select: { id: true, title: true, cover: true } } },
        },
      },
    });
    if (!artist) throw new NotFoundException('Artist not found');
    return {
      ...this.serialize(artist),
      albums: artist.albums.map((al) => ({
        id: al.id,
        title: al.title,
        cover: this.storage.url(al.cover) ?? (al.songs?.[0] ? this.storage.songCover(al.songs[0]) : null),
        releaseDate: al.releaseDate,
      })),
      topSongs: artist.songs.map((s) => ({
        id: s.id,
        title: s.title,
        duration: s.duration,
        plays: s.plays,
        cover: this.storage.songCover(s),
        streamUrl: `/api/songs/${s.id}/stream`,
      })),
    };
  }
}
