import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SongsService } from '../songs/songs.service';
import { StorageService } from '../storage/storage.service';
import { Public } from '../common/decorators';

@ApiTags('streaming')
@Controller('songs')
export class StreamingController {
  constructor(
    private songs: SongsService,
    private storage: StorageService,
  ) {}

  /**
   * Progressive audio streaming with HTTP Range support (seek + fast start).
   * GET /api/songs/:id/stream
   */
  @Public()
  @Get(':id/stream')
  async stream(
    @Param('id') id: string,
    @Headers('range') range: string | undefined,
    @Req() _req: Request,
    @Res() res: Response,
  ) {
    const song = await this.songs.findRaw(id);

    // Blob driver: the CDN serves the file (with Range support) — just redirect.
    if (StorageService.isRemote(song.filePath)) {
      this.songs.incrementPlays(id).catch(() => undefined);
      return res.redirect(302, song.filePath);
    }

    if (!this.storage.exists(song.filePath)) {
      throw new NotFoundException('Audio file missing');
    }

    const { size } = await this.storage.stat(song.filePath);
    const contentType = 'audio/mpeg';

    if (!range) {
      res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      });
      this.songs.incrementPlays(id).catch(() => undefined);
      return this.storage.stream(song.filePath).pipe(res);
    }

    // Parse "bytes=start-end"
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10) || 0;
    const end = endStr ? parseInt(endStr, 10) : size - 1;

    if (start >= size || end >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      return res.end();
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    });
    return this.storage.stream(song.filePath, { start, end }).pipe(res);
  }
}
