import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { Public } from '../common/decorators';

@ApiTags('albums')
@Controller('albums')
export class AlbumsController {
  constructor(private albums: AlbumsService) {}

  @Public()
  @Get()
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.albums.findAll({ skip: Number(skip), take: Number(take) });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.albums.findOne(id);
  }
}
