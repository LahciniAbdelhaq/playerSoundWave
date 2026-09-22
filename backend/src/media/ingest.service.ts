import { Injectable } from '@nestjs/common';
import { SourceType } from '../common/enums';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class IngestService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /** Find or create an artist by display name. */
  async resolveArtist(name: string) {
    const slug = slugify(name) || randomUUID().slice(0, 8);
    return this.prisma.artist.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
  }

  /**
   * Move a transcoded mp3 (absolute temp path) into storage and create the
   * Song row. Returns the created song.
   */
  async createSong(params: {
    title: string;
    artistName: string;
    mp3AbsPath: string;
    duration: number;
    source: SourceType;
    sourceUrl?: string;
    uploadedById?: string;
    coverPath?: string;
  }) {
    const artist = await this.resolveArtist(params.artistName);
    const fileName = `${randomUUID()}.mp3`;
    const filePath = await this.storage.adopt('music', fileName, params.mp3AbsPath);

    const song = await this.prisma.song.create({
      data: {
        title: params.title,
        artistId: artist.id,
        duration: params.duration,
        filePath,
        coverPath: params.coverPath,
        source: params.source,
        sourceUrl: params.sourceUrl,
        uploadedById: params.uploadedById,
      },
      include: { artist: { select: { id: true, name: true, slug: true } } },
    });

    // Return the same serialized shape the player expects (streamUrl + cover).
    return {
      id: song.id,
      title: song.title,
      duration: song.duration,
      plays: song.plays,
      likes: song.likes,
      source: song.source,
      artist: song.artist,
      cover: this.storage.url(song.coverPath),
      streamUrl: `/api/songs/${song.id}/stream`,
    };
  }
}
