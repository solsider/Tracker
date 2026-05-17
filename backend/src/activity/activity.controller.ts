import { Controller, Get, Param, Query, Req, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('issues/:issueId/activity')
  getIssueActivity(
    @Param('issueId') issueId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Req() req: any,
  ) {
    return this.activityService.getIssueActivity(issueId, req.user.id, limit);
  }

  @Get('projects/:projectId/activity')
  getProjectActivity(
    @Param('projectId') projectId: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Req() req: any,
  ) {
    return this.activityService.getProjectActivity(projectId, req.user.id, limit);
  }
}
