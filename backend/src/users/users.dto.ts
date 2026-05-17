import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  Length,
  IsEnum,
} from 'class-validator';
import { SystemRole } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

export class Verify2FADto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class AssignRoleDto {
  @IsEnum(SystemRole)
  systemRole: SystemRole;
}
