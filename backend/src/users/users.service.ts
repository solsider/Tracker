import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import { User, SystemRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './users.dto';

export type SafeUser = Omit<User, 'password' | 'twoFactorSecret'>;

function safe(user: User): SafeUser {
  const { password: _, twoFactorSecret: __, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<SafeUser> {
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }
    const updated = await this.usersRepository.update(id, dto);
    return safe(updated);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, { password: hashed });
  }

  async assignRole(
    adminId: string,
    targetUserId: string,
    systemRole: SystemRole,
  ): Promise<SafeUser> {
    const admin = await this.usersRepository.findById(adminId);
    if (!admin || admin.systemRole !== SystemRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only System Admins can assign roles');
    }
    const target = await this.usersRepository.findById(targetUserId);
    if (!target) throw new NotFoundException('User not found');

    const updated = await this.usersRepository.update(targetUserId, { systemRole });
    return safe(updated);
  }

  async setup2FA(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Tracker', secret);

    await this.usersRepository.update(userId, { twoFactorSecret: secret });

    return { secret, otpauthUrl };
  }

  async enable2FA(userId: string, code: string): Promise<SafeUser> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('Run /2fa/setup first');
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) throw new UnauthorizedException('Invalid 2FA code');

    const updated = await this.usersRepository.update(userId, { twoFactorEnabled: true });
    return safe(updated);
  }

  async disable2FA(userId: string): Promise<SafeUser> {
    const updated = await this.usersRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    return safe(updated);
  }

  verifyTOTP(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }
}
