import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { SprintsRepository } from './sprints.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateSprintDto, UpdateSprintDto } from './sprints.dto';
import { SprintStatus } from '@prisma/client';
import { EventsService } from '../events/events.service';

@Injectable()
export class SprintsService {
  constructor(
    private sprintsRepository: SprintsRepository,
    private projectsRepository: ProjectsRepository,
    @Optional() private eventsService?: EventsService,
  ) {}

  private async assertMember(projectId: string, userId: string) {
    const isMember = await this.projectsRepository.isMember(projectId, userId);
    if (!isMember) throw new ForbiddenException('Not a project member');
  }

  async listSprints(projectId: string, userId: string) {
    await this.assertMember(projectId, userId);
    return this.sprintsRepository.findByProject(projectId);
  }

  async getSprint(id: string, userId: string) {
    const sprint = await this.sprintsRepository.findById(id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    await this.assertMember(sprint.projectId, userId);
    return sprint;
  }

  async createSprint(projectId: string, dto: CreateSprintDto, userId: string) {
    await this.assertMember(projectId, userId);
    const sprint = await this.sprintsRepository.create(projectId, {
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
    this.eventsService?.sprintCreated(projectId, sprint);
    return sprint;
  }

  async updateSprint(id: string, dto: UpdateSprintDto, userId: string) {
    const sprint = await this.sprintsRepository.findById(id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed sprint');
    }

    const updated = await this.sprintsRepository.update(id, {
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
    this.eventsService?.sprintUpdated(sprint.projectId, updated);
    return updated;
  }

  async startSprint(id: string, userId: string) {
    const sprint = await this.sprintsRepository.findById(id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status !== SprintStatus.PLANNING) {
      throw new BadRequestException('Only PLANNING sprints can be started');
    }

    const active = await this.sprintsRepository.findActive(sprint.projectId);
    if (active) throw new BadRequestException('Another sprint is already active');

    const updated = await this.sprintsRepository.update(id, {
      status: SprintStatus.ACTIVE,
      startDate: sprint.startDate ?? new Date(),
    });
    this.eventsService?.sprintUpdated(sprint.projectId, updated);
    return updated;
  }

  async completeSprint(id: string, userId: string) {
    const sprint = await this.sprintsRepository.findById(id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE sprints can be completed');
    }

    const updated = await this.sprintsRepository.completeWithIssueRelease(id);
    this.eventsService?.sprintUpdated(sprint.projectId, updated);
    return updated;
  }

  async deleteSprint(id: string, userId: string) {
    const sprint = await this.sprintsRepository.findById(id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status === SprintStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active sprint');
    }

    await this.sprintsRepository.delete(id);
    this.eventsService?.sprintDeleted(sprint.projectId, id);
    return { success: true };
  }

  async getBacklog(projectId: string, userId: string) {
    await this.assertMember(projectId, userId);
    return this.sprintsRepository.getBacklog(projectId);
  }
}
