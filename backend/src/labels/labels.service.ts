import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { LabelsRepository } from './labels.repository';
import { ProjectsRepository } from '../projects/projects.repository';
import { IssuesRepository } from '../issues/issues.repository';
import { CreateLabelDto, UpdateLabelDto } from './labels.dto';

@Injectable()
export class LabelsService {
  constructor(
    private labelsRepository: LabelsRepository,
    private projectsRepository: ProjectsRepository,
    private issuesRepository: IssuesRepository,
  ) {}

  private async assertMember(projectId: string, userId: string) {
    const isMember = await this.projectsRepository.isMember(projectId, userId);
    if (!isMember) throw new ForbiddenException('Not a project member');
  }

  async listLabels(projectId: string, userId: string) {
    await this.assertMember(projectId, userId);
    return this.labelsRepository.findByProject(projectId);
  }

  async createLabel(projectId: string, dto: CreateLabelDto, userId: string) {
    await this.assertMember(projectId, userId);
    try {
      return await this.labelsRepository.create(projectId, dto);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Label name already exists in this project');
      throw e;
    }
  }

  async updateLabel(id: string, dto: UpdateLabelDto, userId: string) {
    const label = await this.labelsRepository.findById(id);
    if (!label) throw new NotFoundException('Label not found');
    await this.assertMember(label.projectId, userId);
    try {
      return await this.labelsRepository.update(id, dto);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Label name already exists in this project');
      throw e;
    }
  }

  async deleteLabel(id: string, userId: string) {
    const label = await this.labelsRepository.findById(id);
    if (!label) throw new NotFoundException('Label not found');
    await this.assertMember(label.projectId, userId);
    await this.labelsRepository.delete(id);
    return { success: true };
  }

  async addLabelToIssue(issueId: string, labelId: string, userId: string) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');
    await this.assertMember(issue.projectId, userId);
    const label = await this.labelsRepository.findById(labelId);
    if (!label) throw new NotFoundException('Label not found');
    if (label.projectId !== issue.projectId) throw new ForbiddenException('Label does not belong to this project');
    try {
      await this.labelsRepository.addToIssue(issueId, labelId);
    } catch (e: any) {
      if (e.code === 'P2002') return { success: true };
      throw e;
    }
    return { success: true };
  }

  async removeLabelFromIssue(issueId: string, labelId: string, userId: string) {
    const issue = await this.issuesRepository.findById(issueId);
    if (!issue) throw new NotFoundException('Issue not found');
    await this.assertMember(issue.projectId, userId);
    await this.labelsRepository.removeFromIssue(issueId, labelId);
    return { success: true };
  }
}
