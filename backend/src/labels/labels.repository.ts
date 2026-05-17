import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabelsRepository {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    return this.prisma.label.findMany({
      where: { projectId },
      include: { _count: { select: { issues: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.label.findUnique({
      where: { id },
      include: { _count: { select: { issues: true } } },
    });
  }

  async create(projectId: string, data: { name: string; color?: string }) {
    return this.prisma.label.create({
      data: { projectId, name: data.name, color: data.color ?? '#6366f1' },
      include: { _count: { select: { issues: true } } },
    });
  }

  async update(id: string, data: { name?: string; color?: string }) {
    return this.prisma.label.update({
      where: { id },
      data,
      include: { _count: { select: { issues: true } } },
    });
  }

  async delete(id: string) {
    await this.prisma.label.delete({ where: { id } });
  }

  async addToIssue(issueId: string, labelId: string) {
    return this.prisma.issueLabel.create({ data: { issueId, labelId } });
  }

  async removeFromIssue(issueId: string, labelId: string) {
    await this.prisma.issueLabel.delete({
      where: { issueId_labelId: { issueId, labelId } },
    });
  }

  async findByIssue(issueId: string) {
    const rows = await this.prisma.issueLabel.findMany({
      where: { issueId },
      include: { label: true },
    });
    return rows.map((r) => r.label);
  }
}
