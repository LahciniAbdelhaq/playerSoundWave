import { Injectable, Module, NotFoundException } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(24) username?: string;
  @IsOptional() @IsString() avatar?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async profile(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: { select: { playlists: true, favorites: true } },
      },
    });
    if (!u) throw new NotFoundException('User not found');
    return { ...u, avatar: this.storage.url(u.avatar) };
  }

  update(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, username: true, email: true, avatar: true, role: true },
    });
  }
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser('id') id: string) {
    return this.users.profile(id);
  }

  @Patch('me')
  update(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.users.update(id, dto);
  }
}

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
