import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private projectsRepository: ProjectsRepository) {}

  findAll(userId: string) {
    return this.projectsRepository.findAll(userId);
  }

  async findById(id: string, userId: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project) throw new NotFoundException('Project not found');

    const hasAccess = await this.projectsRepository.isMember(id, userId);
    if (!hasAccess) throw new ForbiddenException('Access denied');

    return project;
  }

  async create(dto: CreateProjectDto, ownerId: string) {
    return this.projectsRepository.create({
      name: dto.name,
      description: dto.description,
      owner: { connect: { id: ownerId } },
      members: { create: { userId: ownerId, role: 'OWNER' } },
    });
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.assertOwner(id, userId);
    return this.projectsRepository.update(id, dto);
  }

  async delete(id: string, userId: string) {
    await this.assertOwner(id, userId);
    return this.projectsRepository.delete(id);
  }

  async addMember(
    projectId: string,
    targetUserId: string,
    role: string,
    requesterId: string,
  ) {
    await this.assertOwner(projectId, requesterId);
    return this.projectsRepository.addMember(projectId, targetUserId, role);
  }

  async removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string,
  ) {
    await this.assertOwner(projectId, requesterId);
    return this.projectsRepository.removeMember(projectId, targetUserId);
  }

  private async assertOwner(projectId: string, userId: string) {
    const project = await this.projectsRepository.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can perform this action',
      );
    }
  }
}
