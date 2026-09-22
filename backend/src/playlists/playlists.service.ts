import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePlaylistDto, UpdatePlaylistDto } from './dto';

@Injectable()
export class PlaylistsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  listForUser(userId: string) {
    return this.prisma.playlist
      .findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { songs: true } } },
      })
      .then((rows) =>
        rows.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          image: this.storage.url(p.image),
          isPublic: p.isPublic,
          songCount: p._count.songs,
          updatedAt: p.updatedAt,
        })),
      );
  }

  async findOne(id: string, userId?: string) {
    const p = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        songs: {
          orderBy: { position: 'asc' },
          include: {
            song: {
              include: {
                artist: { select: { id: true, name: true, slug: true } },
                album: { select: { id: true, title: true, cover: true } },
              },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Playlist not found');
    if (!p.isPublic && p.userId !== userId) {
      throw new ForbiddenException('This playlist is private');
    }
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      image: this.storage.url(p.image),
      isPublic: p.isPublic,
      owner: p.user,
      tracks: p.songs.map((ps, i) => ({
        index: i + 1,
        position: ps.position,
        id: ps.song.id,
        title: ps.song.title,
        duration: ps.song.duration,
        artist: ps.song.artist,
        album: ps.song.album,
        cover: this.storage.songCover(ps.song),
        streamUrl: `/api/songs/${ps.song.id}/stream`,
      })),
    };
  }

  create(userId: string, dto: CreatePlaylistDto) {
    return this.prisma.playlist.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto) {
    await this.assertOwner(id, userId);
    return this.prisma.playlist.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.playlist.delete({ where: { id } });
    return { success: true };
  }

  async addSong(id: string, userId: string, songId: string) {
    await this.assertOwner(id, userId);
    const max = await this.prisma.playlistSong.aggregate({
      where: { playlistId: id },
      _max: { position: true },
    });
    await this.prisma.playlistSong.upsert({
      where: { playlistId_songId: { playlistId: id, songId } },
      create: { playlistId: id, songId, position: (max._max.position ?? -1) + 1 },
      update: {},
    });
    return this.findOne(id, userId);
  }

  async removeSong(id: string, userId: string, songId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.playlistSong.deleteMany({
      where: { playlistId: id, songId },
    });
    return this.findOne(id, userId);
  }

  async reorder(id: string, userId: string, songIds: string[]) {
    await this.assertOwner(id, userId);
    await this.prisma.$transaction(
      songIds.map((songId, position) =>
        this.prisma.playlistSong.updateMany({
          where: { playlistId: id, songId },
          data: { position },
        }),
      ),
    );
    return this.findOne(id, userId);
  }

  private async assertOwner(id: string, userId: string) {
    const p = await this.prisma.playlist.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Playlist not found');
    if (p.userId !== userId) throw new ForbiddenException('Not your playlist');
  }
}
