import { IsString, IsOptional, MinLength, IsEnum } from 'class-validator';
import { GroupRole } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddGroupMemberDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(GroupRole)
  role?: GroupRole;
}
