import { IsString, IsOptional, MinLength, IsEnum, IsDateString, IsArray, IsInt, IsNumber, IsBoolean, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IssuePriority, IssueType } from '@prisma/client';

export class CreateIssueDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class FilterIssuesDto {
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  sprintId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  noSprint?: boolean;

  @IsOptional()
  @IsString()
  labelId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  deleted?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class MoveIssueDto {
  @IsString()
  columnId: string;

  @IsOptional()
  @IsString()
  afterId?: string;

  @IsOptional()
  @IsString()
  beforeId?: string;
}

class IssueOrderItem {
  @IsString()
  id: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderIssuesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueOrderItem)
  orders: IssueOrderItem[];
}
