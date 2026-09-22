import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import {
  AddSongDto,
  CreatePlaylistDto,
  ReorderDto,
  UpdatePlaylistDto,
} from './dto';
import { CurrentUser, Public } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

@ApiTags('playlists')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  constructor(private playlists: PlaylistsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.playlists.listForUser(userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.playlists.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePlaylistDto) {
    return this.playlists.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlists.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.playlists.remove(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/songs')
  addSong(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddSongDto,
  ) {
    return this.playlists.addSong(id, userId, dto.songId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/songs/:songId')
  removeSong(
    @Param('id') id: string,
    @Param('songId') songId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.playlists.removeSong(id, userId, songId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reorder')
  reorder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.playlists.reorder(id, userId, dto.songIds);
  }
}
