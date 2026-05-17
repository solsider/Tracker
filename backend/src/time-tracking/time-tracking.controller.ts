import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeEntryDto, UpdateTimeEntryDto } from './time-tracking.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TimeTrackingController {
  constructor(private timeTrackingService: TimeTrackingService) {}

  @Get('issues/:issueId/time-entries')
  getTimeEntries(@Param('issueId') issueId: string, @Req() req: any) {
    return this.timeTrackingService.getTimeEntries(issueId, req.user.id);
  }

  @Post('issues/:issueId/time-entries')
  logTime(
    @Param('issueId') issueId: string,
    @Body() dto: CreateTimeEntryDto,
    @Req() req: any,
  ) {
    return this.timeTrackingService.logTime(issueId, dto, req.user.id);
  }

  @Patch('time-entries/:id')
  updateTimeEntry(@Param('id') id: string, @Body() dto: UpdateTimeEntryDto, @Req() req: any) {
    return this.timeTrackingService.updateTimeEntry(id, dto, req.user.id);
  }

  @Delete('time-entries/:id')
  deleteTimeEntry(@Param('id') id: string, @Req() req: any) {
    return this.timeTrackingService.deleteTimeEntry(id, req.user.id);
  }
}
