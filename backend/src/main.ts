import { createApp } from './app.factory';

async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`SoundWave API → http://localhost:${port}  (Swagger: /docs)`);
}
bootstrap();
