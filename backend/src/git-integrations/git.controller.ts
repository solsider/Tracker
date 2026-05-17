import {
  Controller, Get, Post, Delete, Param, Body, ParseIntPipe,
  UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GitService } from './git.service';
import { CreateBranchDto, CreateCommitDto, CreatePRDto } from './git.dto';

const BASE = 'projects/:projectId/issues/:number/git';

@Controller(BASE)
@UseGuards(JwtAuthGuard)
export class GitController {
  constructor(private gitService: GitService) {}

  @Get()
  links(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Request() req: any,
  ) {
    return this.gitService.getLinksForIssue(projectId, number, req.user.id);
  }

  @Post('branches')
  addBranch(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: CreateBranchDto,
    @Request() req: any,
  ) {
    return this.gitService.addBranch(projectId, number, dto, req.user.id);
  }

  @Post('commits')
  addCommit(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: CreateCommitDto,
    @Request() req: any,
  ) {
    return this.gitService.addCommit(projectId, number, dto, req.user.id);
  }

  @Post('pull-requests')
  addPR(
    @Param('projectId') projectId: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: CreatePRDto,
    @Request() req: any,
  ) {
    return this.gitService.addPR(projectId, number, dto, req.user.id);
  }
}

@Controller('git-branches')
@UseGuards(JwtAuthGuard)
export class GitBranchController {
  constructor(private gitService: GitService) {}

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.gitService.deleteBranch(id, req.user.id);
  }
}

@Controller('webhooks/github/:projectKey')
export class GitHubWebhookController {
  constructor(private gitService: GitService) {}

  @Post()
  @HttpCode(200)
  receive(@Param('projectKey') projectKey: string, @Body() payload: any) {
    return this.gitService.processGitHubWebhook(projectKey, payload);
  }
}
