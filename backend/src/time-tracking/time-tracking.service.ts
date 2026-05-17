import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TimeTrackingRepository } from './time-tracking.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { IssuesRepository } from '../issues/issues.repository';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './time-tracking.dto';

@Injectable()
export class TimeTrackingService {
  constructor(
    private timeTrackingRepository: TimeTrackingRepository,
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

  async getTimeEntries(issueId: string, userId: string) {
    await this.assertIssueAccess(issueId, userId);
    const [entries, totalMinutes] = await Promise.all([
      this.timeTrackingRepository.findByIssue(issueId),
      this.timeTrackingRepository.sumByIssue(issueId),
    ]);
    return { entries, totalMinutes };
  }

  async logTime(issueId: string, dto: CreateTimeEntryDto, userId: string) {
    await this.assertIssueAccess(issueId, userId);
    return this.timeTrackingRepository.create(issueId, userId, {
      minutes: dto.minutes,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  async updateTimeEntry(id: string, dto: UpdateTimeEntryDto, userId: string) {
    const entry = await this.timeTrackingRepository.findById(id);
    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.userId !== userId) throw new ForbiddenException('You can only edit your own time entries');
    return this.timeTrackingRepository.update(id, {
      minutes: dto.minutes,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  async deleteTimeEntry(id: string, userId: string) {
    const entry = await this.timeTrackingRepository.findById(id);
    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.userId !== userId) throw new ForbiddenException('You can only delete your own time entries');
    await this.timeTrackingRepository.delete(id);
    return { success: true };
  }
}
