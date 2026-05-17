import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /** Liveness probe — is the process alive? */
  @Get()
  liveness() {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      env: process.env.NODE_ENV || 'development',
    };
  }

  /** Readiness probe — can we serve traffic? (DB must be reachable) */
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        db: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'not ready',
        db: 'disconnected',
        error: process.env.NODE_ENV === 'production' ? 'DB check failed' : String(err),
        timestamp: new Date().toISOString(),
      });
    }
  }
}
