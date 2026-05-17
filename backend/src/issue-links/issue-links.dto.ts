import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { IssueLinkType } from '@prisma/client';

export class CreateIssueLinkDto {
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsEnum(IssueLinkType)
  type: IssueLinkType;
}
