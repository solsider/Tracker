import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityAction } from '@prisma/client';

export interface CreateActivityParams {
  userId: string;
  action: ActivityAction;
  issueId?: string;
  projectId?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

const actorSelect = {
  select: { id: true, name: true, email: true, avatar: true },
} as const;

@Injectable()
export class ActivityRepository {
  constructor(private prisma: PrismaService) {}

  async create(params: CreateActivityParams) {
    return this.prisma.activityLog.create({
      data: {
        action: params.action,
        field: params.field,
        oldValue: params.oldValue,
        newValue: params.newValue,
        metadata: params.metadata as any,
        userId: params.userId,
        issueId: params.issueId,
        projectId: params.projectId,
      },
      include: { user: actorSelect },
    });
  }

  async findByIssue(issueId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { issueId },
      include: { user: actorSelect },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByProject(projectId: string, limit = 100) {
    return this.prisma.activityLog.findMany({
      where: { projectId },
      include: { user: actorSelect },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
