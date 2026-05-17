import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsRepository {
  constructor(private prisma: PrismaService) {}

  async findByIssue(issueId: string) {
    return this.prisma.checklist.findMany({
      where: { issueId },
      include: {
        items: {
          include: { assignee: { select: { id: true, name: true, avatar: true } } },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.checklist.findUnique({
      where: { id },
      include: {
        items: {
          include: { assignee: { select: { id: true, name: true, avatar: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async createChecklist(issueId: string, data: { title: string; order?: number }) {
    return this.prisma.checklist.create({
      data: { issueId, title: data.title, order: data.order ?? 0 },
      include: { items: true },
    });
  }

  async updateChecklist(id: string, data: { title?: string; order?: number }) {
    return this.prisma.checklist.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async deleteChecklist(id: string) {
    await this.prisma.checklist.delete({ where: { id } });
  }

  async findItemById(id: string) {
    return this.prisma.checklistItem.findUnique({
      where: { id },
      include: { checklist: true },
    });
  }

  async createItem(checklistId: string, data: { title: string; order?: number; assigneeId?: string }) {
    return this.prisma.checklistItem.create({
      data: { checklistId, title: data.title, order: data.order ?? 0, assigneeId: data.assigneeId },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async updateItem(id: string, data: { title?: string; isCompleted?: boolean; order?: number; assigneeId?: string | null }) {
    const updateData: any = { ...data };
    if (data.isCompleted === true) updateData.completedAt = new Date();
    if (data.isCompleted === false) updateData.completedAt = null;
    return this.prisma.checklistItem.update({
      where: { id },
      data: updateData,
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async deleteItem(id: string) {
    await this.prisma.checklistItem.delete({ where: { id } });
  }
}
