import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const GROUP_ROLES_KEY = 'group_roles';
export const GroupRoles = (...roles: GroupRole[]) =>
  SetMetadata(GROUP_ROLES_KEY, roles);

const ROLE_RANK: Record<GroupRole, number> = { ADMIN: 2, TEACHER: 1, STUDENT: 0 };

@Injectable()
export class GroupRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRole[]>(
      GROUP_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    const groupId: string | undefined = req.params?.groupId ?? req.params?.id;
    if (!userId || !groupId) return false;

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    if (!member) return false;

    return requiredRoles.some((r) => ROLE_RANK[member.role] >= ROLE_RANK[r]);
  }
}
