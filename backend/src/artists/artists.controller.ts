import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { Public } from '../common/decorators';

@ApiTags('artists')
@Controller('artists')
export class ArtistsController {
  constructor(private artists: ArtistsService) {}

  @Public()
  @Get()
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.artists.findAll({ skip: Number(skip), take: Number(take) });
  }

  @Public()
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.artists.findOne(idOrSlug);
  }
}
