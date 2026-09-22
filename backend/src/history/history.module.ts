import { Injectable, Module } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

@Injectable()
export class HistoryService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  record(userId: string, songId: string) {
    return this.prisma.history.create({ data: { userId, songId } });
  }

  async list(userId: string, take = 50) {
    const rows = await this.prisma.history.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: Math.min(take, 200),
      include: {
        song: {
          include: {
            artist: { select: { id: true, name: true, slug: true } },
            album: { select: { id: true, title: true, cover: true } },
          },
        },
      },
    });
    return rows.map((h) => ({
      id: h.song.id,
      title: h.song.title,
      duration: h.song.duration,
      artist: h.song.artist,
      cover: this.storage.songCover(h.song),
      streamUrl: `/api/songs/${h.song.id}/stream`,
      playedAt: h.playedAt,
    }));
  }
}

@ApiTags('history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private history: HistoryService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('take') take?: string) {
    return this.history.list(userId, Number(take) || 50);
  }

  @Post()
  record(@CurrentUser('id') userId: string, @Body('songId') songId: string) {
    return this.history.record(userId, songId);
  }
}

@Module({
  providers: [HistoryService],
  controllers: [HistoryController],
})
export class HistoryModule {}
