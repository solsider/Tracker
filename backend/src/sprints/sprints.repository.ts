import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SprintStatus } from '@prisma/client';

@Injectable()
export class SprintsRepository {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.sprint.findMany({
      where: { projectId },
      include: { _count: { select: { issues: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.sprint.findUnique({
      where: { id },
      include: { _count: { select: { issues: true } } },
    });
  }

  async findActive(projectId: string) {
    return this.prisma.sprint.findFirst({
      where: { projectId, status: SprintStatus.ACTIVE },
    });
  }

  async create(projectId: string, data: { name: string; goal?: string; startDate?: Date; endDate?: Date }) {
    return this.prisma.sprint.create({
      data: { ...data, projectId },
      include: { _count: { select: { issues: true } } },
    });
  }

  async update(id: string, data: Partial<{ name: string; goal: string; startDate: Date; endDate: Date; status: SprintStatus; completedAt: Date; capacity: number; velocity: number }>) {
    return this.prisma.sprint.update({
      where: { id },
      data,
      include: { _count: { select: { issues: true } } },
    });
  }

  async completeWithIssueRelease(id: string) {
    const [updated] = await this.prisma.$transaction([
      this.prisma.sprint.update({
        where: { id },
        data: { status: SprintStatus.COMPLETED, completedAt: new Date() },
        include: { _count: { select: { issues: true } } },
      }),
      this.prisma.issue.updateMany({
        where: { sprintId: id },
        data: { sprintId: null },
      }),
    ]);
    return updated;
  }

  async delete(id: string) {
    await this.prisma.sprint.delete({ where: { id } });
  }

  async getBacklog(projectId: string) {
    return this.prisma.issue.findMany({
      where: { projectId, sprintId: null, deletedAt: null },
      include: {
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        column: { select: { id: true, title: true, color: true, order: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { order: 'asc' },
      take: 300,
    });
  }
}
