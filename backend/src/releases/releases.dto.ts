import { IsString, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { ReleaseStatus } from '@prisma/client';

export class CreateReleaseDto {
  @IsString() version: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ReleaseStatus) status?: ReleaseStatus;
  @IsOptional() @IsDateString() releasedAt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) issueIds?: string[];
}

export class UpdateReleaseDto {
  @IsOptional() @IsString() version?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ReleaseStatus) status?: ReleaseStatus;
  @IsOptional() @IsDateString() releasedAt?: string;
}
