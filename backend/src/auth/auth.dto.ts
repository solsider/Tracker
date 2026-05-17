import { IsEmail, IsString, MinLength, IsOptional, Length, IsEnum } from 'class-validator';
import { SystemRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(SystemRole)
  systemRole?: SystemRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;
}
