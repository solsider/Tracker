import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupRolesGuard, GroupRoles } from '../auth/guards/group-roles.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto, AddGroupMemberDto } from './groups.dto';

interface AuthRequest extends Request {
  user: Omit<User, 'password'>;
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @Req() req: AuthRequest) {
    return this.groupsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.groupsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.groupsService.findById(id, req.user.id);
  }

  // ── Member management (ADMIN only) ────────────────────────────────────────

  @Post(':id/members')
  @UseGuards(GroupRolesGuard)
  @GroupRoles('ADMIN')
  addMember(
    @Param('id') groupId: string,
    @Body() dto: AddGroupMemberDto,
    @Req() req: AuthRequest,
  ) {
    return this.groupsService.addMember(groupId, dto, req.user.id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(GroupRolesGuard)
  @GroupRoles('ADMIN')
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @Req() req: AuthRequest,
  ) {
    return this.groupsService.removeMember(groupId, userId, req.user.id);
  }

  // ── Link project to group (ADMIN only) ────────────────────────────────────

  @Post(':id/projects/:projectId')
  @UseGuards(GroupRolesGuard)
  @GroupRoles('ADMIN')
  linkProject(
    @Param('id') groupId: string,
    @Param('projectId') projectId: string,
    @Req() req: AuthRequest,
  ) {
    return this.groupsService.linkProject(groupId, projectId, req.user.id);
  }
}
