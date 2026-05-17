import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReleasesService } from './releases.service';
import { CreateReleaseDto, UpdateReleaseDto } from './releases.dto';

@Controller('projects/:projectId/releases')
@UseGuards(JwtAuthGuard)
export class ReleasesController {
  constructor(private releasesService: ReleasesService) {}

  @Get()
  list(@Param('projectId') projectId: string, @Request() req: any) {
    return this.releasesService.list(projectId, req.user.id);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateReleaseDto,
    @Request() req: any,
  ) {
    return this.releasesService.create(projectId, dto, req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @Request() req: any) {
    return this.releasesService.getById(id, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReleaseDto, @Request() req: any) {
    return this.releasesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.releasesService.delete(id, req.user.id);
  }

  @Post(':id/issues/:issueId')
  addIssue(@Param('id') id: string, @Param('issueId') issueId: string, @Request() req: any) {
    return this.releasesService.addIssue(id, issueId, req.user.id);
  }

  @Delete(':id/issues/:issueId')
  removeIssue(@Param('id') id: string, @Param('issueId') issueId: string, @Request() req: any) {
    return this.releasesService.removeIssue(id, issueId, req.user.id);
  }
}
