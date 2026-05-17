import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Prisma } from '@prisma/client';

const ownerSelect = {
  select: { id: true, name: true, email: true, avatar: true },
} as const;

@Injectable()
export class ProjectsRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        owner: ownerSelect,
        _count: { select: { issues: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: ownerSelect,
        members: { include: { user: ownerSelect } },
        _count: { select: { issues: true } },
      },
    });
  }

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  async addMember(projectId: string, userId: string, role: string) {
    return this.prisma.projectMember.create({
      data: { projectId, userId, role: role as any },
    });
  }

  async removeMember(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const [member, project] = await Promise.all([
      this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      }),
      this.prisma.project.findFirst({ where: { id: projectId, ownerId: userId } }),
    ]);
    return !!(member || project);
  }

  async getMember(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
    if (project) return { role: 'OWNER' as const };
    return this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
  }
}
