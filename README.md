# SoundWave Music

A Spotify-like music streaming platform built on the **SoundWave** design system.

> The UI is a faithful, pixel-perfect reproduction of the design at `../soundwave`.
> Design tokens, components, and the app shell are ported verbatim — see `frontend/src/styles`.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, Zustand, TanStack Query |
| Backend  | NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT (access + refresh), Swagger |
| Storage  | Local filesystem (dev) · MinIO / S3-compatible (prod) |
| Media    | FFmpeg (transcode → MP3), yt-dlp (YouTube import) |

## Monorepo layout

```
player/
├── backend/          NestJS API (14 modules) + Prisma + storage
├── frontend/         Next.js 15 app (design reproduced 1:1)
├── docker-compose.yml  Postgres + MinIO + API + Web
└── README.md
```

## Quick start (dev)

```bash
# 1. Infrastructure (Postgres + MinIO)
docker compose up -d db minio

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run start:dev        # http://localhost:4000  (Swagger: /docs)

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

### Native tools (for upload + YouTube import)
The API shells out to `ffmpeg` and `yt-dlp`. Install them or run the API inside Docker (the API image bundles both).

- **macOS:** `brew install ffmpeg yt-dlp`
- **Windows:** `winget install Gyan.FFmpeg yt-dlp.yt-dlp`
- **Linux:** `apt install ffmpeg` + `pipx install yt-dlp`

## API modules

`AuthModule` · `UserModule` · `SongModule` · `AlbumModule` · `ArtistModule` ·
`PlaylistModule` · `FavoriteModule` · `HistoryModule` · `UploadModule` ·
`SearchModule` · `AdminModule` · `DashboardModule` · `StreamingModule` · `YouTubeImportModule`

## Storage layout

```
backend/storage/
├── music/        transcoded .mp3 audio
├── covers/       song / album cover art
├── artists/      artist images
├── albums/       album art
└── playlists/    playlist art
```
The database stores **paths only** — never binary blobs.

See `docs/` for the architecture overview, DB diagram, and deployment guide (added incrementally).
