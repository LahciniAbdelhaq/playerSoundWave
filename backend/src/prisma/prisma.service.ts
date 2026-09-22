import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(PrismaService.name);

  async onModuleInit() {
    // Don't crash the whole API if the DB is unreachable at boot — endpoints
    // that don't touch the DB (e.g. YouTube search) still work. DB-backed
    // routes will surface a clear error until the database is available.
    try {
      await this.$connect();
    } catch (err) {
      this.log.error(
        `Database connection failed at startup: ${(err as Error).message}. ` +
          'DB-backed endpoints will be unavailable until Postgres is reachable.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
