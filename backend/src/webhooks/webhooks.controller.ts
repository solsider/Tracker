import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto } from './webhooks.dto';

@Controller('projects/:projectId/webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  list(@Param('projectId') projectId: string, @Request() req: any) {
    return this.webhooksService.list(projectId, req.user.id);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateWebhookDto,
    @Request() req: any,
  ) {
    return this.webhooksService.create(projectId, dto, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @Request() req: any,
  ) {
    return this.webhooksService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.webhooksService.delete(id, req.user.id);
  }

  @Get(':id/deliveries')
  deliveries(@Param('id') id: string, @Request() req: any) {
    return this.webhooksService.getDeliveries(id, req.user.id);
  }
}
