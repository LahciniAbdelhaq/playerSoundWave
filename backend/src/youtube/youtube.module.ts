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
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { Public } from '../common/decorators';
import { SourceType } from '../common/enums';
import { promises as fs } from 'fs';
import { MediaService, YoutubeUnavailableError } from '../media/media.service';
import { youtubeVideoId } from '../storage/storage.service';
import { IngestService } from '../media/ingest.service';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

const YT_RE =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)[\w-]{11}/;

class PreviewDto {
  @IsString()
  @Matches(YT_RE, { message: 'Not a valid YouTube URL' })
  url: string;
}

// Search-result metadata is optional; it's used when the server can't read
// the video page itself (see YoutubeService.import).
class ImportDto extends PreviewDto {
  @IsOptional() @IsString() @MaxLength(300)
  title?: string;

  @IsOptional() @IsString() @MaxLength(200)
  uploader?: string;

  @IsOptional() @IsInt() @Min(0)
  duration?: number;
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

  /**
   * Full import: download → transcode → store → create Song.
   * When the server can't download from YouTube (bot check on cloud hosts,
   * or no yt-dlp), save a linked track instead: same library entry, but the
   * player streams it through YouTube's embed. Re-importing reuses the song.
   */
  async import(dto: ImportDto, userId?: string) {
    const { url } = dto;
    const videoId = youtubeVideoId(url);
    if (!YT_RE.test(url) || !videoId) throw new BadRequestException('Invalid YouTube URL');

    const existing = await this.ingest.findYoutubeSong(videoId);
    if (existing && !existing.youtubeId) return existing; // audio already stored

    let mp3: string | undefined;
    try {
      const meta = await this.media.youtubeMeta(url);
      mp3 = await this.media.youtubeToMp3(url);
      return await this.ingest.createSong({
        title: meta.title,
        artistName: meta.uploader,
        mp3AbsPath: mp3,
        duration: meta.duration,
        source: SourceType.YOUTUBE,
        sourceUrl: url,
        uploadedById: userId,
      });
    } catch (err) {
      if (!(err instanceof YoutubeUnavailableError)) throw err;
      if (existing) return existing;
      const meta = await this.linkedMeta(dto);
      return this.ingest.createSong({
        ...meta,
        source: SourceType.YOUTUBE,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        uploadedById: userId,
      });
    } finally {
      if (mp3) await fs.unlink(mp3).catch(() => undefined);
    }
  }

  /** Title/channel for a linked track: client-provided, else YouTube oEmbed. */
  private async linkedMeta(dto: ImportDto) {
    let { title, uploader } = dto;
    if (!title || !uploader) {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(dto.url)}`,
        );
        if (res.ok) {
          const j = (await res.json()) as { title?: string; author_name?: string };
          title ||= j.title;
          uploader ||= j.author_name;
        }
      } catch {
        /* fall through to defaults */
      }
    }
    return {
      title: title || 'YouTube track',
      artistName: uploader || 'Unknown Artist',
      duration: dto.duration ?? 0,
    };
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
  preview(@Body() dto: PreviewDto) {
    return this.youtube.preview(dto.url);
  }

  // Public so importing works without a login step. If a token is present the
  // user is recorded as the uploader; otherwise it's an anonymous import.
  @Public()
  @Post('import')
  import(@Body() dto: ImportDto, @CurrentUser('id') userId?: string) {
    return this.youtube.import(dto, userId);
  }
}

@Module({
  controllers: [YoutubeController],
  providers: [YoutubeService],
})
export class YoutubeModule {}
