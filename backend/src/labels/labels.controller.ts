import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LabelsService } from './labels.service';
import { CreateLabelDto, UpdateLabelDto } from './labels.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @Get('projects/:projectId/labels')
  listLabels(@Param('projectId') projectId: string, @Req() req: any) {
    return this.labelsService.listLabels(projectId, req.user.id);
  }

  @Post('projects/:projectId/labels')
  createLabel(
    @Param('projectId') projectId: string,
    @Body() dto: CreateLabelDto,
    @Req() req: any,
  ) {
    return this.labelsService.createLabel(projectId, dto, req.user.id);
  }

  @Patch('labels/:id')
  updateLabel(@Param('id') id: string, @Body() dto: UpdateLabelDto, @Req() req: any) {
    return this.labelsService.updateLabel(id, dto, req.user.id);
  }

  @Delete('labels/:id')
  deleteLabel(@Param('id') id: string, @Req() req: any) {
    return this.labelsService.deleteLabel(id, req.user.id);
  }

  @Post('issues/:issueId/labels/:labelId')
  addLabelToIssue(
    @Param('issueId') issueId: string,
    @Param('labelId') labelId: string,
    @Req() req: any,
  ) {
    return this.labelsService.addLabelToIssue(issueId, labelId, req.user.id);
  }

  @Delete('issues/:issueId/labels/:labelId')
  removeLabelFromIssue(
    @Param('issueId') issueId: string,
    @Param('labelId') labelId: string,
    @Req() req: any,
  ) {
    return this.labelsService.removeLabelFromIssue(issueId, labelId, req.user.id);
  }
}
