import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto, Verify2FADto, ChangePasswordDto, AssignRoleDto } from './users.dto';

interface AuthRequest extends Request {
  user: Omit<User, 'password'>;
}

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch()
  updateProfile(@Body() dto: UpdateProfileDto, @Req() req: AuthRequest) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('password')
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: AuthRequest) {
    return this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('2fa/setup')
  setup2FA(@Req() req: AuthRequest) {
    return this.usersService.setup2FA(req.user.id);
  }

  @Post('2fa/enable')
  enable2FA(@Body() dto: Verify2FADto, @Req() req: AuthRequest) {
    return this.usersService.enable2FA(req.user.id, dto.code);
  }

  @Delete('2fa')
  disable2FA(@Req() req: AuthRequest) {
    return this.usersService.disable2FA(req.user.id);
  }
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private usersService: UsersService) {}

  @Patch(':userId/role')
  assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: AuthRequest,
  ) {
    return this.usersService.assignRole(req.user.id, userId, dto.systemRole);
  }
}
