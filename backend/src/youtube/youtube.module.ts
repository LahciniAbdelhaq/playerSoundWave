import { BadRequestException, Injectable, Module } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { Public } from '../common/decorators';
import { SourceType } from '../common/enums';
import { promises as fs } from 'fs';
import { MediaService } from '../media/media.service';
import { IngestService } from '../media/ingest.service';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

const YT_RE =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)[\w-]{11}/;

class ImportDto {
  @IsString()
  @Matches(YT_RE, { message: 'Not a valid YouTube URL' })
  url: string;
}

@Injectable()
export class YoutubeService {
  constructor(
    private media: MediaService,
    private ingest: IngestService,
  ) {}

  /** Search YouTube and return results (no download). */
  search(query: string, limit = 20) {
    const q = (query ?? '').trim();
    if (!q) return [];
    return this.media.youtubeSearch(q, Math.min(limit, 40));
  }

  /** Is yt-dlp present and runnable on this server? */
  health() {
    return this.media.ytdlpStatus();
  }

  /** Validate URL + return metadata for a preview before importing. */
  async preview(url: string) {
    if (!YT_RE.test(url)) throw new BadRequestException('Invalid YouTube URL');
    return this.media.youtubeMeta(url);
  }

  /** Full import: download → transcode → store → create Song. */
  async import(url: string, userId?: string) {
    if (!YT_RE.test(url)) throw new BadRequestException('Invalid YouTube URL');
    const meta = await this.media.youtubeMeta(url);
    const mp3 = await this.media.youtubeToMp3(url);

    const song = await this.ingest.createSong({
      title: meta.title,
      artistName: meta.uploader,
      mp3AbsPath: mp3,
      duration: meta.duration,
      source: SourceType.YOUTUBE,
      sourceUrl: url,
      uploadedById: userId,
    });
    await fs.unlink(mp3).catch(() => undefined);
    return song;
  }
}

@ApiTags('youtube-import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('youtube')
export class YoutubeController {
  constructor(private youtube: YoutubeService) {}

  @Public()
  @Get('health')
  health() {
    return this.youtube.health();
  }

  @Public()
  @Get('search')
  searchResults(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.youtube.search(q, Number(limit) || 20);
  }

  @Public()
  @Post('preview')
  preview(@Body() dto: ImportDto) {
    return this.youtube.preview(dto.url);
  }

  // Public so importing works without a login step. If a token is present the
  // user is recorded as the uploader; otherwise it's an anonymous import.
  @Public()
  @Post('import')
  import(@Body() dto: ImportDto, @CurrentUser('id') userId?: string) {
    return this.youtube.import(dto.url, userId);
  }
}

@Module({
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
