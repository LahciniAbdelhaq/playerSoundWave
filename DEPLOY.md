# Deploying SoundWave to Vercel (free Hobby plan)

The repo deploys as **two Vercel projects** from the same Git repository:

| Project | Root Directory | What it is |
|---|---|---|
| `soundwave-api` | `backend` | NestJS API as one serverless function (`api/index.js` + `vercel.json`) |
| `soundwave` | `frontend` | Next.js app. Proxies `/api/*` to the API project |

Plus two free storage add-ons, created from the Vercel dashboard (**Storage** tab):
- **Neon Postgres** (database)
- **Vercel Blob** (uploaded music and covers)

Local dev is unchanged: SQLite + files on disk (`npm run start:dev`).

---

## 1. Push the repo to GitHub

Vercel deploys from GitHub/GitLab/Bitbucket. Create an empty repository, then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin master
```

## 2. Create the API project (backend)

1. vercel.com → **Add New… → Project** → import the repo.
2. **Root Directory:** `backend`. Framework Preset: **Other** (settings come from `backend/vercel.json`).
3. Environment variables:

   | Name | Value |
   |---|---|
   | `STORAGE_DRIVER` | `blob` |
   | `JWT_ACCESS_SECRET` | a long random string |
   | `JWT_REFRESH_SECRET` | another long random string |
   | `JWT_ACCESS_TTL` | `15m` |
   | `JWT_REFRESH_TTL` | `7d` |
   | `CORS_ORIGIN` | `https://<frontend-project>.vercel.app` (fill in after step 3) |
   | `NODE_ENV` | `production` |

   Generate secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

4. **Before the first deploy succeeds** you need the database and blob store. In the project → **Storage**:
   - **Create Database → Neon (Postgres)** → connect to this project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
   - **Create → Blob** → connect to this project. This adds `BLOB_READ_WRITE_TOKEN`.
5. **Deployments → Redeploy.** The build (`npm run vercel-build`) will:
   - generate the Prisma client and create the tables (`prisma db push`)
   - seed demo data on the first deploy only (admin@soundwave.fm / password123; **change or delete this user**)
   - compile Nest and download the Linux `yt-dlp` binary
6. Check `https://<api-project>.vercel.app/api/songs` returns JSON.

## 3. Create the web project (frontend)

1. **Add New… → Project** → same repo.
2. **Root Directory:** `frontend`. Framework: Next.js (auto-detected).
3. Environment variable: `NEXT_PUBLIC_API_URL` = `https://<api-project>.vercel.app` (no trailing slash).
4. Deploy. Then put this project's URL into the API project's `CORS_ORIGIN` and redeploy the API.

The browser only talks to the frontend domain; Next.js rewrites `/api/*` to the API project, so there are no cross-site cookie issues.

---

## Free-plan limits to know

- **Upload size: 4.5 MB per file.** Vercel functions reject larger request bodies, so bigger MP3/FLAC uploads fail. (Fix later by uploading straight from the browser to Blob with `@vercel/blob/client`.)
- **YouTube import/search may be blocked.** YouTube often refuses requests from cloud IPs ("confirm you're not a bot"). Uploads still work.
- **Function time limit: 300 s**, enough for normal imports.
- **Blob: 1 GB storage** and limited transfer per month on Hobby. Neon free: 0.5 GB.
- **Hobby plan is for non-commercial use.**
- Cold starts: the first request after idle takes a few seconds while Nest boots.

## How the code switches between local and Vercel

- `prisma/schema.prisma` is the Postgres (production) schema. `npm run db:local` derives the SQLite `prisma/schema.local.prisma` (gitignored) and runs automatically before `npm run start:dev`.
- `STORAGE_DRIVER=blob` stores files in Vercel Blob and saves their public URL in the DB. Song streaming then redirects to the Blob CDN.
- ffmpeg comes from the `ffmpeg-static` package when `FFMPEG_PATH` is unset. yt-dlp comes from `backend/bin/yt-dlp` (downloaded at build) when `YTDLP_PATH` is unset.
