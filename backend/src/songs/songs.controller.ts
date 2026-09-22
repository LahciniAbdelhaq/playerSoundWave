import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums';
import { SongsService } from './songs.service';
import { Public, Roles } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../common/guards';

@ApiTags('songs')
@Controller('songs')
export class SongsController {
  constructor(private songs: SongsService) {}

  @Public()
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('sort') sort?: 'trending' | 'latest' | 'top',
  ) {
    return this.songs.findAll({ skip: Number(skip), take: Number(take), sort });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songs.findOne(id);
  }

  @Public()
  @Get(':id/lyrics')
  lyrics(@Param('id') id: string) {
    return this.songs.getLyrics(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.songs.remove(id);
  }
}
