import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './api-keys.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  list(@Request() req: any) {
    return this.apiKeysService.list(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(req.user.id, dto);
  }

  @Delete(':id')
  revoke(@Param('id') id: string, @Request() req: any) {
    return this.apiKeysService.revoke(id, req.user.id);
  }
}
