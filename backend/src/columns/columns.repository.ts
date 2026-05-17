import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ColumnsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.column.findMany({
      where: { projectId },
      include: { _count: { select: { issues: true } } },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async findFirstInProject(projectId: string, excludeId: string) {
    return this.prisma.column.findFirst({
      where: { projectId, id: { not: excludeId } },
      orderBy: { order: 'asc' },
    });
  }

  async getMaxOrder(projectId: string): Promise<number> {
    const last = await this.prisma.column.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  async create(data: Prisma.ColumnCreateInput) {
    return this.prisma.column.create({ data });
  }

  async findOrCreateBacklog(projectId: string): Promise<string> {
    while (true) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const first = await tx.column.findFirst({
            where: { projectId },
            orderBy: { order: 'asc' },
            select: { id: true },
          });
          if (first) return first.id;

          const backlog = await tx.column.create({
            data: { title: 'Backlog', color: '#6366f1', order: 0, project: { connect: { id: projectId } } },
            select: { id: true },
          });
          return backlog.id;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (e: any) {
        if (e?.code === 'P2034') continue;
        throw e;
      }
    }
  }

  async update(id: string, data: Prisma.ColumnUpdateInput) {
    return this.prisma.column.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.column.delete({ where: { id } });
  }

  async moveIssuesToColumn(fromColumnId: string, toColumnId: string): Promise<void> {
    await this.prisma.issue.updateMany({
      where: { columnId: fromColumnId },
      data: { columnId: toColumnId },
    });
  }

  async reorder(orders: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      orders.map(({ id, order }) =>
        this.prisma.column.update({ where: { id }, data: { order } }),
      ),
    );
  }
}
