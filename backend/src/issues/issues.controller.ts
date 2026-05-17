import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, MoveIssueDto, FilterIssuesDto } from './issues.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

interface AuthRequest extends Request {
  user: Omit<User, 'password'>;
}

@Controller('projects/:projectId/issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Query() filter: FilterIssuesDto,
    @Req() req: AuthRequest,
  ) {
    return this.issuesService.findAll(projectId, req.user.id, filter);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
    @Req() req: AuthRequest,
  ) {
    return this.issuesService.create(projectId, dto, req.user.id);
  }

  @Get(':number')
  findOne(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Req() req: AuthRequest,
  ) {
    return this.issuesService.findByNumber(projectId, number, req.user.id);
  }

  @Patch(':number')
  update(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: UpdateIssueDto,
    @Req() req: AuthRequest,
  ) {
    return this.issuesService.update(projectId, number, dto, req.user.id);
  }

  @Delete(':number')
  remove(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Req() req: AuthRequest,
  ) {
    return this.issuesService.delete(projectId, number, req.user.id);
  }
}

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesColumnController {
  constructor(private issuesService: IssuesService) {}

  @Patch(':id/column')
  moveToColumn(
    @Param('id') id: string,
    @Body() dto: MoveIssueDto,
    @Req() req: AuthRequest,
  ) {
    return this.issuesService.moveToColumn(
      id,
      dto.columnId,
      req.user.id,
      dto.afterId,
      dto.beforeId,
    );
  }

  @Get(':id/watchers')
  getWatchers(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.issuesService.getWatchers(id, req.user.id);
  }

  @Post(':id/watchers')
  watchIssue(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.issuesService.watchIssue(id, req.user.id);
  }

  @Delete(':id/watchers')
  unwatchIssue(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.issuesService.unwatchIssue(id, req.user.id);
  }
}
