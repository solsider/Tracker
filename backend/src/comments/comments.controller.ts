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
} from '@nestjs/common';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './comments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: Omit<User, 'password'>;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('projects/:projectId/issues/:issueNumber/comments')
  findAll(
    @Param('projectId') projectId: string,
    @Param('issueNumber', ParseIntPipe) issueNumber: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.findByIssue(projectId, issueNumber, req.user.id);
  }

  @Post('projects/:projectId/issues/:issueNumber/comments')
  create(
    @Param('projectId') projectId: string,
    @Param('issueNumber', ParseIntPipe) issueNumber: number,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.create(projectId, issueNumber, dto, req.user.id);
  }

  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: { body: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commentsService.update(id, dto.body, req.user.id);
  }

  @Delete('comments/:id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.commentsService.delete(id, req.user.id);
  }
}
