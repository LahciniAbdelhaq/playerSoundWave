import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';

/** Builds the configured Nest app. Shared by main.ts (local) and serverless.ts (Vercel). */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
  });

  // Behind Vercel's proxy — use X-Forwarded-For so rate limiting is per client.
  app.set('trust proxy', true);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['media/(.*)'] });

  // Serve local media (local storage driver) at /media/*. Blob URLs are absolute.
  if ((process.env.STORAGE_DRIVER ?? 'local') === 'local') {
    app.useStaticAssets(join(process.cwd(), process.env.STORAGE_ROOT ?? 'storage'), {
      prefix: '/media/',
    });
  }

  const config = new DocumentBuilder()
    .setTitle('SoundWave API')
    .setDescription('Music streaming platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  return app;
}
