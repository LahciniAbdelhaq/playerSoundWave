# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
# native media tools
RUN apk add --no-cache ffmpeg python3 py3-pip \
    && pip install --break-system-packages yt-dlp
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
RUN mkdir -p storage/music storage/covers storage/artists storage/albums storage/playlists
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
