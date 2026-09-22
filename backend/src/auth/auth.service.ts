import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Role } from '../common/enums';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) throw new ConflictException('Email or username already in use');

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: await bcrypt.hash(dto.password, 12),
      },
    });
    return this.issueSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash: sha(refreshToken), revokedAt: null },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    // rotate
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return this.issueSession(user);
  }

  async logout(userId: string, refreshToken?: string) {
    await this.prisma.refreshToken.updateMany({
      where: refreshToken
        ? { userId, tokenHash: sha(refreshToken) }
        : { userId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueSession(user: User) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
        expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
      },
    );
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
        expiresIn: process.env.JWT_REFRESH_TTL ?? '7d',
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: sha(refreshToken), expiresAt },
    });

    return { accessToken, refreshToken, user: this.sanitize(user) };
  }

  private verifyRefresh(token: string): Promise<{ sub: string; jti: string }> {
    return this.jwt
      .verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh token invalid');
      });
  }

  private sanitize(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
