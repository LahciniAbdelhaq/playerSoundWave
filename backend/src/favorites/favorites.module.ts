import { Injectable, Module } from '@nestjs/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async list(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        song: {
          include: {
            artist: { select: { id: true, name: true, slug: true } },
            album: { select: { id: true, title: true, cover: true } },
          },
        },
      },
    });
    return favs.map((f, i) => ({
      index: i + 1,
      id: f.song.id,
      title: f.song.title,
      duration: f.song.duration,
      artist: f.song.artist,
      album: f.song.album,
      cover: this.storage.songCover(f.song),
      streamUrl: `/api/songs/${f.song.id}/stream`,
      youtubeId: this.storage.linkedYoutubeId(f.song),
      likedAt: f.createdAt,
    }));
  }

  async ids(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { songId: true },
    });
    return rows.map((r) => r.songId);
  }

  async add(userId: string, songId: string) {
    await this.prisma.favorite.upsert({
      where: { userId_songId: { userId, songId } },
      create: { userId, songId },
      update: {},
    });
    await this.prisma.song.update({
      where: { id: songId },
      data: { likes: { increment: 1 } },
    });
    return { liked: true };
  }

  async remove(userId: string, songId: string) {
    const deleted = await this.prisma.favorite.deleteMany({
      where: { userId, songId },
    });
    if (deleted.count) {
      await this.prisma.song.update({
        where: { id: songId },
        data: { likes: { decrement: 1 } },
      });
    }
    return { liked: false };
  }
}

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.favorites.list(userId);
  }

  @Get('ids')
  ids(@CurrentUser('id') userId: string) {
    return this.favorites.ids(userId);
  }

  @Post()
  add(@CurrentUser('id') userId: string, @Body('songId') songId: string) {
    return this.favorites.add(userId, songId);
  }

  @Delete(':songId')
  remove(@CurrentUser('id') userId: string, @Param('songId') songId: string) {
    return this.favorites.remove(userId, songId);
  }
}

@Module({
  providers: [FavoritesService],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
