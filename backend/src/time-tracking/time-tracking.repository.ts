import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const userSelect = { select: { id: true, name: true, avatar: true } } as const;

@Injectable()
export class TimeTrackingRepository {
  constructor(private prisma: PrismaService) {}

  async findByIssue(issueId: string) {
    return this.prisma.timeEntry.findMany({
      where: { issueId },
      include: { user: userSelect },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.timeEntry.findUnique({
      where: { id },
      include: { user: userSelect },
    });
  }

  async create(issueId: string, userId: string, data: { minutes: number; description?: string; date?: Date }) {
    return this.prisma.timeEntry.create({
      data: {
        issueId,
        userId,
        minutes: data.minutes,
        description: data.description,
        date: data.date ?? new Date(),
      },
      include: { user: userSelect },
    });
  }

  async update(id: string, data: { minutes?: number; description?: string; date?: Date }) {
    return this.prisma.timeEntry.update({
      where: { id },
      data,
      include: { user: userSelect },
    });
  }

  async delete(id: string) {
    await this.prisma.timeEntry.delete({ where: { id } });
  }

  async sumByIssue(issueId: string): Promise<number> {
    const result = await this.prisma.timeEntry.aggregate({
      where: { issueId },
      _sum: { minutes: true },
    });
    return result._sum.minutes ?? 0;
  }
}
