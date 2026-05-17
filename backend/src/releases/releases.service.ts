import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateReleaseDto, UpdateReleaseDto } from './releases.dto';
import { ReleaseStatus } from '@prisma/client';

const issueSelect = {
  select: { id: true, number: true, title: true, type: true, priority: true, columnId: true },
} as const;

@Injectable()
export class ReleasesService {
  constructor(
    private prisma: PrismaService,
    private projectsRepository: ProjectsRepository,
  ) {}

  async list(projectId: string, userId: string) {
    await this.assertAccess(projectId, userId);
    return this.prisma.release.findMany({
      where: { projectId },
      include: { _count: { select: { issues: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const release = await this.prisma.release.findUnique({
      where: { id },
      include: { issues: { include: { issue: issueSelect } } },
    });
    if (!release) throw new NotFoundException('Release not found');
    await this.assertAccess(release.projectId, userId);
    return release;
  }

  async create(projectId: string, dto: CreateReleaseDto, userId: string) {
    await this.assertAccess(projectId, userId);
    const release = await this.prisma.release.create({
      data: {
        version: dto.version,
        name: dto.name,
        description: dto.description,
        status: dto.status ?? ReleaseStatus.DRAFT,
        releasedAt: dto.releasedAt ? new Date(dto.releasedAt) : undefined,
        project: { connect: { id: projectId } },
        issues: dto.issueIds?.length
          ? { create: dto.issueIds.map((issueId) => ({ issueId })) }
          : undefined,
      },
      include: { _count: { select: { issues: true } } },
    });
    return release;
  }

  async update(id: string, dto: UpdateReleaseDto, userId: string) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException('Release not found');
    await this.assertAccess(release.projectId, userId);
    return this.prisma.release.update({
      where: { id },
      data: {
        version: dto.version,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        releasedAt: dto.releasedAt ? new Date(dto.releasedAt) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException('Release not found');
    await this.assertAccess(release.projectId, userId);
    await this.prisma.release.delete({ where: { id } });
    return { success: true };
  }

  async addIssue(id: string, issueId: string, userId: string) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException('Release not found');
    await this.assertAccess(release.projectId, userId);
    await this.prisma.releaseIssue.upsert({
      where: { releaseId_issueId: { releaseId: id, issueId } },
      create: { releaseId: id, issueId },
      update: {},
    });
    return { success: true };
  }

  async removeIssue(id: string, issueId: string, userId: string) {
    const release = await this.prisma.release.findUnique({ where: { id } });
    if (!release) throw new NotFoundException('Release not found');
    await this.assertAccess(release.projectId, userId);
    await this.prisma.releaseIssue.deleteMany({ where: { releaseId: id, issueId } });
    return { success: true };
  }

  private async assertAccess(projectId: string, userId: string) {
    const ok = await this.projectsRepository.isMember(projectId, userId);
    if (!ok) throw new ForbiddenException('Access denied');
  }
}
