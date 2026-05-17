import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChecklistsRepository } from './checklists.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { IssuesRepository } from '../issues/issues.repository';
import { CreateChecklistDto, UpdateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './checklists.dto';

@Injectable()
export class ChecklistsService {
  constructor(
    private checklistsRepository: ChecklistsRepository,
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

  async getChecklists(issueId: string, userId: string) {
    await this.assertIssueAccess(issueId, userId);
    return this.checklistsRepository.findByIssue(issueId);
  }

  async createChecklist(issueId: string, dto: CreateChecklistDto, userId: string) {
    await this.assertIssueAccess(issueId, userId);
    return this.checklistsRepository.createChecklist(issueId, dto);
  }

  async updateChecklist(id: string, dto: UpdateChecklistDto, userId: string) {
    const checklist = await this.checklistsRepository.findById(id);
    if (!checklist) throw new NotFoundException('Checklist not found');
    await this.assertIssueAccess(checklist.issueId, userId);
    return this.checklistsRepository.updateChecklist(id, dto);
  }

  async deleteChecklist(id: string, userId: string) {
    const checklist = await this.checklistsRepository.findById(id);
    if (!checklist) throw new NotFoundException('Checklist not found');
    await this.assertIssueAccess(checklist.issueId, userId);
    await this.checklistsRepository.deleteChecklist(id);
    return { success: true };
  }

  async createItem(checklistId: string, dto: CreateChecklistItemDto, userId: string) {
    const checklist = await this.checklistsRepository.findById(checklistId);
    if (!checklist) throw new NotFoundException('Checklist not found');
    await this.assertIssueAccess(checklist.issueId, userId);
    return this.checklistsRepository.createItem(checklistId, dto);
  }

  async updateItem(itemId: string, dto: UpdateChecklistItemDto, userId: string) {
    const item = await this.checklistsRepository.findItemById(itemId);
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.assertIssueAccess(item.checklist.issueId, userId);
    return this.checklistsRepository.updateItem(itemId, {
      ...dto,
      assigneeId: dto.assigneeId === '' ? null : dto.assigneeId,
    });
  }

  async deleteItem(itemId: string, userId: string) {
    const item = await this.checklistsRepository.findItemById(itemId);
    if (!item) throw new NotFoundException('Checklist item not found');
    await this.assertIssueAccess(item.checklist.issueId, userId);
    await this.checklistsRepository.deleteItem(itemId);
    return { success: true };
  }
}
