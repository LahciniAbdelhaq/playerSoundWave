import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { spawn, execFileSync } from 'child_process';
import { accessSync, chmodSync, constants, copyFileSync, existsSync, promises as fs } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import { randomUUID } from 'crypto';
import { parseFile } from 'music-metadata';

/**
 * Serverless bundles can drop the executable bit on bundled binaries (and
 * /var/task is read-only), so fall back to an executable copy in the temp dir.
 */
const execCache = new Map<string, string>();
function executable(path: string): string {
  const cached = execCache.get(path);
  if (cached) return cached;
  let resolved = path;
  if (process.platform !== 'win32' && existsSync(path)) {
    try {
      accessSync(path, constants.X_OK);
    } catch {
      resolved = join(tmpdir(), `sw-bin-${basename(path)}`);
      if (!existsSync(resolved)) copyFileSync(path, resolved);
      chmodSync(resolved, 0o755);
    }
  }
  execCache.set(path, resolved);
  return resolved;
}

// Resolved at call time (not import time) so @nestjs/config has loaded .env.
// Fallbacks cover Vercel, which has neither tool installed: ffmpeg comes from
// the ffmpeg-static package, yt-dlp from bin/ (downloaded by scripts/fetch-ytdlp.mjs).
const ffmpegBin = (): string => {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const bundled = require('ffmpeg-static') as string | null;
  return bundled ? executable(bundled) : 'ffmpeg';
};
const ytdlpBin = (): string => {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  const bundled = join(process.cwd(), 'bin', 'yt-dlp');
  return existsSync(bundled) ? executable(bundled) : 'yt-dlp';
};

/** Turn a raw yt-dlp failure into a message the UI can show. */
function ytdlpError(err: any): ServiceUnavailableException {
  const text = String(err?.message ?? err);
  if (err?.code === 'ENOENT') {
    return new ServiceUnavailableException('yt-dlp is not installed on the server');
  }
  if (/sign in to confirm|not a bot|HTTP Error 429/i.test(text)) {
    return new ServiceUnavailableException(
      'YouTube is blocking requests from this server (common on cloud hosts). Upload the file instead.',
    );
  }
  const last = text.trim().split('\n').pop() ?? 'unknown error';
  return new ServiceUnavailableException(`YouTube request failed: ${last.slice(0, 200)}`);
}

export interface YoutubeMeta {
  title: string;
  uploader: string;
  duration: number; // seconds
  thumbnail?: string;
}

export interface YoutubeResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  url: string;
}

/**
 * Wraps ffmpeg + yt-dlp. All methods return paths to temp files in the OS
 * temp dir; callers move them into StorageService.
 */
@Injectable()
export class MediaService {
  private readonly log = new Logger(MediaService.name);

  private run(cmd: string, args: string[]): Promise<{ stdout: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));
      child.on('error', reject);
      child.on('close', (code) =>
        code === 0
          ? resolve({ stdout })
          : reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`)),
      );
    });
  }

  /** Run yt-dlp; failures are logged in full and surfaced as a readable 503. */
  private async ytdlp(args: string[]): Promise<{ stdout: string }> {
    try {
      return await this.run(ytdlpBin(), ['--no-warnings', '--no-cache-dir', ...args]);
    } catch (err) {
      this.log.error(`yt-dlp failed: ${(err as Error).message}`);
      throw ytdlpError(err);
    }
  }

  /** Diagnostics for GET /api/youtube/health: which binary, and does it run? */
  ytdlpStatus() {
    const path = ytdlpBin();
    try {
      const version = execFileSync(path, ['--version'], { timeout: 30_000 }).toString().trim();
      return { ok: true, path, version };
    } catch (err: any) {
      return { ok: false, path, error: String(err?.message ?? err).slice(0, 300) };
    }
  }

  /** Transcode any input buffer (mp3/wav/flac) to a normalized MP3 file. */
  async transcodeToMp3(input: Buffer, originalExt = 'tmp'): Promise<string> {
    const inPath = join(tmpdir(), `sw-${randomUUID()}.${originalExt}`);
    const outPath = join(tmpdir(), `sw-${randomUUID()}.mp3`);
    await fs.writeFile(inPath, input);
    try {
      await this.run(ffmpegBin(), [
        '-y',
        '-i', inPath,
        '-vn',
        '-codec:a', 'libmp3lame',
        '-b:a', '192k',
        outPath,
      ]);
      return outPath;
    } finally {
      fs.unlink(inPath).catch(() => undefined);
    }
  }

  /** Duration of an audio file in whole seconds (pure JS — no ffprobe needed). */
  async durationSeconds(filePath: string): Promise<number> {
    try {
      const meta = await parseFile(filePath, { duration: true });
      return Math.round(meta.format.duration ?? 0);
    } catch {
      return 0;
    }
  }

  /** Read YouTube metadata without downloading the media. */
  async youtubeMeta(url: string): Promise<YoutubeMeta> {
    const { stdout } = await this.ytdlp(['-J', url]);
    const j = JSON.parse(stdout);
    return {
      title: j.title,
      uploader: j.uploader ?? j.channel ?? 'Unknown',
      duration: Math.round(j.duration ?? 0),
      thumbnail: j.thumbnail,
    };
  }

  /**
   * Search YouTube (like the YouTube search box) and return a list of results
   * without downloading anything. Uses yt-dlp's `ytsearchN:` + flat playlist.
   */
  async youtubeSearch(query: string, limit = 20): Promise<YoutubeResult[]> {
    const { stdout } = await this.ytdlp([
      `ytsearch${limit}:${query}`,
      '--flat-playlist',
      '-J',
    ]);
    const j = JSON.parse(stdout);
    const entries: any[] = Array.isArray(j.entries) ? j.entries : [];
    return entries
      .filter((e) => e && e.id)
      .map((e) => ({
        id: e.id as string,
        title: e.title ?? 'Untitled',
        uploader: e.uploader ?? e.channel ?? 'Unknown',
        duration: Math.round(e.duration ?? 0),
        thumbnail:
          e.thumbnails?.[e.thumbnails.length - 1]?.url ??
          `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${e.id}`,
      }));
  }

  /**
   * Download best audio from YouTube and transcode to MP3. Returns temp path.
   * yt-dlp only downloads and ffmpeg converts: yt-dlp's own -x step needs
   * ffprobe, which isn't available on Vercel.
   */
  async youtubeToMp3(url: string): Promise<string> {
    const id = randomUUID();
    await this.ytdlp([
      '-f', 'bestaudio/best',
      '--no-playlist',
      '-o', join(tmpdir(), `sw-${id}.%(ext)s`),
      url,
    ]);
    const file = (await fs.readdir(tmpdir())).find((f) => f.startsWith(`sw-${id}.`));
    if (!file) throw new Error('yt-dlp produced no audio file');
    const src = join(tmpdir(), file);
    const outPath = join(tmpdir(), `sw-${randomUUID()}.mp3`);
    try {
      await this.run(ffmpegBin(), [
        '-y',
        '-i', src,
        '-vn',
        '-codec:a', 'libmp3lame',
        '-b:a', '192k',
        outPath,
      ]);
      return outPath;
    } finally {
      fs.unlink(src).catch(() => undefined);
    }
  }
}
