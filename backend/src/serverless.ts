import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from './app.factory';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// Boot Nest once per function instance and reuse it across invocations.
let handler: Promise<Handler> | undefined;

async function boot(): Promise<Handler> {
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  handler ??= boot().catch((err) => {
    handler = undefined; // retry boot on the next request
    throw err;
  });
  (await handler)(req, res);
}
