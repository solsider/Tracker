import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  actorId?: string;
  issueId?: string;
  projectId?: string;
}

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(params: CreateNotificationParams) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        actorId: params.actorId,
        issueId: params.issueId,
        projectId: params.projectId,
      },
    });
  }

  async createMany(params: CreateNotificationParams[]): Promise<void> {
    if (params.length === 0) return;
    await this.prisma.notification.createMany({
      data: params.map((p) => ({
        userId: p.userId,
        type: p.type,
        title: p.title,
        body: p.body,
        actorId: p.actorId,
        issueId: p.issueId,
        projectId: p.projectId,
      })),
      skipDuplicates: true,
    });
  }

  async findByUser(userId: string, unreadOnly = false, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      include: {
        actor: { select: { id: true, name: true, avatar: true } },
        issue: { select: { id: true, number: true, title: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
