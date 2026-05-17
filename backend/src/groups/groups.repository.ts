import { Injectable } from '@nestjs/common';
import { GroupRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsRepository {
  constructor(private prisma: PrismaService) {}

  async create(name: string, description: string | undefined, ownerId: string) {
    return this.prisma.group.create({
      data: {
        name,
        description,
        members: { create: { userId: ownerId, role: GroupRole.ADMIN } },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
  }

  async findById(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        projects: { select: { id: true, name: true, description: true } },
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true, projects: true } } },
    });
  }

  async addMember(groupId: string, userId: string, role: GroupRole) {
    return this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, role },
      update: { role },
    });
  }

  async removeMember(groupId: string, userId: string) {
    return this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async linkProject(groupId: string, projectId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { groupId },
    });
  }

  async getMember(groupId: string, userId: string) {
    return this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  }
}
