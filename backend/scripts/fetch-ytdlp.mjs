// Vercel build step: download the standalone Linux yt-dlp binary into bin/ so the
// serverless function can run YouTube search/import (no Python on Vercel).
// Skipped everywhere except Linux; locally YTDLP_PATH / PATH is used instead.
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs';

if (process.platform !== 'linux') process.exit(0);
const dest = 'bin/yt-dlp';
if (existsSync(dest)) process.exit(0);

const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
const res = await fetch(url);
if (!res.ok) {
  console.warn(`yt-dlp download failed (${res.status}) — YouTube import disabled`);
  process.exit(0);
}
mkdirSync('bin', { recursive: true });
writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
chmodSync(dest, 0o755);
console.log('yt-dlp downloaded to', dest);
