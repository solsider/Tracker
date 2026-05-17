import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getMetricsSnapshot } from '../common/interceptors/metrics.interceptor';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  @Get()
  get() {
    return getMetricsSnapshot();
  }
}
