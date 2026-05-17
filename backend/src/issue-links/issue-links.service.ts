import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { IssueLinksRepository } from './issue-links.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { IssuesRepository } from '../issues/issues.repository';
import { CreateIssueLinkDto } from './issue-links.dto';

@Injectable()
export class IssueLinksService {
  constructor(
    private issueLinksRepository: IssueLinksRepository,
    private projectsRepository: ProjectsRepository,
    private issuesRepository: IssuesRepository,
  ) {}

  private async assertIssueAccess(issueId: string, userId: string) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');
    const isMember = await this.projectsRepository.isMember(issue.projectId, userId);
    if (!isMember) throw new ForbiddenException('Not a project member');
    return issue;
  }

  async getLinks(issueId: string, userId: string) {
    await this.assertIssueAccess(issueId, userId);
    return this.issueLinksRepository.findByIssue(issueId);
  }

  async createLink(sourceId: string, dto: CreateIssueLinkDto, userId: string) {
    const sourceIssue = await this.assertIssueAccess(sourceId, userId);
    const targetIssue = await this.issuesRepository.findById(dto.targetId);
    if (!targetIssue) throw new NotFoundException('Target issue not found');
    if (sourceId === dto.targetId) throw new ConflictException('Cannot link an issue to itself');

    const targetMember = await this.projectsRepository.isMember(targetIssue.projectId, userId);
    if (!targetMember) throw new ForbiddenException('No access to target issue');

    try {
      return await this.issueLinksRepository.create(sourceId, dto.targetId, dto.type);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('This link already exists');
      throw e;
    }
  }

  async deleteLink(id: string, userId: string) {
    const link = await this.issueLinksRepository.findById(id);
    if (!link) throw new NotFoundException('Link not found');
    await this.assertIssueAccess(link.sourceId, userId);
    await this.issueLinksRepository.delete(id);
    return { success: true };
  }
}
