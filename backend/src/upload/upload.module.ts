import { BadRequestException, Injectable, Module } from '@nestjs/common';
import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { SourceType } from '../common/enums';
import { promises as fs } from 'fs';
import { parseBuffer } from 'music-metadata';
import { MediaService } from '../media/media.service';
import { IngestService } from '../media/ingest.service';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

const ALLOWED = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];

@Injectable()
export class UploadService {
  constructor(
    private media: MediaService,
    private ingest: IngestService,
  ) {}

  async handle(
    file: Express.Multer.File,
    userId: string,
    title?: string,
    artist?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException('Only MP3, WAV, or FLAC are accepted');
    }

    // Pull embedded tags as fallbacks.
    let metaTitle = title;
    let metaArtist = artist;
    try {
      const meta = await parseBuffer(file.buffer, file.mimetype);
      metaTitle = metaTitle || meta.common.title;
      metaArtist = metaArtist || meta.common.artist;
    } catch {
      /* ignore tag parse errors */
    }

    const ext = (file.originalname.split('.').pop() ?? 'tmp').toLowerCase();
    const mp3 = await this.media.transcodeToMp3(file.buffer, ext);
    const duration = await this.media.durationSeconds(mp3);

    const song = await this.ingest.createSong({
      title: metaTitle || file.originalname.replace(/\.[^.]+$/, ''),
      artistName: metaArtist || 'Unknown Artist',
      mp3AbsPath: mp3,
      duration,
      source: SourceType.UPLOAD,
      uploadedById: userId,
    });
    await fs.unlink(mp3).catch(() => undefined);
    return song;
  }
}

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private upload: UploadService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 50) * 1024 * 1024 },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('title') title?: string,
    @Body('artist') artist?: string,
  ) {
    return this.upload.handle(file, userId, title, artist);
  }
}

@Module({
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
