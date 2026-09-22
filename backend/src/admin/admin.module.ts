import { Injectable, Module } from '@nestjs/common';
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
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../common/guards';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async users(skip = 0, take = 25) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { playlists: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total };
  }

  deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } }).then(() => ({ success: true }));
  }

  async songs(skip = 0, take = 25) {
    const [items, total] = await Promise.all([
      this.prisma.song.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { artist: { select: { name: true } } },
      }),
      this.prisma.song.count(),
    ]);
    return { items, total };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('users')
  users(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.users(Number(skip) || 0, Number(take) || 25);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  @Get('songs')
  songs(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.songs(Number(skip) || 0, Number(take) || 25);
  }
}

@Module({
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
