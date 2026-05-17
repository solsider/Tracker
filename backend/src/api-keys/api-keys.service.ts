import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './api-keys.dto';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    const raw = `trk_${randomBytes(32).toString('hex')}`;
    const prefix = raw.slice(0, 12);
    const hash = hashKey(raw);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: dto.scopes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        user: { connect: { id: userId } },
      },
    });

    // Return full key only once
    return { ...apiKey, key: raw };
  }

  async list(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true, name: true, keyPrefix: true, scopes: true,
        expiresAt: true, lastUsedAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, userId: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');
    if (key.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async validateKey(rawKey: string) {
    const hash = hashKey(rawKey);
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash: hash } });

    if (!key || key.revokedAt) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;

    // Update lastUsedAt (fire-and-forget)
    this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => undefined);

    const user = await this.prisma.user.findUnique({
      where: { id: key.userId },
      select: { id: true, email: true, name: true, systemRole: true },
    });

    return user ? { user, scopes: key.scopes } : null;
  }
}
