import { Controller, Post, Body, HttpCode, Ip, Req } from '@nestjs/common';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { Request } from 'express';
import { AppLogger } from '../common/logger/app-logger.service';
import { SkipThrottle } from '@nestjs/throttler';

class FrontendErrorDto {
  @IsString()
  @MaxLength(500)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  stack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;
}

@Controller('telemetry')
@SkipThrottle()
export class TelemetryController {
  private readonly logger = new AppLogger('FrontendCrash');

  @Post('crash')
  @HttpCode(204)
  reportCrash(@Req() req: Request, @Body() body: unknown, @Ip() ip: string) {
    let dto: Partial<FrontendErrorDto> = {};
    try {
      const raw = typeof body === 'string' ? body : JSON.stringify(body);
      dto = JSON.parse(raw);
    } catch {
      dto = { message: String(body).slice(0, 500) };
    }
    this.logger.error(`[FE] ${dto.message ?? 'unknown'}`, dto.stack, {
      url: dto.url,
      version: dto.version,
      requestId: req.requestId,
      ip,
    } as any);
  }
}
