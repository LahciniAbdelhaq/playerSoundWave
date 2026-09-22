import { Injectable, Module } from '@nestjs/common';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Public } from '../common/decorators';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async search(q: string) {
    const query = (q ?? '').trim();
    if (!query) return { songs: [], artists: [], albums: [], playlists: [] };
    // SQLite LIKE is already case-insensitive for ASCII and rejects `mode`;
    // Postgres (production) needs `mode: 'insensitive'` for the same behaviour.
    // Cast: the generated client's types depend on which provider it was built for.
    const isPostgres = /^postgres(ql)?:/.test(process.env.DATABASE_URL ?? '');
    const contains: any = isPostgres
      ? { contains: query, mode: 'insensitive' }
      : { contains: query };

    const [songs, artists, albums, playlists] = await Promise.all([
      this.prisma.song.findMany({
        where: { title: contains },
        take: 6,
        include: { artist: { select: { id: true, name: true } } },
      }),
      this.prisma.artist.findMany({ where: { name: contains }, take: 6 }),
      this.prisma.album.findMany({
        where: { title: contains },
        take: 6,
        include: { artist: { select: { id: true, name: true } } },
      }),
      this.prisma.playlist.findMany({
        where: { title: contains, isPublic: true },
        take: 6,
      }),
    ]);

    return {
      songs: songs.map((s) => ({
        id: s.id,
        type: 'song',
        title: s.title,
        subtitle: s.artist.name,
        cover: this.storage.songCover(s),
        streamUrl: `/api/songs/${s.id}/stream`,
      })),
      artists: artists.map((a) => ({
        id: a.id,
        type: 'artist',
        title: a.name,
        subtitle: 'Artist',
        cover: this.storage.url(a.image),
      })),
      albums: albums.map((a) => ({
        id: a.id,
        type: 'album',
        title: a.title,
        subtitle: a.artist.name,
        cover: this.storage.url(a.cover),
      })),
      playlists: playlists.map((p) => ({
        id: p.id,
        type: 'playlist',
        title: p.title,
        subtitle: 'Playlist',
        cover: this.storage.url(p.image),
      })),
    };
  }
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private search: SearchService) {}

  @Public()
  @Get()
  run(@Query('q') q: string) {
    return this.search.search(q);
  }
}

@Module({
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
