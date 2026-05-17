import { Injectable, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateCommentDto } from './comments.dto';
import { EventsService } from '../events/events.service';

const authorSelect = {
  select: { id: true, name: true, email: true, avatar: true },
} as const;

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private projectsRepository: ProjectsRepository,
    @Optional() private eventsService?: EventsService,
  ) {}

  async findByIssue(projectId: string, issueNumber: number, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.prisma.issue.findUnique({
      where: { projectId_number: { projectId, number: issueNumber } },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    return this.prisma.comment.findMany({
      where: { issueId: issue.id },
      include: { author: authorSelect },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async create(
    projectId: string,
    issueNumber: number,
    dto: CreateCommentDto,
    authorId: string,
  ) {
    await this.assertAccess(projectId, authorId);
    const issue = await this.prisma.issue.findUnique({
      where: { projectId_number: { projectId, number: issueNumber } },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.body,
        issue: { connect: { id: issue.id } },
        author: { connect: { id: authorId } },
      },
      include: { author: authorSelect },
    });
    this.eventsService?.commentCreated(issue.projectId, issue.id, comment);
    return comment;
  }

  async update(id: string, body: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { issue: { select: { projectId: true } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.assertAccess(comment.issue.projectId, userId);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: { body },
      include: { author: authorSelect },
    });
    this.eventsService?.commentUpdated(comment.issueId, updated);
    return updated;
  }

  async delete(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { issue: { select: { projectId: true } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.assertAccess(comment.issue.projectId, userId);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can delete this comment');
    }

    await this.prisma.comment.delete({ where: { id } });
    this.eventsService?.commentDeleted(comment.issueId, id);
  }

  private async assertAccess(projectId: string, userId: string) {
    const hasAccess = await this.projectsRepository.isMember(projectId, userId);
    if (!hasAccess) throw new ForbiddenException('Access denied');
  }
}
