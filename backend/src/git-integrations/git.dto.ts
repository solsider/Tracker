import { IsString, IsOptional, IsUrl, IsDateString } from 'class-validator';

export class CreateBranchDto {
  @IsString() name: string;
  @IsOptional() @IsUrl() url?: string;
}

export class CreateCommitDto {
  @IsString() sha: string;
  @IsString() message: string;
  @IsOptional() @IsUrl() url?: string;
  @IsOptional() @IsString() authorName?: string;
  @IsOptional() @IsDateString() committedAt?: string;
}

export class CreatePRDto {
  @IsString() title: string;
  @IsString() number_: number;
  @IsUrl() url: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() authorName?: string;
}

export class GitHubWebhookDto {
  @IsString() action: string;
  repository: any;
  commits?: any[];
  pull_request?: any;
  ref?: string;
}
