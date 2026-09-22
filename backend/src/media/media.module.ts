import { Global, Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { IngestService } from './ingest.service';

@Global()
@Module({
  providers: [MediaService, IngestService],
  exports: [MediaService, IngestService],
})
export class MediaModule {}
