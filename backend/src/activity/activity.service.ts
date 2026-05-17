import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivityRepository, CreateActivityParams } from './activity.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(
    private activityRepository: ActivityRepository,
    private prisma: PrismaService,
  ) {}

  async log(params: CreateActivityParams): Promise<void> {
    await this.activityRepository.create(params);
  }

  async getIssueActivity(issueId: string, userId: string, limit?: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    await this._assertMember(issue.projectId, userId);
    return this.activityRepository.findByIssue(issueId, limit);
  }

  async getProjectActivity(projectId: string, userId: string, limit?: number) {
    await this._assertMember(projectId, userId);
    return this.activityRepository.findByProject(projectId, limit);
  }

  private async _assertMember(projectId: string, userId: string): Promise<void> {
    const [member, owned] = await Promise.all([
      this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { id: true },
      }),
      this.prisma.project.findFirst({
        where: { id: projectId, ownerId: userId },
        select: { id: true },
      }),
    ]);
    if (!member && !owned) throw new ForbiddenException('Access denied');
  }
}
