import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [SongsModule],
  controllers: [StreamingController],
})
export class StreamingModule {}
