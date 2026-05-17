import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './columns.dto';

@Injectable()
export class ColumnsService {
  constructor(
    private columnsRepository: ColumnsRepository,
    private projectsRepository: ProjectsRepository,
  ) {}

  async findAll(projectId: string, userId: string) {
    await this.assertAccess(projectId, userId);
    return this.columnsRepository.findAll(projectId);
  }

  async create(projectId: string, dto: CreateColumnDto, userId: string) {
    await this.assertAccess(projectId, userId);
    const order = await this.columnsRepository.getMaxOrder(projectId);
    return this.columnsRepository.create({
      title: dto.title,
      color: dto.color ?? '#6366f1',
      order,
      project: { connect: { id: projectId } },
    });
  }

  async update(id: string, dto: UpdateColumnDto, userId: string) {
    const column = await this.columnsRepository.findById(id);
    if (!column) throw new NotFoundException('Column not found');
    await this.assertAccess(column.projectId, userId);
    return this.columnsRepository.update(id, dto);
  }

  async delete(id: string, userId: string) {
    const column = await this.columnsRepository.findById(id);
    if (!column) throw new NotFoundException('Column not found');
    await this.assertAccess(column.projectId, userId);

    const fallback = await this.columnsRepository.findFirstInProject(column.projectId, id);
    if (!fallback) {
      throw new BadRequestException('Cannot delete the only column in a project');
    }

    await this.columnsRepository.moveIssuesToColumn(id, fallback.id);
    await this.columnsRepository.delete(id);
  }

  async reorder(projectId: string, dto: ReorderColumnsDto, userId: string) {
    await this.assertAccess(projectId, userId);
    await this.columnsRepository.reorder(dto.orders);
  }

  private async assertAccess(projectId: string, userId: string) {
    const hasAccess = await this.projectsRepository.isMember(projectId, userId);
    if (!hasAccess) throw new ForbiddenException('Access denied');
  }
}
