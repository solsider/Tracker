import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto } from './sprints.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Get('projects/:projectId/sprints')
  listSprints(@Param('projectId') projectId: string, @Req() req: any) {
    return this.sprintsService.listSprints(projectId, req.user.id);
  }

  @Get('projects/:projectId/backlog')
  getBacklog(@Param('projectId') projectId: string, @Req() req: any) {
    return this.sprintsService.getBacklog(projectId, req.user.id);
  }

  @Post('projects/:projectId/sprints')
  createSprint(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
    @Req() req: any,
  ) {
    return this.sprintsService.createSprint(projectId, dto, req.user.id);
  }

  @Get('sprints/:id')
  getSprint(@Param('id') id: string, @Req() req: any) {
    return this.sprintsService.getSprint(id, req.user.id);
  }

  @Patch('sprints/:id')
  updateSprint(@Param('id') id: string, @Body() dto: UpdateSprintDto, @Req() req: any) {
    return this.sprintsService.updateSprint(id, dto, req.user.id);
  }

  @Patch('sprints/:id/start')
  startSprint(@Param('id') id: string, @Req() req: any) {
    return this.sprintsService.startSprint(id, req.user.id);
  }

  @Patch('sprints/:id/complete')
  completeSprint(@Param('id') id: string, @Req() req: any) {
    return this.sprintsService.completeSprint(id, req.user.id);
  }

  @Delete('sprints/:id')
  deleteSprint(@Param('id') id: string, @Req() req: any) {
    return this.sprintsService.deleteSprint(id, req.user.id);
  }
}
