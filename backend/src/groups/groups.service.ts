import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GroupRole } from '@prisma/client';
import { GroupsRepository } from './groups.repository';
import { CreateGroupDto, AddGroupMemberDto } from './groups.dto';

@Injectable()
export class GroupsService {
  constructor(private groupsRepository: GroupsRepository) {}

  create(dto: CreateGroupDto, userId: string) {
    return this.groupsRepository.create(dto.name, dto.description, userId);
  }

  async findById(id: string, userId: string) {
    const group = await this.groupsRepository.findById(id);
    if (!group) throw new NotFoundException('Group not found');
    await this.assertMember(id, userId);
    return group;
  }

  findAllForUser(userId: string) {
    return this.groupsRepository.findAllForUser(userId);
  }

  async addMember(groupId: string, dto: AddGroupMemberDto, requesterId: string) {
    await this.assertRole(groupId, requesterId, GroupRole.ADMIN);
    return this.groupsRepository.addMember(
      groupId,
      dto.userId,
      dto.role ?? GroupRole.STUDENT,
    );
  }

  async removeMember(groupId: string, targetUserId: string, requesterId: string) {
    await this.assertRole(groupId, requesterId, GroupRole.ADMIN);
    return this.groupsRepository.removeMember(groupId, targetUserId);
  }

  async linkProject(groupId: string, projectId: string, requesterId: string) {
    await this.assertRole(groupId, requesterId, GroupRole.ADMIN);
    return this.groupsRepository.linkProject(groupId, projectId);
  }

  private async assertMember(groupId: string, userId: string) {
    const member = await this.groupsRepository.getMember(groupId, userId);
    if (!member) throw new ForbiddenException('Not a member of this group');
  }

  private async assertRole(
    groupId: string,
    userId: string,
    minRole: GroupRole,
  ) {
    const member = await this.groupsRepository.getMember(groupId, userId);
    if (!member) throw new ForbiddenException('Not a member of this group');

    const rank: Record<GroupRole, number> = { ADMIN: 2, TEACHER: 1, STUDENT: 0 };
    if (rank[member.role] < rank[minRole]) {
      throw new ForbiddenException('Insufficient group role');
    }
  }
}
