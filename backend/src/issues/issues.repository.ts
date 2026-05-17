import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, IssuePriority, IssueType } from '@prisma/client';

export interface IssueFilter {
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string;
  sprintId?: string;
  noSprint?: boolean;
  labelId?: string;
  deleted?: boolean;
  search?: string;
}

const issueInclude = {
  reporter: { select: { id: true, name: true, email: true, avatar: true } },
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  column: { select: { id: true, title: true, color: true, order: true } },
  _count: { select: { comments: true } },
} as const;

@Injectable()
export class IssuesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, filter: IssueFilter = {}) {
    const where: Prisma.IssueWhereInput = {
      projectId,
      deletedAt: filter.deleted ? { not: null } : null,
    };

    if (filter.priority) where.priority = filter.priority;
    if (filter.type) where.type = filter.type;
    if (filter.assigneeId) where.assigneeId = filter.assigneeId;
    if (filter.sprintId) where.sprintId = filter.sprintId;
    if (filter.noSprint) where.sprintId = null;
    if (filter.labelId) where.labels = { some: { labelId: filter.labelId } };
    if (filter.search) where.title = { contains: filter.search, mode: 'insensitive' };

    return this.prisma.issue.findMany({
      where,
      include: issueInclude,
      orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
      take: 500, // production safety cap — prevents OOM on huge projects
    });
  }

  async addWatcher(issueId: string, userId: string) {
    return this.prisma.issueWatcher.upsert({
      where: { issueId_userId: { issueId, userId } },
      update: {},
      create: { issueId, userId },
    });
  }

  async removeWatcher(issueId: string, userId: string) {
    await this.prisma.issueWatcher.delete({
      where: { issueId_userId: { issueId, userId } },
    });
  }

  async getWatchers(issueId: string) {
    return this.prisma.issueWatcher.findMany({
      where: { issueId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
  }

  async findByNumber(projectId: string, number: number) {
    return this.prisma.issue.findUnique({
      where: { projectId_number: { projectId, number } },
      include: {
        ...issueInclude,
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.issue.findUnique({
      where: { id },
      include: issueInclude,
    });
  }

  async findColumnById(id: string) {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async getNextNumber(projectId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.issue.findFirst({
        where: { projectId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      return (last?.number ?? 0) + 1;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Returns the fractional order value to insert between the issue identified
   * by afterId (the item the new issue goes after) and beforeId (the item it
   * goes before). Either or both may be omitted:
   *   - no ids → append at end of column
   *   - afterId only → insert just after that item
   *   - beforeId only → insert just before that item
   *   - both → insert between them
   */
  async computeOrderBetween(
    columnId: string,
    afterId?: string,
    beforeId?: string,
  ): Promise<number> {
    if (!afterId && !beforeId) {
      const last = await this.prisma.issue.findFirst({
        where: { columnId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      return (last?.order ?? 0) + 1.0;
    }

    const [afterIssue, beforeIssue] = await Promise.all([
      afterId
        ? this.prisma.issue.findUnique({ where: { id: afterId }, select: { order: true } })
        : Promise.resolve(null),
      beforeId
        ? this.prisma.issue.findUnique({ where: { id: beforeId }, select: { order: true } })
        : Promise.resolve(null),
    ]);

    const a = afterIssue?.order;
    const b = beforeIssue?.order;

    if (a !== undefined && b !== undefined) return (a + b) / 2;
    if (a !== undefined) return a + 1.0;
    if (b !== undefined) return b - 0.5;
    return 1.0;
  }

  async create(data: Prisma.IssueCreateInput) {
    return this.prisma.issue.create({ data, include: issueInclude });
  }

  async createIssue(
    projectId: string,
    data: Omit<Prisma.IssueCreateInput, 'number'>,
  ) {
    while (true) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const last = await tx.issue.findFirst({
            where: { projectId },
            orderBy: { number: 'desc' },
            select: { number: true },
          });
          const number = (last?.number ?? 0) + 1;
          return tx.issue.create({
            data: { ...(data as Prisma.IssueCreateInput), number },
            include: issueInclude,
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (e: any) {
        if (e?.code === 'P2034') continue;
        throw e;
      }
    }
  }

  async update(projectId: string, number: number, data: Prisma.IssueUpdateInput) {
    return this.prisma.issue.update({
      where: { projectId_number: { projectId, number } },
      data,
      include: issueInclude,
    });
  }

  async updateById(id: string, data: Prisma.IssueUpdateInput) {
    return this.prisma.issue.update({
      where: { id },
      data,
      include: issueInclude,
    });
  }

  async delete(projectId: string, number: number): Promise<void> {
    await this.prisma.issue.delete({
      where: { projectId_number: { projectId, number } },
    });
  }
}
