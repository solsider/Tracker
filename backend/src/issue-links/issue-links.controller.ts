import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IssueLinksService } from './issue-links.service';
import { CreateIssueLinkDto } from './issue-links.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class IssueLinksController {
  constructor(private issueLinksService: IssueLinksService) {}

  @Get('issues/:issueId/links')
  getLinks(@Param('issueId') issueId: string, @Req() req: any) {
    return this.issueLinksService.getLinks(issueId, req.user.id);
  }

  @Post('issues/:issueId/links')
  createLink(
    @Param('issueId') issueId: string,
    @Body() dto: CreateIssueLinkDto,
    @Req() req: any,
  ) {
    return this.issueLinksService.createLink(issueId, dto, req.user.id);
  }

  @Delete('issue-links/:id')
  deleteLink(@Param('id') id: string, @Req() req: any) {
    return this.issueLinksService.deleteLink(id, req.user.id);
  }
}
