import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ColumnsService } from './columns.service';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './columns.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: Omit<User, 'password'>;
}

@Controller('projects/:projectId/columns')
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.columnsService.findAll(projectId, req.user.id);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.columnsService.create(projectId, dto, req.user.id);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderColumnsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.columnsService.reorder(projectId, dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.columnsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.columnsService.delete(id, req.user.id);
  }
}
