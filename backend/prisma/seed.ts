/**
 * Seed script — populates demo catalogue mirroring the SoundWave design data.
 * Audio files are not generated (upload / YouTube import create real audio);
 * songs are seeded with metadata + cover art so the UI is fully populated.
 *
 *   npm run seed
 */
import { PrismaClient } from '@prisma/client';
import { Role, SourceType } from '../src/common/enums';
import * as bcrypt from 'bcrypt';
import { promises as fs } from 'fs';
import { join } from 'path';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

const COVERS = [
  'aurora', 'bloom', 'dusk', 'ember', 'forest', 'midnight', 'mono', 'tide',
];

// Stored cover value per name: a relative path (local driver) or blob URL (blob driver).
const coverPaths: Record<string, string> = {};

async function copyCovers() {
  const src = join(__dirname, 'seed-assets');
  if (process.env.STORAGE_DRIVER === 'blob') {
    for (const c of COVERS) {
      const blob = await put(`covers/${c}.svg`, await fs.readFile(join(src, `cover-${c}.svg`)), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/svg+xml',
      });
      coverPaths[c] = blob.url;
    }
    return;
  }
  const dest = join(process.cwd(), process.env.STORAGE_ROOT ?? 'storage', 'covers');
  await fs.mkdir(dest, { recursive: true });
  for (const c of COVERS) {
    await fs
      .copyFile(join(src, `cover-${c}.svg`), join(dest, `${c}.svg`))
      .catch(() => undefined);
  }
}

const cover = (name: string) => coverPaths[name] ?? `covers/${name}.svg`;

async function main() {
  // `--if-empty` (used by the Vercel build): only seed a fresh database.
  if (process.argv.includes('--if-empty') && (await prisma.user.count()) > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }
  await copyCovers();

  // ---- Users ----
  const password = await bcrypt.hash('password123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@soundwave.fm' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@soundwave.fm',
      password,
      role: Role.ADMIN,
    },
  });
  const jordan = await prisma.user.upsert({
    where: { email: 'jordan@soundwave.fm' },
    update: {},
    create: { username: 'jordan', email: 'jordan@soundwave.fm', password },
  });

  // ---- Artists (from the design) ----
  const artistSeed = [
    { name: 'Aurora Bay', slug: 'aurora-bay', image: cover('bloom'), listeners: 2_840_000 },
    { name: 'Solstate', slug: 'solstate', image: cover('tide'), listeners: 1_920_000 },
    { name: 'Vela', slug: 'vela', image: cover('ember'), listeners: 1_240_000 },
    { name: 'Kara Mori', slug: 'kara-mori', image: cover('forest'), listeners: 980_000 },
    { name: 'Nova Lux', slug: 'nova-lux', image: cover('midnight'), listeners: 760_000 },
    { name: 'The Reverb', slug: 'the-reverb', image: cover('dusk'), listeners: 540_000 },
    { name: 'Halcyon', slug: 'halcyon', image: cover('aurora'), listeners: 430_000 },
  ];
  const artists: Record<string, string> = {};
  for (const a of artistSeed) {
    const row = await prisma.artist.upsert({
      where: { slug: a.slug },
      update: { listeners: a.listeners, image: a.image },
      create: a,
    });
    artists[a.slug] = row.id;
  }

  // ---- Albums ----
  const albumSeed = [
    { title: 'Neon Tide', cover: cover('tide'), artist: 'solstate' },
    { title: 'Field Notes', cover: cover('forest'), artist: 'kara-mori' },
    { title: 'Ember Skies', cover: cover('ember'), artist: 'vela' },
    { title: 'After Hours', cover: cover('dusk'), artist: 'the-reverb' },
    { title: 'Midnight Pulse', cover: cover('midnight'), artist: 'aurora-bay' },
  ];
  const albums: Record<string, string> = {};
  for (const al of albumSeed) {
    const existing = await prisma.album.findFirst({ where: { title: al.title } });
    const row =
      existing ??
      (await prisma.album.create({
        data: {
          title: al.title,
          cover: al.cover,
          artistId: artists[al.artist],
          releaseDate: new Date(2024, Math.floor(Math.random() * 12), 1),
        },
      }));
    albums[al.title] = row.id;
  }

  // ---- Songs ----
  const songSeed = [
    ['Neon Tide', 'solstate', 'Neon Tide', 'tide', 201],
    ['Midnight Pulse', 'aurora-bay', 'Midnight Pulse', 'midnight', 224],
    ['Deep Forest', 'kara-mori', 'Field Notes', 'forest', 188],
    ['Ember Skies', 'vela', 'Ember Skies', 'ember', 176],
    ['Dusk Drive', 'the-reverb', 'After Hours', 'dusk', 213],
    ['Afterglow', 'halcyon', null, 'aurora', 198],
    ['Gravity', 'nova-lux', null, 'midnight', 205],
    ['Paper Planes', 'aurora-bay', 'Midnight Pulse', 'bloom', 167],
    ['Late Night Drive', 'the-reverb', 'After Hours', 'dusk', 240],
    ['Field of View', 'kara-mori', 'Field Notes', 'forest', 192],
  ] as const;

  const songIds: string[] = [];
  for (const [title, artistSlug, albumTitle, coverName, duration] of songSeed) {
    const existing = await prisma.song.findFirst({ where: { title } });
    const row =
      existing ??
      (await prisma.song.create({
        data: {
          title,
          artistId: artists[artistSlug],
          albumId: albumTitle ? albums[albumTitle] : null,
          duration,
          filePath: `music/placeholder.mp3`, // replaced by real upload/import
          coverPath: cover(coverName),
          source: SourceType.UPLOAD,
          plays: Math.floor(Math.random() * 500_000),
          likes: Math.floor(Math.random() * 50_000),
        },
      }));
    songIds.push(row.id);
  }

  // ---- Playlists ----
  const focus =
    (await prisma.playlist.findFirst({ where: { title: 'Focus Flow', userId: jordan.id } })) ??
    (await prisma.playlist.create({
      data: {
        title: 'Focus Flow',
        description: 'Beats to focus to.',
        image: cover('forest'),
        userId: jordan.id,
      },
    }));
  await prisma.playlistSong.deleteMany({ where: { playlistId: focus.id } });
  await prisma.playlistSong.createMany({
    data: songIds.slice(0, 6).map((songId, position) => ({
      playlistId: focus.id,
      songId,
      position,
    })),
  });

  // ---- Favorites + history for jordan ----
  await prisma.favorite.deleteMany({ where: { userId: jordan.id } });
  await prisma.favorite.createMany({
    data: songIds.slice(0, 4).map((songId) => ({ userId: jordan.id, songId })),
  });
  await prisma.history.createMany({
    data: songIds.slice(0, 8).map((songId, i) => ({
      userId: jordan.id,
      songId,
      playedAt: new Date(Date.now() - i * 3_600_000),
    })),
  });

  console.log('Seed complete.');
  console.log('  admin@soundwave.fm / password123  (ADMIN)');
  console.log('  jordan@soundwave.fm / password123  (USER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
