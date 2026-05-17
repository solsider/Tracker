import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { IssuesRepository } from './issues.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { ColumnsRepository } from '../columns/columns.repository';
import { CreateIssueDto, UpdateIssueDto, FilterIssuesDto } from './issues.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class IssuesService {
  constructor(
    private issuesRepository: IssuesRepository,
    private projectsRepository: ProjectsRepository,
    private columnsRepository: ColumnsRepository,
    @Optional() private eventsService?: EventsService,
  ) {}

  async findAll(projectId: string, userId: string, filter: FilterIssuesDto = {}) {
    await this.assertAccess(projectId, userId);
    return this.issuesRepository.findAll(projectId, filter);
  }

  async findByNumber(projectId: string, number: number, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.issuesRepository.findByNumber(projectId, number);
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async create(projectId: string, dto: CreateIssueDto, reporterId: string) {
    await this.assertAccess(projectId, reporterId);

    const columnId = await this.resolveColumnId(projectId, dto.columnId);
    const order = await this.issuesRepository.computeOrderBetween(columnId);

    const issue = await this.issuesRepository.createIssue(projectId, {
      order,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      type: dto.type,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      project: { connect: { id: projectId } },
      reporter: { connect: { id: reporterId } },
      column: { connect: { id: columnId } },
      ...(dto.assigneeId
        ? { assignee: { connect: { id: dto.assigneeId } } }
        : {}),
    });
    this.eventsService?.issueCreated(projectId, issue);
    return issue;
  }

  async update(
    projectId: string,
    number: number,
    dto: UpdateIssueDto,
    userId: string,
  ) {
    await this.assertAccess(projectId, userId);
    const issue = await this.issuesRepository.findByNumber(projectId, number);
    if (!issue) throw new NotFoundException('Issue not found');

    const { assigneeId, dueDate, startDate, sprintId, parentId, ...rest } = dto;
    const updated = await this.issuesRepository.update(projectId, number, {
      ...rest,
      ...(startDate !== undefined
        ? { startDate: startDate ? new Date(startDate) : null }
        : {}),
      ...(dueDate !== undefined
        ? { dueDate: dueDate ? new Date(dueDate) : null }
        : {}),
      ...(assigneeId !== undefined
        ? assigneeId
          ? { assignee: { connect: { id: assigneeId } } }
          : { assignee: { disconnect: true } }
        : {}),
      ...(sprintId !== undefined
        ? sprintId
          ? { sprint: { connect: { id: sprintId } } }
          : { sprint: { disconnect: true } }
        : {}),
      ...(parentId !== undefined
        ? parentId
          ? { parent: { connect: { id: parentId } } }
          : { parent: { disconnect: true } }
        : {}),
    });
    this.eventsService?.issueUpdated(projectId, updated);
    return updated;
  }

  async watchIssue(issueId: string, userId: string) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');
    await this.assertAccess(issue.projectId, userId);
    await this.issuesRepository.addWatcher(issueId, userId);
    return { success: true };
  }

  async unwatchIssue(issueId: string, userId: string) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');
    await this.assertAccess(issue.projectId, userId);
    await this.issuesRepository.removeWatcher(issueId, userId);
    return { success: true };
  }

  async getWatchers(issueId: string, userId: string) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');
    await this.assertAccess(issue.projectId, userId);
    return this.issuesRepository.getWatchers(issueId);
  }

  async delete(projectId: string, number: number, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.issuesRepository.findByNumber(projectId, number);
    if (!issue) throw new NotFoundException('Issue not found');
    const result = await this.issuesRepository.delete(projectId, number);
    this.eventsService?.issueDeleted(projectId, issue.id, number);
    return result;
  }

  async moveToColumn(
    issueId: string,
    columnId: string,
    userId: string,
    afterId?: string,
    beforeId?: string,
  ) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');

    const hasAccess = await this.projectsRepository.isMember(issue.projectId, userId);
    if (!hasAccess) throw new ForbiddenException('Access denied');

    const column = await this.issuesRepository.findColumnById(columnId);
    if (!column || column.projectId !== issue.projectId) {
      throw new BadRequestException('Column does not belong to this project');
    }

    const order = await this.issuesRepository.computeOrderBetween(columnId, afterId, beforeId);

    const moved = await this.issuesRepository.updateById(issueId, {
      column: { connect: { id: columnId } },
      order,
    });
    this.eventsService?.issueMoved(issue.projectId, moved);
    return moved;
  }

  private async resolveColumnId(projectId: string, columnId?: string): Promise<string> {
    if (columnId) {
      const column = await this.issuesRepository.findColumnById(columnId);
      if (!column || column.projectId !== projectId) {
        throw new BadRequestException('Column does not belong to this project');
      }
      return columnId;
    }
    return this.columnsRepository.findOrCreateBacklog(projectId);
  }

  private async assertAccess(projectId: string, userId: string) {
    const hasAccess = await this.projectsRepository.isMember(projectId, userId);
    if (!hasAccess) throw new ForbiddenException('Access denied');
  }
}
