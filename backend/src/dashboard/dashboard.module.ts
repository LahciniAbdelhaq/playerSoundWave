import { Injectable, Module } from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../common/guards';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const [users, songs, artists, albums, playsAgg] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.song.count(),
      this.prisma.artist.count(),
      this.prisma.album.count(),
      this.prisma.song.aggregate({ _sum: { plays: true } }),
    ]);
    return {
      totalUsers: users,
      totalSongs: songs,
      totalArtists: artists,
      totalAlbums: albums,
      totalPlays: playsAgg._sum.plays ?? 0,
    };
  }

  /** Plays per day for the last 14 days (for the chart). */
  async playsTimeline() {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const rows = await this.prisma.history.findMany({
      where: { playedAt: { gte: since } },
      select: { playedAt: true },
    });
    const buckets = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of rows) {
      const k = r.playedAt.toISOString().slice(0, 10);
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([date, plays]) => ({ date, plays }));
  }

  async topSongs() {
    const rows = await this.prisma.song.findMany({
      orderBy: { plays: 'desc' },
      take: 10,
      include: { artist: { select: { name: true } } },
    });
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist.name,
      plays: s.plays,
    }));
  }
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('stats')
  stats() {
    return this.dashboard.stats();
  }

  @Get('plays-timeline')
  timeline() {
    return this.dashboard.playsTimeline();
  }

  @Get('top-songs')
  top() {
    return this.dashboard.topSongs();
  }
}

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
