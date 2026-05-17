import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';

class UpdatePrefsDto {
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsIn(['none', 'daily', 'weekly']) @IsString() emailDigest?: string;
  @IsOptional() @IsBoolean() notifyAssigned?: boolean;
  @IsOptional() @IsBoolean() notifyMentioned?: boolean;
  @IsOptional() @IsBoolean() notifyComments?: boolean;
  @IsOptional() @IsBoolean() notifySprints?: boolean;
  @IsOptional() @IsBoolean() telegramEnabled?: boolean;
}

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class EmailPreferencesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async get(@Request() req: any) {
    const prefs = await this.prisma.userNotificationPreferences.findUnique({
      where: { userId: req.user.id },
    });
    return prefs ?? this.defaults(req.user.id);
  }

  @Put()
  async update(@Request() req: any, @Body() dto: UpdatePrefsDto) {
    return this.prisma.userNotificationPreferences.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...dto },
      update: dto,
    });
  }

  private defaults(userId: string) {
    return {
      userId,
      emailEnabled: true,
      emailDigest: 'none',
      notifyAssigned: true,
      notifyMentioned: true,
      notifyComments: false,
      notifySprints: true,
      telegramEnabled: false,
    };
  }
}
